"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Details = {
  account_holder_name?: string | null; bank_account_number?: string | null; bank_ifsc?: string | null;
  upi_id?: string | null; phone_number?: string | null; selfie_path?: string | null; aadhaar_path?: string | null;
  manual_review_status?: string | null; manual_review_note?: string | null; documents_submitted_at?: string | null;
};

export default function KycActions({ status }: { status: string }) {
  const [details, setDetails] = useState<Details>({});
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [aadhaar, setAadhaar] = useState<File | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/kyc/payout-details", { cache: "no-store" });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.details) {
      const d = result.details as Details;
      setDetails(d); setAccountHolderName(d.account_holder_name || "");
      setBankAccountNumber(d.bank_account_number || ""); setBankIfsc(d.bank_ifsc || "");
      setUpiId(d.upi_id || ""); setPhoneNumber(d.phone_number || "");
    }
  }
  useEffect(() => { void load(); }, []);

  async function saveDetails() {
    setSavingDetails(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/kyc/payout-details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountHolderName, bankAccountNumber, bankIfsc, upiId, phoneNumber }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Account details save nahi ho paaye.");
      setMessage("Payout account details save ho gayi hain."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed."); }
    finally { setSavingDetails(false); }
  }

  function selectFile(e: ChangeEvent<HTMLInputElement>, type: "selfie" | "aadhaar") {
    const file = e.target.files?.[0] || null;
    if (file && (!(["image/jpeg", "image/png", "image/webp"].includes(file.type)) || file.size > 5 * 1024 * 1024)) {
      setError("JPG, PNG ya WebP image chahiye, maximum 5 MB."); e.target.value = ""; return;
    }
    setError(""); if (type === "selfie") setSelfie(file); else setAadhaar(file);
  }

  async function uploadDocuments() {
    if (!selfie || !aadhaar) { setError("Selfie aur Aadhaar image dono select karo."); return; }
    setUploadingDocs(true); setError(""); setMessage("");
    try {
      const form = new FormData(); form.append("selfie", selfie); form.append("aadhaar", aadhaar);
      const response = await fetch("/api/kyc/documents", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Documents upload nahi ho paaye.");
      setMessage("Documents submit ho gaye. Admin review ke baad status update hoga."); setSelfie(null); setAadhaar(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUploadingDocs(false); }
  }

  const statusLabel: Record<string, string> = { not_submitted: "Not submitted", pending_review: "Pending admin review", approved: "Approved by admin", rejected: "Rejected" };
  return <div className="mt-6 space-y-5">
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"><span className="text-sm font-bold text-slate-600">KYC review status</span><span className={`rounded-full px-3 py-1 text-xs font-black ${details.manual_review_status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>{statusLabel[details.manual_review_status || "not_submitted"] || status || "Not submitted"}</span></div>

    <section className="rounded-2xl border border-slate-200 p-5"><h3 className="text-lg font-black">1. Payout account details</h3><p className="mt-1 text-sm leading-6 text-slate-500">Bank account ya UPI details add karo. Ye details tumhare account se linked rahengi.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">Account holder name<input value={accountHolderName} onChange={e=>setAccountHolderName(e.target.value)} autoComplete="name" maxLength={120} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="Bank account jaisa naam" /></label>
        <label className="text-sm font-bold">Phone number (optional)<input value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} inputMode="tel" maxLength={20} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="Mobile number" /></label>
        <label className="text-sm font-bold">Bank account number<input value={bankAccountNumber} onChange={e=>setBankAccountNumber(e.target.value)} inputMode="numeric" autoComplete="off" maxLength={34} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="Account number" /></label>
        <label className="text-sm font-bold">IFSC code<input value={bankIfsc} onChange={e=>setBankIfsc(e.target.value.toUpperCase())} autoComplete="off" maxLength={11} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal uppercase" placeholder="SBIN0001234" /></label>
        <label className="text-sm font-bold sm:col-span-2">UPI ID (optional)<input value={upiId} onChange={e=>setUpiId(e.target.value)} autoComplete="off" maxLength={120} className="mt-1 w-full rounded-xl border border-slate-200 p-3 font-normal" placeholder="name@bank" /></label>
      </div>
      <button type="button" onClick={saveDetails} disabled={savingDetails} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{savingDetails ? "Saving…" : "Save account details"}</button>
    </section>

    <section className="rounded-2xl border border-slate-200 p-5"><h3 className="text-lg font-black">2. Upload KYC images</h3><p className="mt-1 text-sm leading-6 text-slate-500">Apni clear selfie aur Aadhaar image upload karo. JPG, PNG, WebP; maximum 5 MB each.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Selfie<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>selectFile(e,"selfie")} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" />{selfie && <span className="mt-1 block text-xs text-emerald-700">Selected: {selfie.name}</span>}{details.selfie_path && <span className="mt-1 block text-xs text-emerald-700">✓ Selfie uploaded</span>}</label>
      <label className="text-sm font-bold">Aadhaar image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>selectFile(e,"aadhaar")} className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" />{aadhaar && <span className="mt-1 block text-xs text-emerald-700">Selected: {aadhaar.name}</span>}{details.aadhaar_path && <span className="mt-1 block text-xs text-emerald-700">✓ Aadhaar image uploaded</span>}</label></div>
      <button type="button" onClick={uploadDocuments} disabled={uploadingDocs} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{uploadingDocs ? "Uploading securely…" : "Submit KYC documents"}</button>
      <p className="mt-3 text-xs leading-5 text-slate-500">Documents private storage mein save honge; public link nahi banega. Upload hona official Aadhaar verification nahi hai. Aadhaar sirf tab upload karein jab aap is collection ke liye comfortable hon; possible ho to masked Aadhaar use karein.</p>
    </section>
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {details.manual_review_note && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Admin note: {details.manual_review_note}</p>}
  </div>;
}
