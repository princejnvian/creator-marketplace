"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPaymentButton({
  checkoutId, orderId, amount, packageName,
}: { checkoutId: string; orderId: string | null; amount: number; packageName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function waitForProject() {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const response = await fetch(`/api/checkout-orders/${checkoutId}/status`, { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data.projectId && data.status === "paid") return String(data.projectId);
      } catch {
        // Keep polling briefly in case the webhook is still being processed.
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
    return null;
  }

  async function pay() {
    try {
      setLoading(true);
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
          try {
            const verifyResponse = await fetch(`/api/checkout-orders/${checkoutId}/confirm`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const result = await verifyResponse.json();

            if (verifyResponse.ok && result.projectId) {
              router.replace(`/projects/${result.projectId}?payment=success`);
              router.refresh();
              return;
            }

            // The browser callback and Razorpay webhook can race. If the webhook
            // has already created the project, wait for the canonical checkout status.
            const projectId = await waitForProject();
            if (projectId) {
              router.replace(`/projects/${projectId}?payment=success`);
              router.refresh();
              return;
            }

            if (result.paymentCaptured) {
              // Do not offer another payment after capture. Stop the spinner and
              // let the user use the explicit status-recovery control instead.
              setLoading(false);
              alert("Payment was captured, but project setup is still processing. Do not pay again. Use Check Payment Status to retry recovery. Checkout ID: " + checkoutId);
              return;
            }

            throw new Error(result.error || "Payment confirmation is still pending. Please refresh shortly.");
          } catch (error) {
            setLoading(false);
            alert(error instanceof Error ? error.message : "Payment verification is still processing. Please refresh shortly.");
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.open();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to start payment.");
      setLoading(false);
    }
  }

  return <button type="button" onClick={pay} disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60">{loading ? "Confirming secure payment..." : `Continue to Pay ₹${(amount / 100).toLocaleString("en-IN")}`}</button>;
}
