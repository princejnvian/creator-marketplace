"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Props = {
  checkoutId: string;
  orderId: string | null;
  amount: number;
  packageName: string;
  initialStatus?: string;
  initialProjectId?: string | null;
};

export default function CheckoutPaymentButton({
  checkoutId, orderId, amount, packageName, initialStatus = "created", initialProjectId = null,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(initialProjectId || null);
  const [status, setStatus] = useState<string>(initialProjectId ? "paid" : initialStatus);
  const [capturedPending, setCapturedPending] = useState(false);
  const [statusError, setStatusError] = useState("");

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/checkout-orders/${checkoutId}/status`, { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setStatus(String(data.status || "created"));
        if (data.status === "paid" && data.projectId) {
          setProjectId(String(data.projectId));
          setCapturedPending(false);
          setLoading(false);
          return String(data.projectId);
        }
        if (data.error) setStatusError(String(data.error));
      } else if (data.error) {
        setStatusError(String(data.error));
      }
    } catch {
      setStatusError("Could not refresh payment status yet.");
    }
    return null;
  }, [checkoutId]);

  useEffect(() => {
    if (projectId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const poll = async () => {
      if (cancelled || attempts >= 40) return;
      attempts += 1;
      await checkStatus();
      if (cancelled) return;
      timer = setTimeout(poll, 2500);
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [checkStatus, projectId]);

  async function waitForProject() {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const found = await checkStatus();
      if (found) return found;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return null;
  }

  async function pay() {
    try {
      setLoading(true);
      setStatusError("");
      if (!orderId) throw new Error("Payment order is not ready. Please refresh and try again.");

      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
          document.body.appendChild(script);
        });
      }

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
          setStatusError("");
          try {
            const verifyResponse = await fetch(`/api/checkout-orders/${checkoutId}/confirm`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const result = await verifyResponse.json();

            if (verifyResponse.ok && result.projectId) {
              setProjectId(String(result.projectId));
              setStatus("paid");
              setCapturedPending(false);
              setLoading(false);
              return;
            }

            if (result.paymentCaptured || verifyResponse.status === 202) {
              setCapturedPending(true);
              setStatusError("Payment is captured. YOUTENT is safely recovering your project. Do not pay again.");
              const recovered = await waitForProject();
              if (recovered) return;
              setLoading(false);
              return;
            }

            // The status endpoint also recovers captured payments by looking up
            // the captured payment attached to this Razorpay order.
            const recovered = await waitForProject();
            if (recovered) return;
            throw new Error(result.error || "Payment confirmation is pending. Check status shortly; do not pay again if Razorpay shows captured.");
          } catch (error) {
            setStatusError(error instanceof Error ? error.message : "Payment verification is still processing.");
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.open();
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Unable to start payment.");
      setLoading(false);
    }
  }

  if (projectId && status === "paid") {
    return (
      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-xl font-black text-white">✓</span>
          <div>
            <p className="text-lg font-black text-emerald-950">Payment Paid</p>
            <p className="text-sm text-emerald-800">Your project has been created successfully.</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}`} className="block w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-center font-black text-white hover:bg-emerald-800">
          Open Project →
        </Link>
      </div>
    );
  }

  if (capturedPending || status === "processing") {
    return (
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-black text-amber-950">Payment captured — project setup pending</p>
        <p className="text-sm leading-6 text-amber-900">Do not pay again. YOUTENT is checking Razorpay and recovering the project automatically.</p>
        {statusError && <p role="status" className="text-xs text-amber-900">{statusError}</p>}
        <button type="button" disabled className="w-full cursor-wait rounded-xl bg-amber-600 px-5 py-3.5 font-black text-white opacity-80">Checking payment status…</button>
        <button type="button" onClick={() => void checkStatus()} className="w-full rounded-xl border border-amber-300 px-5 py-3 text-sm font-bold text-amber-950">Check Payment Status</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {statusError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{statusError}</p>}
      <button type="button" onClick={pay} disabled={loading || status === "paid" || status === "processing"} className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60">
        {loading ? "Confirming secure payment..." : `Continue to Pay ₹${(amount / 100).toLocaleString("en-IN")}`}
      </button>
    </div>
  );
}
