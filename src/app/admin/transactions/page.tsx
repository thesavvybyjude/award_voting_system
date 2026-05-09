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
  const [role, setRole] = useState<"admin" | "supreme">("admin");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const pin = sessionStorage.getItem("admin-pin");
    const storedRole = sessionStorage.getItem("admin-role");
    setAuthenticated(!!pin);
    setRole((storedRole as "admin" | "supreme") || "admin");
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
    
    const bankSuccess = transactions.filter(t => t.payment_provider === "manual" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const bankPending = transactions.filter(t => t.payment_provider === "manual" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const bankFailed = transactions.filter(t => t.payment_provider === "manual" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const flutterSuccess = transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const flutterPending = transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const flutterFailed = transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const paystackSuccess = transactions.filter(t => t.payment_provider === "paystack" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const paystackPending = transactions.filter(t => t.payment_provider === "paystack" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const paystackFailed = transactions.filter(t => t.payment_provider === "paystack" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    
    const confirmed = transactions.filter(t => t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const pending = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const failed = transactions.filter(t => t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const totalValue = transactions.reduce((sum, t) => sum + (t.amount_total / 100), 0);
    const totalVotes = transactions.reduce((sum, t) => sum + t.total_votes, 0);
    const successCount = transactions.filter(t => t.status === "success").length;
    const pendingCount = transactions.filter(t => t.status === "pending").length;
    const failedCount = transactions.filter(t => t.status === "failed").length;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Log - Faculty Awards 2026</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 18px; margin-bottom: 5px; }
          h2 { font-size: 14px; margin: 20px 0 10px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          .date { font-size: 12px; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
          th { background: #333; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .success { color: green; }
          .pending { color: orange; }
          .failed { color: red; }
          .summary-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .summary-stat { background: #f5f5f5; padding: 10px; border-radius: 5px; text-align: center; }
          .summary-stat-label { font-size: 9px; color: #666; text-transform: uppercase; }
          .summary-stat-value { font-size: 16px; font-weight: bold; }
          .int-box { padding: 10px; border-radius: 5px; text-align: center; }
          .int-box.confirmed { background: #dcfce7; border: 1px solid #86efac; }
          .int-box.pending { background: #fef3c7; border: 1px solid #fcd34d; }
          .int-box.failed { background: #fee2e2; border: 1px solid #fecaca; }
          .int-label { font-size: 9px; font-weight: bold; text-transform: uppercase; }
          .int-value { font-size: 14px; font-weight: bold; }
          .comparison-table { width: 100%; font-size: 10px; }
          .comparison-table th { background: #f5f5f5; }
          .obs-box { background: #f5f5f5; padding: 10px; border-left: 3px solid #333; font-size: 11px; }
          .obs-list { margin: 0; padding-left: 15px; }
          .obs-list li { margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <h1>Faculty of Computing Awards 2026 - Transaction Report</h1>
        <p class="date">Generated: ${now}</p>
        
        <h2>Overall Summary</h2>
        <div class="summary-box">
          <div class="summary-stat">
            <div class="summary-stat-label">Total Transactions</div>
            <div class="summary-stat-value">${transactions.length}</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-label">Total Votes</div>
            <div class="summary-stat-value">${totalVotes}</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-label">Total Value</div>
            <div class="summary-stat-value">₦${totalValue.toLocaleString()}</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-label">Success Rate</div>
            <div class="summary-stat-value" style="color:green">${transactions.length > 0 ? Math.round((successCount / transactions.length) * 100) : 0}%</div>
          </div>
        </div>

        <h2>Breakdown by Payment Gateway</h2>
        <table>
          <thead><tr><th>Gateway</th><th>Successful</th><th>Pending</th><th>Failed</th></tr></thead>
          <tbody>
            <tr><td>Bank Transfer</td><td>₦${bankSuccess.toLocaleString()}</td><td>₦${bankPending.toLocaleString()}</td><td>₦${bankFailed.toLocaleString()}</td></tr>
            <tr><td>Flutterwave</td><td>₦${flutterSuccess.toLocaleString()}</td><td>₦${flutterPending.toLocaleString()}</td><td>₦${flutterFailed.toLocaleString()}</td></tr>
            <tr><td>Paystack</td><td>₦${paystackSuccess.toLocaleString()}</td><td>₦${paystackPending.toLocaleString()}</td><td>₦${paystackFailed.toLocaleString()}</td></tr>
          </tbody>
        </table>

        <h2>Financial Interpretation</h2>
        <div class="summary-box">
          <div class="int-box confirmed">
            <div class="int-label" style="color:#16a34a">Confirmed</div>
            <div class="int-value">₦${confirmed.toLocaleString()}</div>
          </div>
          <div class="int-box pending">
            <div class="int-label" style="color:#d97706">Pending</div>
            <div class="int-value">₦${pending.toLocaleString()}</div>
          </div>
          <div class="int-box failed">
            <div class="int-label" style="color:#dc2626">Failed</div>
            <div class="int-value">₦${failed.toLocaleString()}</div>
          </div>
          <div class="int-box" style="background:#f5f5f5;border:1px solid #ddd">
            <div class="int-label">Gross Total</div>
            <div class="int-value">₦${totalValue.toLocaleString()}</div>
          </div>
        </div>

        <h2>Transaction Details</h2>
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

    transactions.forEach((t) => {
      const date = new Date(t.created_at).toLocaleDateString();
      const amount = t.amount_total / 100;
      const statusClass = t.status === "success" ? "success" : t.status === "pending" ? "pending" : "failed";

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

        <h2>Key Observations</h2>
        <div class="obs-box">
          <ul class="obs-list">
            ${bankPending > 0 ? `<li><strong>${transactions.filter(t => t.payment_provider === "manual" && t.status === "pending").length} pending Bank Transfers</strong> require manual verification.</li>` : ''}
            ${flutterFailed > 0 ? `<li><strong>${transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "failed").length} failed Flutterwave transactions</strong> detected.</li>` : ''}
            <li><strong>₦${confirmed.toLocaleString()}</strong> confirmed is already in your account.</li>
            ${transactions.filter(t => t.payment_provider === "manual").length > transactions.filter(t => t.payment_provider !== "manual").length ? '<li>Bank Transfer is your dominant payment method.</li>' : ''}
          </ul>
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

  if (!authenticated) return <PinGate onAuthenticated={(r) => { setRole(r); setAuthenticated(true); }} />;

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
          <>
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

            <div className="financial-summary">
              <div className="financial-summary-header">
                <i className="ti ti-chart-pie" />
                <span>Financial Summary</span>
              </div>
              <div className="financial-summary-content">
                <div className="fs-section">
                  <div className="fs-section-title">Overall Summary</div>
                  <div className="fs-grid">
                    <div className="fs-stat">
                      <div className="fs-stat-label">Total Transactions</div>
                      <div className="fs-stat-value">{transactions.length}</div>
                    </div>
                    <div className="fs-stat">
                      <div className="fs-stat-label">Total Votes</div>
                      <div className="fs-stat-value">{transactions.reduce((sum, t) => sum + t.total_votes, 0)}</div>
                    </div>
                    <div className="fs-stat">
                      <div className="fs-stat-label">Total Value</div>
                      <div className="fs-stat-value">₦{transactions.reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</div>
                    </div>
                    <div className="fs-stat">
                      <div className="fs-stat-label">Success Rate</div>
                      <div className="fs-stat-value green">{transactions.length > 0 ? Math.round((transactions.filter(t => t.status === "success").length / transactions.length) * 100) : 0}%</div>
                    </div>
                  </div>
                </div>

                <div className="fs-section">
                  <div className="fs-section-title">Breakdown by Payment Gateway</div>
                  
                  <div className="fs-gateway">
                    <div className="fs-gateway-title bank"><i className="ti ti-building-bank" /> Bank Transfer</div>
                    <div className="fs-gateway-grid">
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Successful</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "manual" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Pending</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "manual" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Failed</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "manual" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="fs-gateway">
                    <div className="fs-gateway-title flutterwave"><i className="ti ti-credit-card" /> Flutterwave</div>
                    <div className="fs-gateway-grid">
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Successful</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Pending</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Failed</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="fs-gateway">
                    <div className="fs-gateway-title paystack"><i className="ti ti-wallet" /> Paystack</div>
                    <div className="fs-gateway-grid">
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Successful</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "paystack" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Pending</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "paystack" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="fs-gateway-stat">
                        <div className="fs-gateway-stat-label">Failed</div>
                        <div className="fs-gateway-stat-value">
                          ₦{transactions.filter(t => t.payment_provider === "paystack" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fs-section">
                  <div className="fs-section-title">Financial Interpretation</div>
                  <div className="fs-interpretation">
                    <div className="fs-int-box confirmed">
                      <div className="fs-int-label confirmed">Money Already Confirmed</div>
                      <div className="fs-int-value">₦{transactions.filter(t => t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</div>
                      <div className="fs-int-sub">In your account now</div>
                    </div>
                    <div className="fs-int-box pending">
                      <div className="fs-int-label pending">Money Still Pending</div>
                      <div className="fs-int-value">₦{transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</div>
                      <div className="fs-int-sub">Awaiting verification</div>
                    </div>
                    <div className="fs-int-box failed">
                      <div className="fs-int-label failed">Money Lost / Failed</div>
                      <div className="fs-int-value">₦{transactions.filter(t => t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</div>
                      <div className="fs-int-sub">Not in your account</div>
                    </div>
                  </div>
                </div>

                <div className="fs-section">
                  <div className="fs-section-title">Gateway Comparison</div>
                  <table className="fs-comparison-table">
                    <thead>
                      <tr>
                        <th>Gateway</th>
                        <th>Successful Amount</th>
                        <th>Pending</th>
                        <th>Failed</th>
                        <th>Total Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Bank Transfer</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "manual" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "manual" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "manual" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "manual").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Flutterwave</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "flutterwave").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td>Paystack</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "paystack" && t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "paystack" && t.status === "pending").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "paystack" && t.status === "failed").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                        <td>₦{transactions.filter(t => t.payment_provider === "paystack").reduce((sum, t) => sum + (t.amount_total / 100), 0).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="fs-section">
                  <div className="fs-section-title">Key Observations</div>
                  <div className="fs-observations">
                    <div className="fs-obs-title">Analysis</div>
                    <ul className="fs-obs-list">
                      {(() => {
                        const bankPending = transactions.filter(t => t.payment_provider === "manual" && t.status === "pending").length;
                        const flutterwaveFailed = transactions.filter(t => t.payment_provider === "flutterwave" && t.status === "failed").length;
                        const confirmed = transactions.filter(t => t.status === "success").reduce((sum, t) => sum + (t.amount_total / 100), 0);
                        const total = transactions.reduce((sum, t) => sum + (t.amount_total / 100), 0);
                        
                        return (
                          <>
                            {bankPending > 0 && (
                              <li>
                                <span className="fs-obs-highlight">{bankPending} pending Bank Transfers</span> require manual verification. Consider auto-confirmation or batch processing.
                              </li>
                            )}
                            {flutterwaveFailed > 0 && (
                              <li>
                                <span className="fs-obs-highlight">{flutterwaveFailed} failed Flutterwave transactions</span> detected. Monitor for patterns.
                              </li>
                            )}
                            {confirmed > 0 && (
                              <li>
                                <span className="fs-obs-highlight">₦{confirmed.toLocaleString()} confirmed</span> is already in your account ({(total > 0 ? Math.round((confirmed / total) * 100) : 0)}% of total activity).
                              </li>
                            )}
                            {transactions.filter(t => t.status === "pending").length === 0 && (
                              <li>No pending transactions - all payments have been processed.</li>
                            )}
                            {transactions.filter(t => t.payment_provider === "manual").length > transactions.filter(t => t.payment_provider !== "manual").length && (
                              <li>Bank Transfer is your dominant payment method.</li>
                            )}
                          </>
                        );
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
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
        {role === "supreme" && (
          <Link href="/admin/pending" className="atab">
            <i className="ti ti-file-check" />
            <span>Review</span>
          </Link>
        )}
        <Link href="/admin/transactions" className="atab on">
          <i className="ti ti-receipt" />
          <span>Transactions</span>
        </Link>
        <button className="atab" onClick={() => { sessionStorage.removeItem("admin-pin"); sessionStorage.removeItem("admin-role"); window.location.reload(); }}>
          <i className="ti ti-lock" />
          <span>Lock</span>
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}