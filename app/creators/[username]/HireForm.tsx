"use client";

export default function HireForm() {
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
