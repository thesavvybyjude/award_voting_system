"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { PinGate } from "@/components/admin/PinGate";
import { createClient } from "@/lib/supabase/client";
import type { CategoryResult } from "@/types";
import { EVENT_NAME } from "@/lib/awards.config";
import type { RealtimeChannel } from "@supabase/supabase-js";

export default function RealtimeResultsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [categories, setCategories] = useState<CategoryResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchResults = useCallback(async () => {
    const pin = sessionStorage.getItem("admin-pin");
    if (!pin) return;
    try {
      const res = await fetch("/api/admin/stats", { headers: { "x-admin-pin": pin } });
      const data = await res.json();
      if (data.success) {
        setCategories(data.stats.categoryResults);
        setTotalVotes(data.stats.totalVotes);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin");
    setAuthenticated(!!pin);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authenticated) return;
    const supabase = createClient();
    const channel = supabase
      .channel("votes-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, fetchResults)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, fetchResults)
      .subscribe();
    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [authenticated, fetchResults, mounted]);

  const handlePrint = () => {
    window.print();
  };

  if (!authenticated) return <PinGate onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: absolute; left: 0; top: 0; width: 100%;
            background: white !important;
            color: black !important;
            padding: 40px !important;
          }
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
          #print-area .bar-crown { color: #333 !important; }
        }
      `}</style>

      <div className="flex flex-col min-h-screen bg-surface no-print">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-[6px] h-[6px] rounded-full bg-live animate-pulse" />
            <span className="text-[10px] text-live font-medium uppercase tracking-wider">Live</span>
            <span className="text-[11px] text-ink-muted ml-auto font-medium">{totalVotes.toLocaleString()} total votes</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] text-ink font-semibold" style={{ letterSpacing: "-0.01em" }}>Results</h1>
              <p className="text-[12px] text-ink-light font-medium">Live vote tallies by category</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-ink text-white text-[11px] font-medium px-3 py-2 rounded-lg"
            >
              <i className="ti ti-printer" style={{ fontSize: 14 }} />
              Print PDF
            </button>
          </div>
        </div>

        <div className="scroll-area px-5 pb-24">
          {loading ? (
            <div className="mt-4 space-y-6">
              {[1,2,3].map((i) => (
                <div key={i}>
                  <div className="h-3 w-24 bg-surface-alt rounded mb-3" />
                  <div className="space-y-2">
                    {[1,2,3].map((j) => <div key={j} className="h-4 bg-surface-alt rounded" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : !categories.length ? (
            <div className="text-center py-12">
              <i className="ti ti-chart-bar text-4xl text-ink-muted mb-4" style={{ fontSize: 40, opacity: 0.3 }} />
              <p className="text-ink-muted text-[14px]">No votes yet</p>
              <p className="text-ink-muted text-[12px] mt-1">Votes will appear here once voting starts</p>
            </div>
          ) : (
            categories.map((cat, ci) => {
              const maxVotes = Math.max(...cat.nominees.map((n) => n.totalVotes), 1);
              return (
                <div key={cat.categoryId} className="mb-5 animate-fade-in" style={{ animationDelay: `${ci * 0.06}s` }}>
                  <div className="text-[13px] font-semibold text-ink pb-2 mb-3 border-b border-border-light">
                    {cat.categoryName}
                  </div>
                  {cat.nominees.map((n, ni) => {
                    const pct = n.totalVotes > 0 ? (n.totalVotes / maxVotes) * 100 : 0;
                    const isLeader = ni === 0 && n.totalVotes > 0;
                    return (
                      <div key={n.nomineeId} className="bar-row">
                        <span className="bar-name">{n.nomineeName}</span>
                        <div className="bar-track">
                          <div className={`bar-fill ${ni === 1 ? "s2" : ni >= 2 ? "s3" : ""}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="bar-count">{n.totalVotes}</span>
                        {isLeader ? <span className="bar-crown"><i className="ti ti-crown" /></span> : <span className="bar-crown" />}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Admin Tabs */}
        <div className="atabs">
          <Link href="/admin" className="atab">
            <i className="ti ti-layout-dashboard" />
            <span>Overview</span>
          </Link>
          <button className="atab on">
            <i className="ti ti-trophy" />
            <span>Results</span>
          </button>
          <button className="atab" onClick={() => { sessionStorage.removeItem("admin-pin"); window.location.reload(); }}>
            <i className="ti ti-lock" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Print-only view */}
      <div id="print-area" className="hidden print:block p-10">
        <div className="print-header">{EVENT_NAME}</div>
        <div className="print-sub">Live Voting Results — {totalVotes.toLocaleString()} total votes</div>
        {categories.map((cat) => {
          const maxVotes = Math.max(...cat.nominees.map((n) => n.totalVotes), 1);
          return (
            <div key={cat.categoryId}>
              <div className="print-cat">{cat.categoryName}</div>
              {cat.nominees.map((n, ni) => {
                const pct = n.totalVotes > 0 ? (n.totalVotes / maxVotes) * 100 : 0;
                const isLeader = ni === 0 && n.totalVotes > 0;
                return (
                  <div key={n.nomineeId} className="bar-row">
                    <span className="bar-name">{n.nomineeName}{isLeader ? " *" : ""}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="bar-count">{n.totalVotes}</span>
                    {isLeader && <span className="bar-crown">👑</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="print-date">
          Generated: {new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
          <br />* = current leader
        </div>
      </div>
    </>
  );
}
