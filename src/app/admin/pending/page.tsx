"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { PinGate } from "@/components/admin/PinGate";
import { Toast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  const [role, setRole] = useState<"admin" | "supreme">("admin");
  const [isDesktop, setIsDesktop] = useState(false);
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin");
    const storedRole = sessionStorage.getItem("admin-role");
    setAuthenticated(!!pin);
    setRole((storedRole as "admin" | "supreme") || "admin");
    setMounted(true);
    setIsDesktop(window.innerWidth >= 1024);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!mounted) return;
    if (!authenticated) return;
    
    fetchPending();
    
    const supabase = createClient();
    const channel = supabase
      .channel("pending-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, fetchPending)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "transactions" }, fetchPending)
      .subscribe();
    channelRef.current = channel;
    
    return () => { 
      if (channelRef.current) supabase.removeChannel(channelRef.current); 
    };
  }, [authenticated, fetchPending, mounted]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!authenticated) return <PinGate onAuthenticated={(r) => { setRole(r); setAuthenticated(true); }} />;

  if (role !== "supreme") {
    if (typeof window !== "undefined") window.location.href = "/admin";
    return null;
  }

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

  const handleDelete = async (id: string) => {
    const pin = sessionStorage.getItem("admin-pin");
    if (!pin) return;
    
    if (!confirm("Are you sure you want to delete this pending transaction? This cannot be undone.")) {
      return;
    }
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/delete-pending?pin=${pin}&id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setToast({ message: "Transaction deleted!", type: "success" });
        setPending((prev) => prev.filter((t) => t.id !== id));
      } else {
        setToast({ message: data.error || "Failed to delete", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally {
      setDeleting(null);
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
                <div className="pending-actions">
                  <button
                    onClick={() => handleApprove(t.id)}
                    disabled={approving === t.id}
                    className="pending-approve-btn"
                  >
                    {approving === t.id ? "Approving..." : "Approve & Add Votes"}
                  </button>
                  {isDesktop && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="pending-delete-btn"
                      title="Delete (Desktop only)"
                    >
                      {deleting === t.id ? "Deleting..." : "🗑️ Delete"}
                    </button>
                  )}
                </div>
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
        <Link href="/admin/pending" className="atab on">
          <i className="ti ti-file-check" />
          <span>Review</span>
        </Link>
        <Link href="/admin/transactions" className="atab">
          <i className="ti ti-receipt" />
          <span>Transactions</span>
        </Link>
        <button className="atab" onClick={() => { sessionStorage.removeItem("admin-pin"); window.location.reload(); }}>
          <i className="ti ti-lock" />
          <span>Lock</span>
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}