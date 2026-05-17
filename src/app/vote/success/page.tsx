"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface TransactionDetails {
  reference: string;
  totalVotes: number;
  totalAmount: number;
  votes: Array<{ nomineeName: string; categoryName: string; voteCount: number }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const pending = searchParams.get("pending") === "true";
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(() => !ref);

  useEffect(() => {
    if (!ref) return;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/transaction/${ref}`);
        const data = await response.json();
        if (data.success) {
          setDetails(data.transaction);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ref]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      {/* Check or Pending Icon */}
      <div className={`success-check animate-scale-in ${pending ? "pending" : ""}`}>
        <i className={`ti ${pending ? "ti-clock" : "ti-check"}`} />
      </div>

      <h1 className="text-[26px] text-ink font-semibold mb-2 animate-fade-in" style={{ animationDelay: "0.1s", letterSpacing: "-0.01em" }}>
        {pending ? "Awaiting Confirmation" : "Votes Confirmed"}
      </h1>
      <p className="text-[13px] text-ink-muted mb-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
        {pending 
          ? "Your transfer is being reviewed."
          : "Your votes have been recorded successfully."}
      </p>
      {pending && (
        <p className="text-[12px] text-ink-light mb-6 animate-fade-in" style={{ animationDelay: "0.18s" }}>
          Transfer will be reviewed and votes updated once confirmed.
        </p>
      )}

      {/* Receipt */}
      {loading ? (
        <div className="w-full max-w-xs animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="receipt">
            {[1, 2, 3].map((i) => (
              <div key={i} className="receipt-row">
                <span className="receipt-label">Loading…</span>
                <span className="receipt-value">—</span>
              </div>
            ))}
          </div>
        </div>
      ) : details ? (
        <div className="w-full max-w-xs animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="receipt">
            <div className="receipt-row">
              <span className="receipt-label">Reference</span>
              <span className="receipt-value text-[10px] font-mono">{details.reference}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Total Votes</span>
              <span className="receipt-value">{details.totalVotes}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Amount</span>
              <span className="receipt-value">
                {details.totalAmount === 0 ? "Free" : `₦${(details.totalAmount / 100).toLocaleString()}`}
              </span>
            </div>
            {details.votes?.map((v, i) => (
              <div key={i} className="receipt-row">
                <span className="receipt-label">{v.categoryName}</span>
                <span className="receipt-value">{v.nomineeName} ×{v.voteCount}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-ink-muted text-[13px]">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
