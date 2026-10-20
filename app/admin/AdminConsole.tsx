"use client";
import { useMemo, useState } from "react";

type AnyRow = Record<string, any>;
const money = (v: any) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const date = (v: any) => v ? new Date(v).toLocaleString("en-IN") : "—";
const statusClass = (s: string) => s === "paid" || s === "completed" ? "bg-emerald-100 text-emerald-800" : s === "rejected" || s === "failed" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-900";
function nameOf(p: AnyRow) { return p?.full_name || p?.name || p?.username || p?.display_name || p?.email || "User"; }

export default function AdminConsole({ initial }: { initial: { withdrawals: AnyRow[]; projects: AnyRow[]; payments: AnyRow[]; wallets: AnyRow[]; users: AnyRow[] } }) {
  const [tab, setTab] = useState("withdrawals");
  const [withdrawals, setWithdrawals] = useState(initial.withdrawals);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [reference, setReference] = useState<Record<string,string>>({});
  const [note, setNote] = useState<Record<string,string>>({});
  const [search, setSearch] = useState("");
  const filteredProjects = useMemo(() => initial.projects.filter((p) => JSON.stringify(p).toLowerCase().includes(search.toLowerCase())), [initial.projects, search]);
  async function action(id: string, actionName: string) {
    setBusy(id); setNotice("");
    try {
      const response = await fetch("/api/admin/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: actionName, reference: reference[id] || "", note: note[id] || "" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Action failed.");
      setNotice(`Withdrawal updated: ${actionName}.`);
      const refresh = await fetch("/api/admin/withdrawals", { cache: "no-store" });
      const data = await refresh.json();
      if (refresh.ok) setWithdrawals(data.withdrawals || []);
    } catch (e: any) { setNotice(e.message || "Action failed."); }
    finally { setBusy(""); }
  }
  const tabs = [["withdrawals","Withdrawals"],["projects","Projects & files"],["payments","Payments"],["wallets","Wallets"],["users","Users"]] as const;
  return <section className="mt-7">
    <div className="flex flex-wrap gap-2">{tabs.map(([id,label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2.5 text-sm font-black ${tab===id?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-700"}`}>{label}</button>)}</div>
    {notice && <p className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
    {tab==="withdrawals" && <div className="mt-5 space-y-4">{withdrawals.map((w) => <article key={w.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{nameOf(w.profile)} <span className="font-normal text-slate-500">· {w.profile?.email || w.user_id}</span></p><p className="mt-1 text-2xl font-black">{money(w.amount)}</p><p className="mt-1 text-xs text-slate-500">Requested {date(w.created_at)} · ID {w.id}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(w.status)}`}>{w.status}</span></div>{w.failure_reason && <p className="mt-2 text-sm text-rose-700">Reason: {w.failure_reason}</p>}{w.manual_payment_reference && <p className="mt-2 text-sm">Reference: <b>{w.manual_payment_reference}</b></p>}{!["paid","rejected","cancelled"].includes(w.status) && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Bank UTR / transfer reference (required to mark paid)<input value={reference[w.id]||""} onChange={(e)=>setReference({...reference,[w.id]:e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm font-normal" placeholder="Enter transfer reference" /></label><label className="text-xs font-bold text-slate-600">Admin note (optional)<input value={note[w.id]||""} onChange={(e)=>setNote({...note,[w.id]:e.target.value})} className="mt-1 w-full rounded-xl border p-3 text-sm font-normal" placeholder="Internal note / rejection reason" /></label><div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={!!busy} onClick={()=>action(w.id,"processing")} className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50">{busy===w.id?"Saving…":"Mark processing"}</button><button disabled={!!busy || (reference[w.id]||"").trim().length<4} onClick={()=>action(w.id,"paid")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Mark paid</button><button disabled={!!busy} onClick={()=>action(w.id,"reject")} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Reject & refund wallet</button></div></div>}</article>)}{withdrawals.length===0 && <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">No withdrawal requests yet.</div>}</div>}
    {tab==="projects" && <div className="mt-5"><input value={search} onChange={(e)=>setSearch(e.target.value)} className="mb-4 w-full rounded-xl border bg-white p-3" placeholder="Search projects, IDs, users, status…" /><div className="space-y-4">{filteredProjects.map((p)=> <article key={p.id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-black">{p.title || p.name || "Project"} </h3><p className="mt-1 text-xs text-slate-500">ID: {p.id} · Created {date(p.created_at)}</p></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${statusClass(p.status)}`}>{p.status || "unknown"}</span></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p>Client: <b>{nameOf(p.client)}</b> ({p.client?.email || p.client_id})</p><p>Freelancer: <b>{nameOf(p.freelancer)}</b> ({p.freelancer?.email || p.freelancer_id})</p><p>Amount: <b>{money(p.amount || p.price || p.budget)}</b></p><p>Request ID: {p.request_id || "—"}</p></div><details className="mt-4"><summary className="cursor-pointer text-sm font-black">View full project data & files ({(p.files||[]).length})</summary><pre className="mt-3 max-h-72 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-white">{JSON.stringify(p, (k,v)=>k==="files"?undefined:v, 2)}</pre>{(p.files||[]).length ? <ul className="mt-3 space-y-2">{p.files.map((f:AnyRow)=> <li key={f.path} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"><span>{f.name} {f.size ? `· ${Math.round(f.size/1024)} KB` : ""}</span>{f.url ? <a className="font-bold text-blue-700 underline" href={f.url} target="_blank" rel="noreferrer">Open file (10 min link)</a> : <span className="text-slate-400">Link unavailable</span>}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No files found in this project's storage folder.</p>}</details></article>)}</div></div>}
    {tab==="payments" && <div className="mt-5 space-y-3">{initial.payments.map((p)=> <details key={p.id} className="rounded-2xl border bg-white p-4"><summary className="cursor-pointer"><b>{money(p.amount)}</b> · {p.status} · {date(p.created_at)}</summary><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-white">{JSON.stringify(p,null,2)}</pre></details>)}</div>}
    {tab==="wallets" && <div className="mt-5 space-y-3">{initial.wallets.map((w)=> <details key={w.user_id} className="rounded-2xl border bg-white p-4"><summary className="cursor-pointer"><b>{nameOf(w.profile)}</b> · Available {money(w.available_balance)} · Pending {money(w.pending_balance)}</summary><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-white">{JSON.stringify(w,null,2)}</pre></details>)}</div>}
    {tab==="users" && <div className="mt-5 space-y-3">{initial.users.map((u)=> <details key={u.id} className="rounded-2xl border bg-white p-4"><summary className="cursor-pointer"><b>{nameOf(u.profile)}</b> · {u.email || "No email"} · Joined {date(u.created_at)}</summary><pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-white">{JSON.stringify(u,null,2)}</pre></details>)}</div>}
    <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">Sensitive admin console: project files are shown through short-lived signed links. Do not share admin access. Manual payouts must only be used if your payment collection and payout model is approved for your business.</p>
  </section>;
}
