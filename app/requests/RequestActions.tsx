"use client";

import { useState } from "react";

type Props = {
  requestId: string;
};

export default function RequestActions({
  requestId,
}: Props) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  async function updateRequest(
    status: "accepted" | "declined"
  ) {
    setLoading(status);
    setError("");

    const endpoint =
      status === "accepted"
        ? `/api/project-requests/${requestId}/accept`
        : `/api/project-requests/${requestId}/decline`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error || "Something went wrong.");
        setLoading("");
        return;
      }

      if (status === "accepted" && data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }

      // Decline is a completed state transition. Reload so the request
      // immediately moves from Action required to Declined.
      window.location.reload();
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
      setLoading("");
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => updateRequest("declined")}
          disabled={loading !== ""}
          className="rounded-xl border border-red-200 px-6 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "declined" ? "Declining..." : "Decline"}
        </button>

        <button
          type="button"
          onClick={() => updateRequest("accepted")}
          disabled={loading !== ""}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "accepted" ? "Accepting..." : "Accept Request"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-right text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
