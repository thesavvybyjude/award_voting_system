"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useVote } from "@/contexts/VoteContext";
import { VOTE_PRICE_NAIRA, ENABLE_PAYSTACK, ENABLE_FLUTTERWAVE, ENABLE_TRANSFER, BANK_TRANSFER_DETAILS } from "@/lib/awards.config";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { generateReference as generateFwReference } from "@/lib/flutterwave";
import { openPaystackPopup, generateReference as generatePsReference } from "@/lib/paystack";
import { ScreenHeader } from "@/components/Header";
import { Toast } from "@/components/Toast";

type Provider = "paystack" | "flutterwave" | "transfer";

export default function SummaryPage() {
  const { selections, getTotalVotes, getTotalAmount, clearSelections } = useVote();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showTransferDetails, setShowTransferDetails] = useState(false);

  const totalVotes = getTotalVotes();
  const totalAmountNaira = getTotalAmount() / 100;

  const enabledProviders: Provider[] = [];
  if (ENABLE_PAYSTACK) enabledProviders.push("paystack");
  if (ENABLE_FLUTTERWAVE) enabledProviders.push("flutterwave");
  if (ENABLE_TRANSFER) enabledProviders.push("transfer");

  useEffect(() => {
    if (enabledProviders.length === 1) {
      setSelectedProvider(enabledProviders[0]);
    }
  }, [enabledProviders]);

  const reference = selectedProvider === "paystack" 
    ? generatePsReference() 
    : generateFwReference();

  const fwConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
    tx_ref: reference,
    amount: totalAmountNaira,
    currency: "NGN" as const,
    payment_options: "card,ussd,mobilemoney,transfer" as const,
    customer: {
      email: "anon@vote.ng",
      phone_number: "",
      name: "Voter",
    },
    customizations: {
      title: "Faculty of Computing Awards 2026",
      description: "Vote purchase",
      logo: "",
    },
    callback: () => {},
    onClose: () => {},
  };

  const fwOpen = useFlutterwave(fwConfig);

  const verifyPayment = async (data: { reference: string; transactionId: string }, attempt = 1) => {
    try {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: data.reference,
          transactionId: data.transactionId,
          provider: selectedProvider,
          selections,
        }),
      });
      const response = await res.json();
      if (response.success) {
        clearSelections();
        closePaymentModal();
        router.push(`/vote/success?ref=${data.reference}`);
      } else {
        if (attempt < 3) {
          setToast({ message: `Verifying... (attempt ${attempt})`, type: "error" });
          await new Promise(r => setTimeout(r, 2000));
          return verifyPayment(data, attempt + 1);
        }
        setToast({ message: "Verification failed. Contact admin with ref: " + data.reference, type: "error" });
        setIsProcessing(false);
      }
    } catch {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 2000));
        return verifyPayment(data, attempt + 1);
      }
      setToast({ message: "Network error. Ref: " + data.reference, type: "error" });
      setIsProcessing(false);
    }
  };

  const handleFlutterwave = () => {
    if (totalVotes === 0 || selectedProvider !== "flutterwave") return;
    setIsProcessing(true);

    const config = {
      ...fwConfig,
      callback: (data: { tx_ref: string; transaction_id: number; status: string }) => {
        verifyPayment({ reference: data.tx_ref, transactionId: data.transaction_id.toString() });
      },
      onClose: () => {
        setToast({ message: "Payment cancelled", type: "error" });
        setIsProcessing(false);
      },
    };

    fwOpen(config);
  };

  const handlePaystack = () => {
    if (totalVotes === 0 || selectedProvider !== "paystack") return;
    setIsProcessing(true);

    openPaystackPopup({
      amount: totalAmountNaira * 100,
      email: "anon@vote.ng",
      reference,
      onSuccess: (data) => {
        verifyPayment({ reference: data.reference, transactionId: data.transaction || data.trans });
      },
      onClose: () => {
        setToast({ message: "Payment cancelled", type: "error" });
        setIsProcessing(false);
      },
    });
  };

  const handleTransfer = async () => {
    if (totalVotes === 0 || selectedProvider !== "transfer") return;
    setIsProcessing(true);

    try {
      const res = await fetch("/api/create-manual-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections }),
      });
      const response = await res.json();
      if (response.success) {
        clearSelections();
        router.push(`/vote/success?ref=${response.reference}&pending=true`);
      } else {
        setToast({ message: "Failed to create transaction", type: "error" });
        setIsProcessing(false);
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (selectedProvider === "flutterwave") {
      handleFlutterwave();
    } else if (selectedProvider === "paystack") {
      handlePaystack();
    } else if (selectedProvider === "transfer") {
      setShowTransferDetails(true);
    }
  };

  if (showTransferDetails) {
    return (
      <div className="flex flex-col min-h-screen bg-surface">
        <ScreenHeader 
          title="Bank Transfer" 
          backAction={() => setShowTransferDetails(false)}
        />

        <div className="scroll-area px-5 pb-8">
          <div className="transfer-card animate-fade-in">
            <div className="transfer-amount-label">Amount to transfer</div>
            <div className="transfer-amount">₦{totalAmountNaira.toLocaleString()}</div>
          </div>

          <div className="bank-details mt-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="bank-detail-row">
              <span className="bank-label">Bank Name</span>
              <span className="bank-value">{BANK_TRANSFER_DETAILS.bankName}</span>
            </div>
            <div className="bank-detail-row">
              <span className="bank-label">Account Number</span>
              <span className="bank-value bank-account">{BANK_TRANSFER_DETAILS.accountNumber}</span>
            </div>
            <div className="bank-detail-row">
              <span className="bank-label">Account Name</span>
              <span className="bank-value">{BANK_TRANSFER_DETAILS.accountName}</span>
            </div>
          </div>

          <p className="transfer-note mt-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            {BANK_TRANSFER_DETAILS.instructions}
          </p>

          <button
            onClick={handleTransfer}
            disabled={isProcessing}
            className="btn-flutterwave mb-3 mt-5 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            {isProcessing ? "Processing..." : "I've sent the money"}
          </button>

          <button
            onClick={() => setShowTransferDetails(false)}
            className="btn-outline w-full justify-center"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

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

  const providerLabel = selectedProvider === "paystack" ? "Paystack" : selectedProvider === "flutterwave" ? "Flutterwave" : "Transfer";

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
        <div className="total-strip mt-4 mb-5 animate-fade-in">
          <div>
            <div className="total-strip-amount">₦{totalAmountNaira.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="total-strip-stat">Votes</div>
            <div className="total-strip-stat-val">{totalVotes}</div>
            <div className="total-strip-stat mt-1">Rate</div>
            <div className="total-strip-stat-val">₦{VOTE_PRICE_NAIRA}/vote</div>
          </div>
        </div>

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

        <div className="pay-summary mt-5 mb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="pay-row">
            <span>Subtotal ({totalVotes} votes)</span>
            <span>₦{totalAmountNaira.toLocaleString()}</span>
          </div>
          <div className="pay-row">
            <span>Processing fee</span>
            <span>₦0</span>
          </div>
          <div className="pay-sep" />
          <div className="pay-row pay-total">
            <span>Total</span>
            <span>₦{totalAmountNaira.toLocaleString()}</span>
          </div>
        </div>

        {enabledProviders.length > 1 && (
          <div className="provider-selector mb-4 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <label className="text-[13px] font-medium text-ink-muted mb-2 block">Select Payment Method</label>
            <div className="provider-grid">
              {ENABLE_PAYSTACK && (
                <button
                  onClick={() => setSelectedProvider("paystack")}
                  className={`provider-btn ${selectedProvider === "paystack" ? "active" : ""}`}
                >
                  <span className="provider-icon">💳</span>
                  <span>Card</span>
                </button>
              )}
              {ENABLE_FLUTTERWAVE && (
                <button
                  onClick={() => setSelectedProvider("flutterwave")}
                  className={`provider-btn ${selectedProvider === "flutterwave" ? "active" : ""}`}
                >
                  <span className="provider-icon">⚡</span>
                  <span>Flutterwave</span>
                </button>
              )}
              {ENABLE_TRANSFER && (
                <button
                  onClick={() => setSelectedProvider("transfer")}
                  className={`provider-btn ${selectedProvider === "transfer" ? "active" : ""}`}
                >
                  <span className="provider-icon">🏦</span>
                  <span>Transfer</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="anon-note mb-5 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <i className="ti ti-lock" style={{ fontSize: 14 }} />
          <span>Your vote is anonymous. No personal data is collected.</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={isProcessing || !selectedProvider}
          className="btn-flutterwave mb-3 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
          id="proceed-payment-btn"
        >
          {isProcessing ? (
            "Processing…"
          ) : (
            <>
              <i className="ti ti-lock" style={{ fontSize: 14 }} />
              {selectedProvider === "transfer" 
                ? `Pay ₦${totalAmountNaira.toLocaleString()} via Transfer` 
                : `Pay ₦${totalAmountNaira.toLocaleString()} with ${providerLabel}`}
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