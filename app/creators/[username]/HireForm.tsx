"use client";

import type { ServicePackage } from "@/lib/gigs";

type HireFormProps = {
  creatorId?: string;
  creatorName?: string;
  gigId?: string;
  gigTitle?: string;
  packages?: ServicePackage[];
};

// Props are accepted to preserve existing creator-profile call sites.
// Ordering is intentionally disabled while the payment system is rebuilt.
export default function HireForm(_props: HireFormProps) {
  return (
    <div className="w-full">
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Ordering is temporarily paused"
        className="w-full cursor-not-allowed rounded-xl bg-slate-300 px-7 py-3.5 font-bold text-slate-600 sm:w-auto"
      >
        Ordering Temporarily Paused
      </button>
      <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
        You can browse creator profiles, gigs and package details. Ordering will be enabled again after the checkout system is rebuilt.
      </p>
    </div>
  );
}
