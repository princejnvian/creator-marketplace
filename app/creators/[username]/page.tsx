import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HireForm from "./HireForm";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function CreatorProfilePage({
  params,
}: Props) {
  const supabase = await createClient();

  const { username } = await params;

  const cleanUsername = username.toLowerCase();

  // Find creator
  const { data: creator, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, bio, avatar_url, account_type, skills"
    )
    .eq("username", cleanUsername)
    .eq("account_type", "freelancer")
    .maybeSingle();

  if (error || !creator) {
    notFound();
  }

  const fullName = creator.full_name || "Creator";
  const skills: string[] = creator.skills || [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">

      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            href="/dashboard"
            className="group flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition duration-300 group-hover:scale-105">
              Y
            </div>

            <div className="text-xl font-black tracking-tight">
              YOUTENT<span className="text-blue-600">.</span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">

            <Link
              href="/creators"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-950 sm:inline-flex"
            >
              Browse Creators
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-200 hover:border-slate-300 hover:bg-slate-50"
            >
              Dashboard
            </Link>

          </div>
        </div>
      </nav>


      {/* ================= HERO BACKGROUND ================= */}
      <div className="relative overflow-hidden">

        {/* Decorative glow */}
        <div className="pointer-events-none absolute -left-40 top-10 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />

        {/* ================= MAIN ================= */}
        <section className="relative mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12 lg:px-8">

          {/* Back */}
          <Link
            href="/creators"
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition duration-200 hover:bg-white hover:text-blue-600"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>
            Back to Creators
          </Link>


          {/* ================= PROFILE CARD ================= */}
          <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_70px_-30px_rgba(15,23,42,0.25)]">

            {/* ================= COVER ================= */}
            <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 sm:h-44">

              {/* Decorative circles */}
              <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-16 bottom-[-100px] h-64 w-64 rounded-full bg-white/10 blur-2xl" />

              <div className="absolute bottom-5 left-6 text-xs font-bold uppercase tracking-[0.2em] text-white/70 sm:left-10">
                YOUTENT CREATOR
              </div>

            </div>


            {/* ================= PROFILE HEADER ================= */}
            <div className="relative px-6 pb-8 sm:px-10">

              <div className="-mt-16 flex flex-col gap-6 sm:-mt-20 sm:flex-row sm:items-end">

                {/* Avatar */}
                <div className="relative shrink-0">

                  {creator.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      alt={fullName}
                      className="h-32 w-32 rounded-3xl border-4 border-white object-cover shadow-xl sm:h-36 sm:w-36"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-blue-100 to-violet-100 text-5xl font-black text-blue-600 shadow-xl sm:h-36 sm:w-36">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Online indicator */}
                  <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>

                </div>


                {/* Name / Info */}
                <div className="min-w-0 flex-1 pb-1">

                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Available for projects
                  </div>

                  <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                    {fullName}
                  </h1>

                  {creator.username && (
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      @{creator.username}
                    </p>
                  )}

                </div>


                {/* Hire */}
                <div className="shrink-0">
                  <HireForm
                    creatorId={creator.id}
                    creatorName={fullName}
                  />
                </div>

              </div>

            </div>


            {/* ================= CONTENT ================= */}
            <div className="border-t border-slate-100 px-6 py-8 sm:px-10 sm:py-10">

              <div className="grid gap-10 lg:grid-cols-[1fr_300px]">

                {/* LEFT */}
                <div>

                  {/* About */}
                  <section>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        ✦
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                          About
                        </p>

                        <h2 className="text-xl font-black">
                          About this creator
                        </h2>
                      </div>
                    </div>

                    <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-slate-600">
                      {creator.bio ||
                        "This creator hasn't added a bio yet."}
                    </p>

                  </section>


                  {/* Skills */}
                  <section className="mt-10">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        ✦
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-violet-600">
                          Expertise
                        </p>

                        <h2 className="text-xl font-black">
                          Skills & expertise
                        </h2>
                      </div>

                    </div>


                    {skills.length > 0 ? (

                      <div className="mt-5 flex flex-wrap gap-2.5">

                        {skills.map((skill) => (

                          <span
                            key={skill}
                            className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-2.5 text-sm font-semibold text-blue-700 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-100"
                          >
                            {skill}
                          </span>

                        ))}

                      </div>

                    ) : (

                      <p className="mt-4 text-sm text-slate-500">
                        No skills added yet.
                      </p>

                    )}

                  </section>


                  {/* Future features */}
                  <section className="mt-10">

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6">

                      <div className="flex gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                          🚀
                        </div>

                        <div>

                          <p className="font-bold text-slate-800">
                            More creator features coming soon
                          </p>

                          <p className="mt-1.5 text-sm leading-6 text-slate-500">
                            Portfolio, reviews, pricing, messaging and
                            other creator tools will be available here.
                          </p>

                        </div>

                      </div>

                    </div>

                  </section>

                </div>


                {/* ================= RIGHT SIDEBAR ================= */}
                <aside>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Creator status
                    </p>

                    <div className="mt-4 flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Available
                        </p>

                        <p className="text-xs text-slate-500">
                          Ready for new projects
                        </p>
                      </div>

                    </div>

                  </div>


                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">

                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Why YOUTENT?
                    </p>

                    <div className="mt-4 space-y-4">

                      <div className="flex gap-3">
                        <span className="text-blue-600">✓</span>
                        <p className="text-sm text-slate-600">
                          Direct communication
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <span className="text-blue-600">✓</span>
                        <p className="text-sm text-slate-600">
                          Secure project payments
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <span className="text-blue-600">✓</span>
                        <p className="text-sm text-slate-600">
                          Simple project workflow
                        </p>
                      </div>

                    </div>

                  </div>

                </aside>

              </div>

            </div>

          </div>


          {/* Bottom CTA */}
          <div className="mt-8 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-6 py-8 text-center sm:px-10">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Ready to start?
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Have a project in mind?
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Connect with this creator and turn your idea into
              something great.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}