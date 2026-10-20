import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AdminConsole from "./AdminConsole";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const allowed = (process.env.ADMIN_EMAILS || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!user.email || !allowed.includes(user.email.toLowerCase())) {
    return <main className="min-h-screen p-8"><div className="mx-auto max-w-xl rounded-3xl border bg-white p-8"><h1 className="text-2xl font-black">Admin access required</h1><p className="mt-3 text-slate-600">This account is not listed in the server-side ADMIN_EMAILS allowlist. Ask the site owner to configure the authorized admin email in Vercel.</p><Link href="/dashboard" className="mt-5 inline-block font-bold text-blue-700">Return to dashboard</Link></div></main>;
  }

  const [withdrawals, projects, payments, wallets, profiles] = await Promise.all([
    supabaseAdmin.from("withdrawal_requests").select("id,user_id,amount,currency,status,provider,manual_payment_reference,admin_note,failure_reason,created_at,processed_at").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("projects").select("*").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
    supabaseAdmin.from("wallets").select("*").order("updated_at", { ascending: false }).limit(100),
    supabaseAdmin.from("profiles").select("*").limit(1000),
  ]);
  const profileMap = new Map((profiles.data || []).map((p: any) => [p.id, p]));
  const withProfiles = (rows: any[] | null) => (rows || []).map((r) => ({
    ...r,
    client: profileMap.get(r.client_id) || null,
    freelancer: profileMap.get(r.freelancer_id || r.user_id) || null,
    profile: profileMap.get(r.user_id) || null,
  }));
  const projectRows = withProfiles(projects.data || []);
  const projectIds = projectRows.map((p: any) => String(p.id));
  const fileResults = await Promise.all(projectIds.slice(0, 50).map(async (id) => {
    const { data } = await supabaseAdmin.storage.from("project-files").list(id, { limit: 100 });
    const files = (data || []).filter((f: any) => f.name && !f.name.startsWith(".")).map((f: any) => ({ name: f.name, path: `${id}/${f.name}`, size: f.metadata?.size || null, updated_at: f.updated_at || null }));
    const signed = files.length ? await supabaseAdmin.storage.from("project-files").createSignedUrls(files.map((f) => f.path), 60 * 10) : { data: [] as any[] };
    return [id, files.map((f, i) => ({ ...f, url: signed.data?.[i]?.signedUrl || null }))] as const;
  }));
  const fileMap = Object.fromEntries(fileResults);
  const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
  const users = (usersPage?.users || []).map((u: any) => ({ id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at, banned_until: u.banned_until, profile: profileMap.get(u.id) || null }));
  const errors = [withdrawals.error, projects.error, payments.error, wallets.error, profiles.error].filter(Boolean).map((e: any) => e.message);
  return <main className="min-h-screen marketplace-page youtent-app-bg px-4 py-8 text-slate-950 sm:px-6"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-blue-600">YOUTENT Control Center</p><h1 className="mt-1 text-3xl font-black">Admin dashboard</h1><p className="mt-2 text-sm text-slate-500">Signed in as {user.email}</p></div><Link href="/dashboard" className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold">Back to site</Link></header>{errors.length > 0 && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some data could not load: {errors.join(" · ")}. Check schema and service-role configuration.</div>}<AdminConsole initial={{ withdrawals: withProfiles(withdrawals.data), projects: projectRows.map((p: any) => ({ ...p, files: fileMap[String(p.id)] || [] })), payments: withProfiles(payments.data), wallets: withProfiles(wallets.data), users }} /></div></main>;
}
