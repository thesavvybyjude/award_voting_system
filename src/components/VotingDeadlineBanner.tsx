"use client";

import { useState, useEffect } from "react";

// ── Voting deadline: 4th June 2026 @ 21:00 WAT (UTC+1) ──────────────────────
const VOTING_DEADLINE = new Date("2026-06-04T21:00:00+01:00");

export function useVotingEnded() {
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const check = () => setEnded(Date.now() >= VOTING_DEADLINE.getTime());
    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);

  return ended;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getCountdown() {
  const diff = VOTING_DEADLINE.getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSecs = Math.floor(diff / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return { h, m, s };
}

export function VotingDeadlineBanner() {
  const [countdown, setCountdown] = useState(getCountdown());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(id);
  }, []);

  // Already ended – no banner needed (VotingEndedScreen takes over)
  if (!countdown || !visible) return null;

  const isUrgent = countdown.h === 0 && countdown.m < 30;

  return (
    <div
      id="voting-deadline-banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        background: isUrgent
          ? "linear-gradient(90deg, #7f1d1d 0%, #991b1b 100%)"
          : "linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)",
        borderBottom: isUrgent ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {/* Icon + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 16,
            animation: isUrgent ? "pulse-icon 1s ease-in-out infinite" : undefined,
          }}
        >
          {isUrgent ? "🚨" : "⏰"}
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isUrgent ? "#fca5a5" : "rgba(255,255,255,0.5)",
              lineHeight: 1,
              marginBottom: 2,
            }}
          >
            {isUrgent ? "⚡ Voting closes very soon!" : "Voting ends tomorrow"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            4th June 2026 · 9:00 PM WAT
          </div>
        </div>
      </div>

      {/* Countdown */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
        {[
          { v: pad(countdown.h), l: "h" },
          { v: pad(countdown.m), l: "m" },
          { v: pad(countdown.s), l: "s" },
        ].map(({ v, l }) => (
          <div key={l} style={{ textAlign: "center" }}>
            <div
              style={{
                background: isUrgent ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.08)",
                borderRadius: 6,
                padding: "4px 8px",
                fontVariantNumeric: "tabular-nums",
                fontSize: 15,
                fontWeight: 700,
                color: isUrgent ? "#fca5a5" : "#fff",
                lineHeight: 1,
                minWidth: 32,
              }}
            >
              {v}
            </div>
            <div
              style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.05em" }}
            >
              {l}
            </div>
          </div>
        ))}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss banner"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.35)",
          fontSize: 16,
          lineHeight: 1,
          padding: 4,
          flexShrink: 0,
        }}
      >
        ×
      </button>

      <style>{`
        @keyframes pulse-icon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
