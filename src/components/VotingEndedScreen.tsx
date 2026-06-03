"use client";

import Link from "next/link";

export function VotingEndedScreen() {
  return (
    <div
      id="voting-ended-screen"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        padding: "32px 24px",
        textAlign: "center",
      }}
    >
      {/* Glow orb */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          animation: "orb-pulse 3s ease-in-out infinite",
        }}
      >
        <span style={{ fontSize: 52 }}>🏆</span>
      </div>

      {/* Badge */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#ef4444",
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 20,
          padding: "4px 14px",
          marginBottom: 20,
        }}
      >
        Voting Closed
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          marginBottom: 14,
          maxWidth: 320,
        }}
      >
        Voting Has Ended
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          maxWidth: 280,
          lineHeight: 1.6,
          marginBottom: 8,
        }}
      >
        The Faculty of Computing Awards 2026 voting period closed on
      </p>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          marginBottom: 36,
        }}
      >
        4th June 2026 at 9:00 PM WAT
      </p>

      {/* Divider */}
      <div
        style={{
          width: 40,
          height: 1,
          background: "rgba(255,255,255,0.1)",
          marginBottom: 32,
        }}
      />

      {/* Admin access notice */}
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "18px 24px",
          maxWidth: 300,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 16 }}>🛡️</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Admin Supreme Only
          </span>
        </div>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          Results are exclusively accessible to the Admin Supreme. Unauthorised access is prohibited.
        </p>
        <Link
          href="/admin/results"
          id="view-results-btn"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "#fff",
            color: "#111",
            fontWeight: 700,
            fontSize: 13,
            borderRadius: 8,
            padding: "12px 20px",
            textDecoration: "none",
            transition: "opacity 0.2s",
          }}
        >
          <span>🔐</span>
          <span>Admin Supreme Login</span>
        </Link>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.05em",
        }}
      >
        Faculty of Computing Awards · Class of 2026
      </p>

      <style>{`
        @keyframes orb-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
