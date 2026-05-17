"use client";

import Link from "next/link";
import { useVote } from "@/contexts/VoteContext";
import { VOTE_PRICE_NAIRA, isFreeCategory } from "@/lib/awards.config";

export function FloatingBar() {
  const { selections, getTotalVotes, getTotalAmount } = useVote();
  const totalVotes = getTotalVotes();
  const totalNaira = getTotalAmount() / 100;

  const freeVotes = selections
    .filter(s => isFreeCategory(s.categoryId))
    .reduce((sum, s) => sum + s.votes, 0);
  
  const paidVotes = selections
    .filter(s => !isFreeCategory(s.categoryId))
    .reduce((sum, s) => sum + s.votes, 0);

  const hasFreeVotes = freeVotes > 0;
  const hasPaidVotes = paidVotes > 0;

  return (
    <div className={`cbar ${totalVotes > 0 ? "visible" : ""}`}>
      <div>
        {hasFreeVotes && hasPaidVotes ? (
          <div className="cbar-label">
            {paidVotes} paid vote{paidVotes !== 1 ? "s" : ""} · {freeVotes} free vote{freeVotes !== 1 ? "s" : ""}
          </div>
        ) : hasFreeVotes ? (
          <div className="cbar-label">{freeVotes} free vote{freeVotes !== 1 ? "s" : ""}</div>
        ) : (
          <div className="cbar-label">{totalVotes} vote{totalVotes !== 1 ? "s" : ""} · ₦{VOTE_PRICE_NAIRA}/vote</div>
        )}
        <div className="cbar-total">
          {hasPaidVotes ? `₦${totalNaira.toLocaleString()}` : "Free"}
        </div>
      </div>
      <Link href="/vote/summary" className="cbar-btn">
        Review <i className="ti ti-arrow-right ml-1" style={{ fontSize: 12 }} />
      </Link>
    </div>
  );
}
