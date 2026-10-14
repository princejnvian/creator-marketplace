import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KycActions from "./KycActions";

export default async function WalletKycPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: payoutProfile } = await supabase.from("creator_payout_profiles")
    .select("kyc_status,provider_status,updated_at")
    .eq("user_id", user.id).maybeSingle();
  const status = payoutProfile?.kyc_status || "not_started";
  return <main className="min-h-screen marketplace-page youtent-app-bg text-slate-950"><div className="mx-auto max-w-3xl px-5 py-10">
    <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">Freelancer wallet</p><h1 className="mt-1 text-3xl font-black">KYC & Payout Setup</h1></div><Link href="/wallet" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold">← Back to Wallet</Link></div>
    <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">🔐</div><div><h2 className="text-xl font-black">Verify with Razorpay</h2><p className="mt-2 text-sm leading-6 text-slate-600">YOUTENT will not ask you to upload Aadhaar, PAN images, OTPs, or bank passwords here. Identity and bank verification must happen through an approved Razorpay-hosted onboarding flow.</p></div></div>
      <KycActions status={status}/>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>Important:</strong> Razorpay Route activation for YOUTENT is not confirmed yet. Until the provider enables the appropriate marketplace onboarding and payout/transfer capability, KYC and bank withdrawals cannot be completed from this screen. No withdrawal will be marked paid unless the payout provider confirms it.</div>
    </section>
    <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6"><h2 className="font-black">What happens next?</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600"><li>YOUTENT enables Razorpay Route / the appropriate payout product.</li><li>You complete the provider-hosted identity and bank verification.</li><li>YOUTENT receives a verified provider status before enabling withdrawal requests.</li><li>After a payout is actually accepted and its status is confirmed, the wallet transaction is reconciled.</li></ol></section>
  </div></main>;
}
