"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

declare global { interface Window { Razorpay: any } }

type StatusData = { status?: string; projectId?: string | null; paymentCaptured?: boolean; recoveryPending?: boolean; message?: string; error?: string };

export default function CheckoutPaymentButton({ checkoutId, orderId, amount, packageName }: { checkoutId: string; orderId: string | null; amount: number; packageName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [paymentCaptured, setPaymentCaptured] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Verifying payment status…");
  const [statusError, setStatusError] = useState("");

  const checkStatus = useCallback(async (quiet = false): Promise<"paid" | "captured" | "not-captured"> => {
    if (!quiet) setChecking(true);
    setStatusError("");
    try {
      const response = await fetch(`/api/checkout-orders/${checkoutId}/status`, { cache: "no-store" });
      const data = await response.json() as StatusData;
      if (data.projectId && data.status === "paid") {
        setProjectId(String(data.projectId)); setPaymentCaptured(true);
        setStatusMessage("Payment verified. Your project is ready.");
        router.replace(`/projects/${data.projectId}?payment=success`);
        router.refresh();
        return "paid";
      }
      if (data.paymentCaptured) { setPaymentCaptured(true); setStatusMessage(data.message || "Payment captured. Project setup is being recovered."); return "captured"; }
      setStatusMessage(data.message || "Payment has not been confirmed yet.");
      if (!response.ok) setStatusError(data.error || "Could not verify payment status.");
      return "not-captured";
    } catch {
      setStatusError("Could not contact the payment verification service. Please check status again.");
      return "not-captured";
    } finally { setChecking(false); }
  }, [checkoutId, router]);

  useEffect(() => { void checkStatus(true); }, [checkStatus]);

  async function pay() {
    try {
      setLoading(true); setStatusError("");
      // Before opening a second payment attempt, ask the server whether the earlier order was captured.
      const recovered = await checkStatus(true);
      if (recovered === "paid" || recovered === "captured" || paymentCaptured) { setLoading(false); return; }
      if (!orderId) throw new Error("Payment order is not ready. Please refresh and try again.");
      if (!window.Razorpay) await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load Razorpay Checkout.")); document.body.appendChild(script);
      });
      const configResponse = await fetch(`/api/checkout-orders/${checkoutId}/payment-config`, { cache: "no-store" });
      const config = await configResponse.json();
      if (!configResponse.ok) throw new Error(config.error || "Unable to prepare payment.");
      const razorpay = new window.Razorpay({
        key: config.keyId,
        amount,
        currency: "INR",
        name: "YOUTENT",
        description: packageName,
        order_id: orderId,
        theme: { color: "#2563eb" },
        handler: async (response: any) => {
          setLoading(true); setStatusMessage("Verifying captured payment and creating your project…");
          try {
            const verifyResponse = await fetch(`/api/checkout-orders/${checkoutId}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(response) });
            const result = await verifyResponse.json();
            if (verifyResponse.ok && result.projectId) { router.replace(`/projects/${result.projectId}?payment=success`); router.refresh(); return; }
            if (result.paymentCaptured) setPaymentCaptured(true);
            // Retry server-side reconciliation; never keep the page in a permanent spinner.
            for (let i = 0; i < 5; i++) { const recovered = await checkStatus(true); if (recovered === "paid") return; if (recovered === "captured") setPaymentCaptured(true); await new Promise(r => setTimeout(r, 1200)); }
            setStatusError(result.error || "Payment verification is still pending. Do not pay again; use Check Payment Status.");
          } catch { setStatusError("Payment response received, but verification is pending. Do not pay again; use Check Payment Status."); }
          finally { setLoading(false); setChecking(false); }
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      // Show a useful message when Razorpay reports a failed attempt.
      razorpay.on("payment.failed", (response: any) => {
        const description = String(response?.error?.description || "").trim();
        setStatusMessage("Razorpay reported that this payment attempt failed.");
        setStatusError(description || "Payment failed. Check your payment method and try again.");
        setLoading(false);
      });

      razorpay.open();
    } catch (error) { setStatusError(error instanceof Error ? error.message : "Unable to start payment."); setLoading(false); }
  }

  return <div className="space-y-3">
    {(checking || paymentCaptured || projectId || statusError) && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-black">{projectId ? "Payment Paid" : paymentCaptured ? "Payment captured — project setup pending" : checking ? "Checking payment status…" : "Payment status"}</p>
      <p className="mt-2 leading-6">{statusMessage}</p>
      {statusError && <p className="mt-2 text-red-700">{statusError}</p>}
      {projectId && <button type="button" onClick={() => router.push(`/projects/${projectId}`)} className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 font-black text-white">Go to Project →</button>}
      {!projectId && <button type="button" disabled={checking} onClick={() => void checkStatus()} className="mt-3 w-full rounded-xl border border-amber-400 px-4 py-3 font-bold disabled:opacity-60">{checking ? "Checking payment status…" : "Check Payment Status"}</button>}
      {paymentCaptured && <p className="mt-2 text-xs">Do not pay again. Recovery will use the existing captured payment.</p>}
    </div>}
    {!paymentCaptured && !projectId && <button type="button" onClick={pay} disabled={loading || checking} className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60">{loading ? "Confirming secure payment…" : `Continue to Pay ₹${(amount / 100).toLocaleString("en-IN")}`}</button>}
  </div>;
}
