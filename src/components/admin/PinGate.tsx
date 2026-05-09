"use client";

import { useState, useCallback } from "react";

interface PinGateProps {
  onAuthenticated: (role: "admin" | "supreme") => void;
}

export function PinGate({ onAuthenticated }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleKey = useCallback((key: string) => {
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      setError("");
    } else if (pin.length < 4) {
      setPin((p) => p + key);
      setError("");
    }
  }, [pin]);

  const handleUnlock = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        sessionStorage.setItem("admin-pin", pin);
        sessionStorage.setItem("admin-role", data.role || "admin");
        onAuthenticated(data.role || "admin");
      } else {
        setError("Invalid PIN");
        setPin("");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      {/* Icon */}
      <div className="mb-4">
        <i className="ti ti-shield-lock text-ink-muted" style={{ fontSize: 28 }} />
      </div>

      {/* Eyebrow */}
      <p className="text-[9px] uppercase tracking-[0.14em] text-ink-muted mb-2">Admin Access</p>

      {/* Title */}
      <h1 className="font-heading text-[26px] text-ink mb-1">Enter PIN</h1>
      <p className="text-[12px] text-ink-muted mb-8">4-digit admin PIN required</p>

      {/* PIN Slots */}
      <div className="pin-slots mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="pin-slot">
            {pin.length > i && <div className="pin-dot" />}
          </div>
        ))}
      </div>

      {error && <p className="text-error text-[11px] mb-4 animate-fade-in">{error}</p>}

      {/* Numpad */}
      <div className="numpad mb-6">
        {["1","2","3","4","5","6","7","8","9"].map((k) => (
          <button key={k} className="numpad-key" onClick={() => handleKey(k)}>{k}</button>
        ))}
        <button className="numpad-key" onClick={() => handleKey("del")}>
          <i className="ti ti-backspace" style={{ fontSize: 16 }} />
        </button>
        <button className="numpad-key" onClick={() => handleKey("0")}>0</button>
        <button className="numpad-key" onClick={handleUnlock} disabled={pin.length < 4 || loading}>
          <i className="ti ti-check" style={{ fontSize: 16 }} />
        </button>
      </div>

      {/* Unlock button */}
      <button
        onClick={handleUnlock}
        disabled={pin.length < 4 || loading}
        className="btn-dark max-w-[220px]"
        id="admin-pin-submit"
      >
        <span>{loading ? "Verifying…" : "Unlock dashboard"}</span>
        <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
      </button>
    </div>
  );
}
