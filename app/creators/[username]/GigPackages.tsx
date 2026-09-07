"use client";

import { useMemo, useState } from "react";
import HireForm from "./HireForm";

type ServicePackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
};

export default function GigPackages({
  creatorId,
  creatorName,
  packages,
  startingPrice,
}: {
  creatorId: string;
  creatorName: string;
  packages: ServicePackage[];
  startingPrice: number;
}) {
  const safePackages = useMemo(() => packages.length ? packages : [{ id: "custom", name: "Custom", description: "Discuss your exact scope with this creator.", price: startingPrice, deliveryDays: 7, revisions: 1 }], [packages, startingPrice]);
  const [activeId, setActiveId] = useState(safePackages[0]?.id);
  const active = safePackages.find((item) => item.id === activeId) || safePackages[0];

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.35)]">
      <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/80">
        {safePackages.slice(0, 3).map((item) => (
          <button key={item.id} type="button" onClick={() => setActiveId(item.id)} className={`relative px-3 py-4 text-sm font-black transition ${active.id === item.id ? "bg-white text-slate-950" : "text-slate-500 hover:text-slate-900"}`}>
            {item.name}
            {active.id === item.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />}
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-violet-100/50 blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">{active.name} package</p>
              <p className="mt-2 text-3xl font-black tracking-tight">₹{Number(active.price).toLocaleString("en-IN")}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">Secure checkout</span>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-600">{active.description}</p>

          <div className="mt-5 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span>Delivery</span><strong>{active.deliveryDays} days</strong></div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><span>Revisions</span><strong>{active.revisions}</strong></div>
            <div className="flex items-center justify-between"><span>Communication</span><strong>Direct</strong></div>
          </div>

          <div className="mt-6">
            <HireForm creatorId={creatorId} creatorName={creatorName} />
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">You can discuss the exact scope before payment. YOUTENT keeps the project flow protected.</p>
        </div>
      </div>
    </div>
  );
}
