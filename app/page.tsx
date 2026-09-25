import Link from "next/link";

import YoutentLogo from "@/components/YoutentLogo";
export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-slate-950">

      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <YoutentLogo href="/" />

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 md:flex">

            <Link
              href="#categories"
              className="relative text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-blue-600"
            >
              Explore
            </Link>

            <Link
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-blue-600"
            >
              How it works
            </Link>

            <Link
              href="/signup"
              className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-blue-600"
            >
              Become a Freelancer
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-600/25"
            >
              Get Started
            </Link>

          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">

            <Link
              href="/login"
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white"
            >
              Sign Up
            </Link>

          </div>
        </div>
      </nav>


      {/* ================= HERO ================= */}
      <section className="relative isolate overflow-hidden">

        {/* Background Glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">

          <div className="absolute left-1/2 top-[-180px] h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-blue-200/35 blur-3xl" />

          <div className="absolute right-[-180px] top-48 h-[380px] w-[380px] rounded-full bg-violet-200/25 blur-3xl" />

          <div className="absolute left-[-180px] top-72 h-[350px] w-[350px] rounded-full bg-cyan-100/30 blur-3xl" />

        </div>

        <div className="mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-6 sm:pt-20 md:pb-32 md:pt-28 lg:px-8">

          <div className="mx-auto max-w-5xl text-center">

            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">

              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
              </span>

              India&apos;s Creator Marketplace
            </div>


            {/* Heading */}
            <h1 className="text-5xl font-black leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-6xl md:text-7xl lg:text-[82px]">

              Great work starts
              <br />

              with the{" "}

              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                right talent.
              </span>

            </h1>


            {/* Tagline */}
            <p className="mt-6 text-base font-semibold tracking-wide text-slate-500 sm:text-lg">
              Where Talent Meets Opportunity
            </p>


            {/* Description */}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Connect with talented video editors, thumbnail designers,
              voice-over artists, and other creative professionals — all in
              one place.
            </p>


            {/* Search Box */}
            <div className="mx-auto mt-9 flex max-w-3xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.25)] transition-all duration-300 hover:border-blue-200 hover:shadow-[0_25px_80px_-25px_rgba(37,99,235,0.20)] sm:flex-row">

              <div className="flex min-w-0 flex-1 items-center">

                {/* Search Icon */}
                <svg
                  className="ml-4 h-5 w-5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                  />
                </svg>

                <input
                  type="text"
                  placeholder="What do you need? e.g. YouTube video editing"
                  className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                />

              </div>

              <button className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl">
                Search
              </button>

            </div>


            {/* Popular Searches */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">

              <span className="mr-1 text-slate-400">
                Popular:
              </span>

              <PopularLink href="#categories">
                Video Editing
              </PopularLink>

              <PopularLink href="#categories">
                Thumbnails
              </PopularLink>

              <PopularLink href="#categories">
                Voice Over
              </PopularLink>

            </div>


            {/* Trust */}
            <div className="mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-500">

              <TrustItem text="Verified profiles" />

              <TrustItem text="Secure payments" />

              <TrustItem text="Direct communication" />

            </div>

          </div>
        </div>
      </section>


      {/* ================= CATEGORIES ================= */}
      <section
        id="categories"
        className="border-t border-slate-100 bg-slate-50/70 px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-2xl text-center">

            <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Explore talent
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Find the skills you need.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              From editing to design and voice-over, find the right creator
              for your next project.
            </p>

          </div>


          <div className="mt-12 grid gap-5 md:grid-cols-3">

            <Category
              icon="▶"
              title="Video Editing"
              description="Shorts, Reels, long-form videos, documentaries, and more."
              accent="from-blue-500 to-cyan-500"
            />

            <Category
              icon="✦"
              title="Thumbnail Design"
              description="Eye-catching YouTube thumbnails designed to earn more clicks."
              accent="from-violet-500 to-fuchsia-500"
            />

            <Category
              icon="◉"
              title="Voice Over"
              description="Professional Hindi, Hinglish, Urdu, and English voice artists."
              accent="from-indigo-500 to-blue-500"
            />

          </div>

        </div>
      </section>


      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className="bg-white px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-2xl text-center">

            <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Simple process
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              From idea to finished work.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Everything you need to collaborate with the right creative
              professional.
            </p>

          </div>


          <div className="mt-14 grid gap-6 md:grid-cols-3">

            <Step
              number="01"
              icon="⌕"
              title="Find the right talent"
              description="Browse creators, explore their skills, and find someone who fits your project."
            />

            <Step
              number="02"
              icon="↗"
              title="Discuss your project"
              description="Share your requirements, budget, deadline, and ideas directly with the creator."
            />

            <Step
              number="03"
              icon="✓"
              title="Get the work done"
              description="Collaborate, receive your work, and complete the project with confidence."
            />

          </div>

        </div>
      </section>


      {/* ================= CREATOR CTA ================= */}
      <section className="relative isolate overflow-hidden bg-slate-950 px-5 py-20 sm:px-6 md:py-28 lg:px-8">

        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[450px] w-[750px] -translate-x-1/2 rounded-full bg-blue-600/25 blur-3xl" />

        <div className="mx-auto max-w-4xl text-center">

          <span className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
            For creators
          </span>

          <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            Your talent deserves
            <br />
            better opportunities.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Create your YOUTENT profile, showcase your skills, connect with
            clients, and turn your creativity into income.
          </p>

          <Link
            href="/signup"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-slate-950 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-2xl"
          >
            Become a Freelancer

            <span className="text-blue-600 transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>

        </div>
      </section>


      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">

          {/* Footer Logo */}
          <YoutentLogo href="/" />


          <div className="text-center text-sm text-slate-500 sm:text-right">

            <p className="font-medium text-slate-600">
              Where Talent Meets Opportunity
            </p>

            <p className="mt-1">
              © 2026 YOUTENT. All rights reserved.
            </p>

          </div>

        </div>
      </footer>

    </main>
  );
}


/* ================= POPULAR LINK ================= */

function PopularLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
    >
      {children}
    </Link>
  );
}


/* ================= TRUST ITEM ================= */

function TrustItem({
  text,
}: {
  text: string;
}) {
  return (
    <span className="flex items-center gap-2">

      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
        ✓
      </span>

      {text}

    </span>
  );
}


/* ================= CATEGORY ================= */

function Category({
  icon,
  title,
  description,
  accent,
}: {
  icon: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/70 sm:p-8">

      {/* Icon */}
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-xl font-black text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}
      >
        {icon}
      </div>


      <h3 className="mt-6 text-xl font-bold text-slate-950">
        {title}
      </h3>


      <p className="mt-3 leading-7 text-slate-600">
        {description}
      </p>


      <Link
        href="/signup"
        className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-600 transition-all duration-300 group-hover:gap-3 hover:text-blue-700"
      >
        Explore

        <span>
          →
        </span>
      </Link>


      {/* Hover Glow */}
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-blue-50 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

    </div>
  );
}


/* ================= STEP ================= */

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl sm:p-8">

      {/* Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-2">
        {icon}
      </div>


      {/* Step */}
      <div className="mt-5 text-xs font-bold tracking-[0.2em] text-blue-600">
        STEP {number}
      </div>


      <h3 className="mt-2 text-xl font-bold text-slate-950">
        {title}
      </h3>


      <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-600">
        {description}
      </p>

    </div>
  );
}