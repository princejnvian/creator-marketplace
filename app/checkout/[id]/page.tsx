import Link from "next/link";
import YoutentLogo from "@/components/YoutentLogo";

export default function CheckoutPausedPage() {
  return (
    <main className="min-h-screen youtent-app-bg text-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <YoutentLogo href="/creators" />
          <Link href="/creators" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">← Back to creators</Link>
        </div>
      </nav>
      <section className="mx-auto max-w-2xl px-5 py-20 text-center sm:py-28">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl">⏸</div>
        <p className="mt-6 text-xs font-black uppercase tracking-[.18em] text-blue-600">YOUTENT checkout</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Ordering is temporarily paused.</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-600">We are rebuilding the order and payment flow. No payment will be started from this page. You can continue browsing creators and gig packages.</p>
        <Link href="/creators" className="mt-8 inline-flex rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-700">Browse creators</Link>
      </section>
    </main>
  );
}
