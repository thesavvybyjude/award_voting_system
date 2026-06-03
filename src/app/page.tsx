"use client";

import Link from "next/link";
import { EVENT_NAME, VOTE_PRICE_NAIRA } from "@/lib/awards.config";
import { VotingDeadlineBanner, useVotingEnded } from "@/components/VotingDeadlineBanner";
import { VotingEndedScreen } from "@/components/VotingEndedScreen";

export default function HomePage() {
  const votingEnded = useVotingEnded();

  if (votingEnded) return <VotingEndedScreen />;

  return (
    <>
      <VotingDeadlineBanner />
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "#111" }}>
        {/* Eyebrow */}
        <p
          className="animate-fade-in text-[11px] uppercase tracking-[0.16em] mb-6 font-medium"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Class of 2026 presents
        </p>

        {/* Title */}
        <h1
          className="animate-fade-in text-[42px] leading-[1.1] text-white mb-6 font-semibold"
          style={{ animationDelay: "0.1s", letterSpacing: "-0.02em" }}
        >
          {EVENT_NAME}
        </h1>

        {/* Divider */}
        <div
          className="animate-fade-in w-10 h-px mx-auto mb-6"
          style={{ background: "rgba(255,255,255,0.12)", animationDelay: "0.15s" }}
        />

        {/* Description */}
        <p
          className="animate-fade-in text-[14px] font-normal max-w-xs mx-auto mb-2"
          style={{ color: "rgba(255,255,255,0.5)", animationDelay: "0.2s" }}
        >
          Celebrate and vote for your favorites across 22 award categories.
        </p>

        {/* Price */}
        <p
          className="animate-fade-in text-[12px] mb-10 font-medium"
          style={{ color: "rgba(255,255,255,0.35)", animationDelay: "0.25s" }}
        >
          ₦{VOTE_PRICE_NAIRA} per vote · No limits
        </p>

        {/* CTA */}
        <div className="animate-fade-in w-full max-w-xs" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/vote"
            className="flex items-center justify-between w-full bg-white text-[#111] font-semibold text-[14px] py-[15px] px-[20px] rounded-[8px] no-underline"
            id="start-voting-btn"
          >
            <span>Start Voting</span>
            <i className="ti ti-arrow-right text-[15px]" />
          </Link>
        </div>
      </div>
    </>
  );
}

