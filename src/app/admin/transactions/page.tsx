"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { PinGate } from "@/components/admin/PinGate";
import { Toast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Transaction {
  id: string;
  reference: string;
  amount_total: number;
  total_votes: number;
  status: string;
  payment_provider: string;
  created_at: string;
  approved_at: string | null;
  payer_name: string | null;
  payer_phone: string | null;
}

export default function TransactionsPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin");
    setAuthenticated(!!pin);
    setMounted(true);
  }, []);

  const fetchTransactions = useCallback(async () => {
    const pin = sessionStorage.getItem("admin-pin");
    if (!pin) return;
    try {
      const res = await fetch(`/api/admin/transactions?pin=${pin}`);
      const data = await res.json();
      if (data.success) setTransactions(data.transactions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!authenticated) return;

    fetchTransactions();

    const supabase = createClient();
    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchTransactions)
      .subscribe();
    channelRef.current = channel;

    return () => { 
      if (channelRef.current) supabase.removeChannel(channelRef.current); 
    };
  }, [authenticated, fetchTransactions, mounted]);

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "paystack": return "Paystack";
      case "flutterwave": return "Flutterwave";
      case "manual": return "Bank Transfer";
      default: return provider;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success": 
        return <span className="status-badge success">Approved</span>;
      case "pending": 
        return <span className="status-badge pending">Pending</span>;
      case "failed": 
        return <span className="status-badge failed">Failed</span>;
      default: 
        return status;
    }
  };

  const downloadPDF = () => {
    const now = new Date().toLocaleString();
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Log - Faculty Awards 2026</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          .date { font-size: 12px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #333; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .success { color: green; }
          .pending { color: orange; }
          .failed { color: red; }
          .total-row { font-weight: bold; background: #eee; }
          .summary { margin-top: 20px; padding: 10px; background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>🏆 Faculty of Computing Awards 2026</h1>
        <p class="date">Transaction Log - Generated: ${now}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Amount (₦)</th>
              <th>Votes</th>
              <th>Status</th>
              <th>Payer</th>
            </tr>
          </thead>
          <tbody>
    `;

    let totalAmount = 0;
    let totalVotes = 0;
    let successCount = 0;
    let pendingCount = 0;

    transactions.forEach((t) => {
      const date = new Date(t.created_at).toLocaleDateString();
      const amount = t.amount_total / 100;
      const statusClass = t.status === "success" ? "success" : t.status === "pending" ? "pending" : "failed";
      
      totalAmount += amount;
      totalVotes += t.total_votes;
      if (t.status === "success") successCount++;
      if (t.status === "pending") pendingCount++;

      html += `
        <tr>
          <td>${date}</td>
          <td>${t.reference}</td>
          <td>${getProviderLabel(t.payment_provider)}</td>
          <td>${amount.toLocaleString()}</td>
          <td>${t.total_votes}</td>
          <td class="${statusClass}">${t.status.toUpperCase()}</td>
          <td>${t.payer_name || "-"}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        <div class="summary">
          <strong>Summary:</strong><br/>
          Total Transactions: ${transactions.length}<br/>
          Approved: ${successCount} | Pending: ${pendingCount}<br/>
          Total Amount: ₦${totalAmount.toLocaleString()}<br/>
          Total Votes: ${totalVotes}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!authenticated) return <PinGate onAuthenticated={() => setAuthenticated(true)} />;

  const totalAmount = transactions.reduce((sum, t) => sum + (t.status === "success" ? t.amount_total / 100 : 0), 0);
  const _totalVotes = transactions.reduce((sum, t) => sum + (t.status === "success" ? t.total_votes : 0), 0);
  const successCount = transactions.filter(t => t.status === "success").length;
  const pendingCount = transactions.filter(t => t.status === "pending").length;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-[6px] h-[6px] rounded-full bg-live" />
          <span className="text-[10px] text-live font-medium uppercase tracking-wider">Live</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] text-ink font-semibold">Transaction Log</h1>
            <p className="text-[12px] text-ink-light font-medium">All payment transactions</p>
          </div>
          <button onClick={downloadPDF} className="flex items-center gap-2 bg-ink text-white text-[11px] font-medium px-3 py-2 rounded-lg">
            <i className="ti ti-download" style={{ fontSize: 14 }} />
            Download PDF
          </button>
        </div>
      </div>

      <div className="px-5">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="stat-card">
            <div className="stat-label">Total</div>
            <div className="stat-value">{transactions.length}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{successCount}</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{pendingCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Revenue</div>
            <div className="stat-value">₦{totalAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="scroll-area px-5 pb-24">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-12 bg-surface-alt rounded" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <i className="ti ti-receipt" style={{ fontSize: 48, opacity: 0.3 }} />
            <p className="text-[14px] text-ink-muted mt-3">No transactions yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Votes</th>
                  <th>Status</th>
                  <th>Payer</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="text-[11px]">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="text-[10px] font-mono">{t.reference}</td>
                    <td>
                      <span className={`provider-tag ${t.payment_provider}`}>
                        {getProviderLabel(t.payment_provider)}
                      </span>
                    </td>
                    <td className="font-semibold">₦{(t.amount_total / 100).toLocaleString()}</td>
                    <td>{t.total_votes}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td className="text-[11px]">{t.payer_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <Link href="/admin/pending" className="atab">
          <i className="ti ti-file-check" />
          <span>Review</span>
        </Link>
        <Link href="/admin/transactions" className="atab on">
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