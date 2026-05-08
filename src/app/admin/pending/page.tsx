"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PinGate } from "@/components/admin/PinGate";
import { Toast } from "@/components/Toast";

interface PendingTransaction {
  id: string;
  reference: string;
  amount_total: number;
  total_votes: number;
  created_at: string;
  vote_selections: Array<{
    categoryName: string;
    nomineeName: string;
    votes: number;
  }>;
  payer_name: string | null;
  payer_phone: string | null;
}

export default function AdminPendingPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin");
    setAuthenticated(!!pin);
    setMounted(true);
  }, []);

  const fetchPending = useCallback(async () => {
    const pin = sessionStorage.getItem("admin-pin");
    if (!pin) return;
    try {
      const res = await fetch(`/api/admin/pending?pin=${pin}`);
      const data = await res.json();
      if (data.success) setPending(data.transactions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authenticated) {
      fetchPending();
      const iv = setInterval(fetchPending, 10000);
      return () => clearInterval(iv);
    }
  }, [authenticated, fetchPending, mounted]);

  if (!authenticated) return <PinGate onAuthenticated={() => setAuthenticated(true)} />;

  const handleApprove = async (id: string) => {
    const pin = sessionStorage.getItem("admin-pin");
    if (!pin) return;
    
    setApproving(id);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id, pin }),
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Transaction approved!", type: "success" });
        setPending((prev) => prev.filter((t) => t.id !== id));
      } else {
        setToast({ message: data.error || "Failed to approve", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-[6px] h-[6px] rounded-full bg-live" />
          <span className="text-[10px] text-live font-medium uppercase tracking-wider">Live</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] text-ink font-semibold" style={{ letterSpacing: "-0.01em" }}>Pending Transfers</h1>
            <p className="text-[12px] text-ink-light font-medium">Awaiting bank transfer confirmation</p>
          </div>
        </div>
      </div>

      <div className="scroll-area px-5 pb-24">
        {loading ? (
          <div className="space-y-3 mt-3">
            {[1,2,3].map((i) => <div key={i} className="pending-card animate-pulse" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-12">
            <i className="ti ti-check-circle" style={{ fontSize: 48, color: "#22C55E" }} />
            <p className="text-[14px] text-ink-muted mt-3">No pending transactions</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {pending.map((t) => (
              <div key={t.id} className="pending-card animate-fade-in">
                <div className="pending-header">
                  <span className="pending-ref">{t.reference}</span>
                  <span className="pending-amount">₦{(t.amount_total / 100).toLocaleString()}</span>
                </div>
                <div className="pending-meta">
                  {t.total_votes} votes · {new Date(t.created_at).toLocaleString()}
                </div>
                {t.payer_name && (
                  <div className="pending-payer">
                    From: {t.payer_name} {t.payer_phone && `(${t.payer_phone})`}
                  </div>
                )}
                <div className="pending-votes">
                  {t.vote_selections?.map((v, i) => (
                    <span key={i} className="pending-vote-tag">{v.nomineeName} ×{v.votes}</span>
                  ))}
                </div>
                <button
                  onClick={() => handleApprove(t.id)}
                  disabled={approving === t.id}
                  className="pending-approve-btn"
                >
                  {approving === t.id ? "Approving..." : "Approve & Add Votes"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="atabs">
        <Link href="/admin" className="atab">
          <i className="ti ti-layout-dashboard" />
          <span>Overview</span>
        </Link>
        <Link href="/admin/results" className="atab">
          <i className="ti ti-trophy" />
          <span>Results</span>
        </Link>
        <button className="atab on">
          <i className="ti ti-clock" />
          <span>Pending</span>
        </button>
        <button className="atab" onClick={() => { sessionStorage.removeItem("admin-pin"); window.location.reload(); }}>
          <i className="ti ti-lock" />
          <span>Lock</span>
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}