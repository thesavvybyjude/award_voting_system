"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PinGate } from "@/components/admin/PinGate";
import type { CategoryResult } from "@/types";

interface Stats {
  totalVotes: number;
  totalAmount: number;
  totalVoters: number;
  categoryResults: (CategoryResult & { emoji?: string })[];
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin");
    setAuthenticated(!!pin);
    setMounted(true);
  }, []);

  const fetchStats = useCallback(async () => {
    const pin = sessionStorage.getItem("admin-pin");
    if (!pin) return;
    try {
      const res = await fetch("/api/admin/stats", { headers: { "x-admin-pin": pin } });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStats();
      const iv = setInterval(fetchStats, 15000);
      return () => clearInterval(iv);
    }
  }, [authenticated, fetchStats, mounted]);

  if (!authenticated) return <PinGate onAuthenticated={() => setAuthenticated(true)} />;

  // Build top nominees across all categories
  const topNominees = stats
    ? stats.categoryResults
        .flatMap((cat) =>
          cat.nominees
            .filter((n) => n.totalVotes > 0)
            .map((n) => ({ ...n, categoryName: cat.categoryName }))
        )
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 8)
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-[6px] h-[6px] rounded-full bg-live" />
          <span className="text-[10px] text-live font-medium uppercase tracking-wider">Live</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] text-ink font-semibold" style={{ letterSpacing: "-0.01em" }}>Admin Dashboard</h1>
            <p className="text-[12px] text-ink-light font-medium">Real-time voting statistics</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-ink text-white text-[11px] font-medium px-3 py-2 rounded-lg"
          >
            <i className="ti ti-printer" style={{ fontSize: 14 }} />
            Print
          </button>
        </div>
      </div>

      <div className="scroll-area px-5 pb-24">
        {loading && !stats ? (
          <div className="grid grid-cols-2 gap-[6px] mt-3">
            {[1,2,3,4].map((i) => <div key={i} className="scard h-20 animate-pulse" />)}
          </div>
        ) : stats ? (
          <>
            {/* Stat Grid */}
            <div className="grid grid-cols-2 gap-[6px] mt-3 mb-6 animate-fade-in">
              <div className="scard dark">
                <div className="scard-label">Total Revenue</div>
                <div className="scard-value">₦{(stats.totalAmount / 100).toLocaleString()}</div>
                <div className="scard-sub">{stats.totalVoters} transactions</div>
              </div>
              <div className="scard">
                <div className="scard-label">Total Votes</div>
                <div className="scard-value">{stats.totalVotes.toLocaleString()}</div>
                <div className="scard-sub">across {stats.categoryResults.length} awards</div>
              </div>
              <div className="scard">
                <div className="scard-label">Avg per Transaction</div>
                <div className="scard-value">
                  {stats.totalVoters > 0 ? Math.round(stats.totalVotes / stats.totalVoters) : 0}
                </div>
                <div className="scard-sub">votes</div>
              </div>
              <div className="scard">
                <div className="scard-label">Transactions</div>
                <div className="scard-value">{stats.totalVoters}</div>
                <div className="scard-sub">completed</div>
              </div>
            </div>

            {/* Top Nominees */}
            <div className="mb-4">
              <div className="text-[13px] font-semibold text-ink mb-3 pb-2 border-b border-border-light">Top Nominees</div>
              {topNominees.map((n, i) => (
                <div key={n.nomineeId} className="top-row animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                  <span className="top-rank">{i + 1}</span>
                  <div className="ncard-avatar" style={{ width: 32, height: 32, fontSize: 10 }}>
                    {n.nomineeName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink truncate">{n.nomineeName}</div>
                    <div className="text-[10px] text-ink-muted">{n.categoryName}</div>
                  </div>
                  <span className="top-votes">{n.totalVotes}</span>
                  {i === 0 && <i className="ti ti-crown" style={{ fontSize: 14, color: "#C8BF9E" }} />}
                </div>
              ))}
              {topNominees.length === 0 && (
                <p className="text-[12px] text-ink-muted py-4">No votes recorded yet.</p>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Admin Tabs */}
      <div className="atabs">
        <button className="atab on">
          <i className="ti ti-layout-dashboard" />
          <span>Overview</span>
        </button>
        <Link href="/admin/results" className="atab">
          <i className="ti ti-trophy" />
          <span>Results</span>
        </Link>
        <button className="atab" onClick={() => { sessionStorage.removeItem("admin-pin"); window.location.reload(); }}>
          <i className="ti ti-lock" />
          <span>Lock</span>
        </button>
      </div>
    </div>
  );
}
