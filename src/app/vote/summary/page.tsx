"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVote } from "@/contexts/VoteContext";
import { VOTE_PRICE_NAIRA } from "@/lib/awards.config";
import { openPaystackPopup, generateReference } from "@/lib/paystack";
import { ScreenHeader } from "@/components/Header";
import { Toast } from "@/components/Toast";

export default function SummaryPage() {
  const { selections, getTotalVotes, getTotalAmount, clearSelections } = useVote();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const totalVotes = getTotalVotes();
  const totalAmountKobo = getTotalAmount();
  const totalNaira = totalAmountKobo / 100;

  const handlePayment = () => {
    if (totalVotes === 0) return;
    setIsProcessing(true);
    const reference = generateReference();

    openPaystackPopup({
      amount: totalAmountKobo,
      email: "anon@vote.ng",
      reference,
      onSuccess: async (response) => {
        try {
          const res = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: response.reference, selections }),
          });
          const data = await res.json();
          if (data.success) {
            clearSelections();
            router.push(`/vote/success?ref=${response.reference}`);
          } else {
            setToast({ message: data.error || "Verification failed", type: "error" });
            setIsProcessing(false);
          }
        } catch {
          setToast({ message: "Network error", type: "error" });
          setIsProcessing(false);
        }
      },
      onClose: () => {
        setToast({ message: "Payment cancelled", type: "error" });
        setIsProcessing(false);
      },
    });
  };

  if (totalVotes === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <ScreenHeader title="Summary" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[13px] text-ink-muted mb-4">No votes selected yet.</p>
          <Link href="/vote" className="btn-outline">← Back to voting</Link>
        </div>
      </div>
    );
  }

  const handleClear = () => {
    if (confirm("Clear all votes? This cannot be undone.")) {
      clearSelections();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <ScreenHeader 
        title="Summary" 
        subtitle={`${totalVotes} vote${totalVotes !== 1 ? "s" : ""} selected`}
        rightAction={
          <button onClick={handleClear} className="text-[12px] font-medium text-ink-muted hover:text-error transition-colors">
            Clear all
          </button>
        }
      />

      <div className="scroll-area px-5 pb-8">
        {/* Total Strip */}
        <div className="total-strip mt-4 mb-5 animate-fade-in">
          <div>
            <div className="total-strip-amount">₦{totalNaira.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="total-strip-stat">Votes</div>
            <div className="total-strip-stat-val">{totalVotes}</div>
            <div className="total-strip-stat mt-1">Rate</div>
            <div className="total-strip-stat-val">₦{VOTE_PRICE_NAIRA}/vote</div>
          </div>
        </div>

        {/* Selection Rows */}
        {selections.map((sel, i) => (
          <div key={`${sel.categoryId}-${sel.nomineeId}`} className="srow animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="srow-cat">{sel.categoryName}</div>
            <div className="flex items-center">
              <span className="srow-nominee">{sel.nomineeName}</span>
              <Link href="/vote" className="srow-change">Change</Link>
            </div>
            <div className="srow-bottom">
              <span className="srow-votes">{sel.votes} vote{sel.votes !== 1 ? "s" : ""}</span>
              <span className="srow-cost">₦{(sel.votes * VOTE_PRICE_NAIRA).toLocaleString()}</span>
            </div>
          </div>
        ))}

        {/* Payment Summary Box */}
        <div className="pay-summary mt-5 mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="pay-row">
            <span>Subtotal ({totalVotes} votes)</span>
            <span>₦{totalNaira.toLocaleString()}</span>
          </div>
          <div className="pay-row">
            <span>Processing fee</span>
            <span>₦0</span>
          </div>
          <div className="pay-sep" />
          <div className="pay-row pay-total">
            <span>Total</span>
            <span>₦{totalNaira.toLocaleString()}</span>
          </div>
        </div>

        {/* Anonymous Note */}
        <div className="anon-note mb-5 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <i className="ti ti-lock" style={{ fontSize: 14 }} />
          <span>Your vote is anonymous. No personal data is collected.</span>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="btn-paystack mb-3 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
          id="proceed-payment-btn"
        >
          {isProcessing ? (
            "Processing…"
          ) : (
            <>
              <i className="ti ti-lock" style={{ fontSize: 14 }} />
              Pay ₦{totalNaira.toLocaleString()} with Paystack
            </>
          )}
        </button>

        <Link href="/vote" className="btn-outline w-full justify-center">
          ← Edit votes
        </Link>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
