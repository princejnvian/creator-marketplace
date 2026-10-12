import Link from "next/link";

export default function ProjectPaymentPausedPage() {
  return (
    <main className="min-h-screen youtent-app-bg px-5 py-20 text-slate-950">
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">⏸</div>
        <h1 className="mt-5 text-2xl font-black">Payments are temporarily disabled</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">YOUTENT's payment flow is being rebuilt. No payment will be initiated from this page.</p>
        <Link href="/projects" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">Back to projects</Link>
      </section>
    </main>
  );
}
