"use client";

import { useState } from "react";

export default function KycActions({ status }: { status: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function start() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/payout/onboarding", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to start KYC right now.");
      if (typeof result.onboardingUrl !== "string") throw new Error("The provider did not return an onboarding link.");
      window.location.assign(result.onboardingUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start KYC right now.");
    } finally { setBusy(false); }
  }
  const labels: Record<string, string> = {
    not_started: "Not started", in_progress: "In progress", pending_review: "Pending provider review",
    verified: "Verified", rejected: "Rejected", needs_clarification: "Needs clarification",
  };
  return <div className="mt-5 space-y-3">
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
      <span className="text-sm font-bold text-slate-600">Verification status</span>
      <span className={`rounded-full px-3 py-1 text-xs font-black ${status === "verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{labels[status] || "Not started"}</span>
    </div>
    {status !== "verified" && <button type="button" onClick={start} disabled={busy} className="w-full rounded-xl bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Connecting securely…" : status === "in_progress" || status === "pending_review" ? "Continue KYC" : "Start secure KYC"}</button>}
    {message && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{message}</p>}
  </div>;
}
