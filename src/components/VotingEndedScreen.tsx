"use client";

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
      <h1
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          marginBottom: 16,
          maxWidth: 400,
        }}
      >
        Voting has closed.
      </h1>

      <p
        style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.7)",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        Results will be announced on the award night.
      </p>

      <div
        style={{
          width: 40,
          height: 1,
          background: "rgba(255,255,255,0.1)",
          marginBottom: 24,
        }}
      />

      <p
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.45)",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: 48,
        }}
      >
        Nominees are all expected to attend the award night.
      </p>

      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.05em",
        }}
      >
        Faculty of Computing Awards · Class of 2026
      </p>
    </div>
  );
}
