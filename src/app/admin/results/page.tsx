"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PinGate } from "@/components/admin/PinGate";
import { createClient } from "@/lib/supabase/client";
import { awardsConfig } from "@/lib/awards.config";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface NomineeVotes {
  id: string;
  name: string;
  votes: number;
}

interface CategoryWithVotes {
  id: string;
  name: string;
  nominees: NomineeVotes[];
}

export default function ResultsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalVotes, setTotalVotes] = useState(0);
  const [categories, setCategories] = useState<CategoryWithVotes[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin");
    setAuthenticated(!!pin);
    setMounted(true);
  }, []);

  const loadResults = async () => {
    if (!authenticated) return;
    
    try {
      const supabase = createClient();
      
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("category_id, nominee_id, vote_count");

      if (votesError) {
        console.error("Votes query error:", votesError);
        setError(votesError.message);
        setLoading(false);
        return;
      }

      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("id")
        .eq("status", "success");

      if (txError) {
        console.error("Transactions query error:", txError);
      }

      const total = (votesData || []).reduce((sum, v) => sum + (v.vote_count || 0), 0);
      setTotalVotes(total);

      const voteMap: Record<string, number> = {};
      (votesData || []).forEach((v) => {
        const key = `${v.category_id}-${v.nominee_id}`;
        voteMap[key] = (voteMap[key] || 0) + (v.vote_count || 0);
      });

      const cats = awardsConfig.map((cat) => ({
        id: cat.id,
        name: cat.name,
        nominees: cat.nominees.map((nom) => ({
          id: nom.id,
          name: nom.name,
          votes: voteMap[`${cat.id}-${nom.id}`] || 0,
        })).sort((a, b) => b.votes - a.votes),
      }));

      setCategories(cats);
      setError(null);
    } catch (err) {
      console.error("Load results error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    if (!authenticated) return;

    loadResults();

    const supabase = createClient();
    const channel = supabase
      .channel("results-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, () => {
        setRefreshKey((k) => k + 1);
        loadResults();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        loadResults();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [authenticated, mounted]);

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    setLoading(true);
    loadResults();
  };

  if (!authenticated) return <PinGate onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; background: white !important; color: black !important; padding: 40px !important; }
          .no-print { display: none !important; }
          #print-area .bar-track { background: #e5e5e5 !important; border-radius: 4px; height: 12px; }
          #print-area .bar-fill { background: #333 !important; height: 100%; border-radius: 4px; }
          #print-area .bar-row { display: flex !important; align-items: center !important; gap: 8px !important; margin-bottom: 12px !important; }
          #print-area .bar-name { min-width: 200px !important; font-size: 12px !important; color: black !important; }
          #print-area .bar-track { flex: 1 !important; }
          #print-area .bar-count { min-width: 40px !important; text-align: right !important; font-size: 12px !important; color: black !important; }
          #print-area .print-cat { font-size: 13px !important; font-weight: bold !important; margin-top: 24px !important; margin-bottom: 8px !important; border-bottom: 2px solid #333 !important; padding-bottom: 4px !important; color: black !important; }
          #print-area .print-header { font-size: 18px !important; font-weight: bold !important; margin-bottom: 4px !important; color: black !important; }
          #print-area .print-sub { font-size: 12px !important; margin-bottom: 16px !important; color: #666 !important; }
          #print-area .print-date { font-size: 11px !important; color: #999 !important; margin-top: 24px !important; }
        }
      `}</style>

      <div className="flex flex-col min-h-screen bg-surface no-print">
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-[6px] h-[6px] rounded-full bg-live animate-pulse" />
            <span className="text-[10px] text-live font-medium uppercase tracking-wider">Live</span>
            <span className="text-[11px] text-ink-muted ml-auto font-medium">{totalVotes.toLocaleString()} total votes</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] text-ink font-semibold">Results</h1>
              <p className="text-[12px] text-ink-light font-medium">Live vote tallies by category</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleRefresh} className="flex items-center gap-1.5 bg-ink text-white text-[11px] font-medium px-3 py-2 rounded-lg">
                <i className="ti ti-refresh" style={{ fontSize: 14 }} />
                Refresh
              </button>
              <button onClick={handlePrint} className="flex items-center gap-1.5 bg-ink text-white text-[11px] font-medium px-3 py-2 rounded-lg">
                <i className="ti ti-printer" style={{ fontSize: 14 }} />
                Print
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-5 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-[12px] text-red-600">Error: {error}</p>
          </div>
        )}

        <div className="scroll-area px-5 pb-24">
          {loading ? (
            <div className="mt-4 space-y-6">
              {[1,2,3,4,5].map((i) => (
                <div key={i}>
                  <div className="h-4 w-32 bg-surface-alt rounded mb-3" />
                  <div className="space-y-2">
                    {[1,2,3].map((j) => <div key={j} className="h-5 bg-surface-alt rounded" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <i className="ti ti-chart-bar text-4xl text-ink-muted mb-4" style={{ fontSize: 40, opacity: 0.3 }} />
              <p className="text-ink-muted text-[14px]">No votes yet</p>
              <p className="text-ink-muted text-[12px] mt-1">Votes will appear here once voting starts</p>
            </div>
          ) : (
            categories.map((cat, ci) => {
              const maxVotes = Math.max(...cat.nominees.map((n) => n.votes), 1);
              return (
                <div key={cat.id} className="mb-6 animate-fade-in" style={{ animationDelay: `${ci * 0.05}s` }}>
                  <div className="text-[14px] font-bold text-ink pb-2 mb-3 border-b border-border-light">
                    {cat.name}
                  </div>
                  {cat.nominees.map((nom, ni) => {
                    const pct = nom.votes > 0 ? (nom.votes / maxVotes) * 100 : 0;
                    const isLeader = ni === 0 && nom.votes > 0;
                    return (
                      <div key={nom.id} className="bar-row py-2">
                        <span className="bar-name text-[13px]">{nom.name}</span>
                        <div className="bar-track flex-1 mx-3">
                          <div 
                            className={`bar-fill h-2 ${isLeader ? "" : "opacity-60"}`} 
                            style={{ width: `${pct}%`, minWidth: pct > 0 ? "4px" : "0" }} 
                          />
                        </div>
                        <span className="text-[13px] font-semibold text-ink min-w-[40px] text-right">{nom.votes}</span>
                        {isLeader && <span className="ml-1">👑</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="atabs">
          <Link href="/admin" className="atab">
            <i className="ti ti-layout-dashboard" />
            <span>Overview</span>
          </Link>
          <button className="atab on">
            <i className="ti ti-trophy" />
            <span>Results</span>
          </button>
          <Link href="/admin/pending" className="atab">
            <i className="ti ti-file-check" />
            <span>Review</span>
          </Link>
          <button className="atab" onClick={() => { sessionStorage.removeItem("admin-pin"); window.location.reload(); }}>
            <i className="ti ti-lock" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      <div id="print-area" className="hidden print:block p-10">
        <div className="text-xl font-bold mb-2">Faculty of Computing Awards 2026</div>
        <div className="text-sm text-gray-600 mb-6">Live Voting Results — {totalVotes.toLocaleString()} total votes</div>
        {categories.map((cat) => {
          const maxVotes = Math.max(...cat.nominees.map((n) => n.votes), 1);
          return (
            <div key={cat.id} className="mb-4">
              <div className="font-bold border-b border-gray-300 pb-1 mb-2">{cat.name}</div>
              {cat.nominees.map((nom, ni) => {
                const pct = nom.votes > 0 ? (nom.votes / maxVotes) * 100 : 0;
                const isLeader = ni === 0 && nom.votes > 0;
                return (
                  <div key={nom.id} className="flex items-center gap-2 mb-1">
                    <span className="min-w-[200px]">{nom.name}{isLeader ? " *" : ""}</span>
                    <div className="flex-1 bg-gray-200 h-3 rounded">
                      <div className="bg-gray-800 h-full rounded" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-[40px] text-right">{nom.votes}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="text-xs text-gray-500 mt-6">
          Generated: {new Date().toLocaleString()}
        </div>
      </div>
    </>
  );
}