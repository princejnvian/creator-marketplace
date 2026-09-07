import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MarketplaceHeader from "@/components/MarketplaceHeader";

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; service?: string }> }) {
  const supabase = await createClient();

  // Check logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = (params.q || "").trim().toLowerCase();
  const category = (params.category || "").trim();
  const service = (params.service || "").trim().toLowerCase();

  // Get freelancers and apply marketplace discovery filters.
  const { data: allCreators, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, bio, avatar_url, account_type, skills, categories, starting_price, portfolio")
    .eq("account_type", "freelancer")
    .order("created_at", { ascending: false });

  // Backward-compatible discovery:
  // Older freelancer profiles may not have the new `categories` field yet.
  // Their skills still contain enough information to place them in a category.
  const categoryRules: Record<string, string[]> = {
    "Graphics & Design": [
      "graphics", "graphic", "design", "thumbnail", "logo", "illustration",
      "poster", "ui", "ux", "brand"
    ],
    "Video & Animation": [
      "video", "editing", "editor", "shorts", "reels", "youtube",
      "motion", "animation", "color grading", "intro", "outro"
    ],
    "Writing & Translation": [
      "writing", "writer", "script", "copywriting", "content", "translation",
      "proofreading", "storytelling", "research"
    ],
    "Music & Audio": [
      "audio", "voice", "voice over", "podcast", "sound", "music",
      "mixing", "mastering", "jingle"
    ],
    "Programming & Tech": [
      "web", "development", "developer", "app", "next.js", "react",
      "wordpress", "automation", "bug", "programming", "tech"
    ],
    "Digital Marketing": [
      "marketing", "seo", "social media", "youtube marketing", "email",
      "ads", "influencer", "analytics", "content strategy"
    ],
    "AI Services": [
      "ai", "artificial intelligence", "prompt", "chatbot", "automation",
      "ai content", "ai voice", "ai video", "ai image"
    ],
    "Photography": ["photography", "photographer", "photo", "portrait"],
    "Business": ["business", "consulting", "strategy"],
    "Finance": ["finance", "accounting", "bookkeeping"],
  };

  const normalize = (value: unknown) =>
    String(value || "").trim().toLowerCase();

  const creators = (allCreators || []).filter((creator) => {
    const creatorCategories = Array.isArray(creator.categories)
      ? creator.categories.map(normalize)
      : [];
    const creatorSkills = Array.isArray(creator.skills)
      ? creator.skills.map(normalize)
      : [];

    const haystack = [
      creator.full_name,
      creator.username,
      creator.bio,
      ...creatorSkills,
      ...creatorCategories,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const wantedCategory = normalize(category);
    const rules = categoryRules[category] || [];
    const legacyCategoryMatch =
      !wantedCategory ||
      creatorCategories.includes(wantedCategory) ||
      rules.some((rule) => haystack.includes(rule));

    const queryMatch = !query || haystack.includes(query);
    const serviceMatch = !service || haystack.includes(service);

    return legacyCategoryMatch && queryMatch && serviceMatch;
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_8%_0%,rgba(59,130,246,.08),transparent_26rem),radial-gradient(circle_at_92%_8%,rgba(124,58,237,.07),transparent_24rem),#f7f9fc] text-slate-950">

      <MarketplaceHeader accountType="client" />

      {/* ================= HERO / HEADER ================= */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">

        {/* Decorative background */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-violet-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-6 md:py-20 lg:px-8">

          <div className="max-w-3xl">

            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-600 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
              YOUTENT Marketplace
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
              Find the right
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                creative talent.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Discover talented video editors, thumbnail designers,
              voice-over artists and other creative professionals
              ready to bring your ideas to life.
            </p>

            {/* Small stats */}
            <div className="mt-8 flex flex-wrap gap-3">

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  ✓
                </span>
                Verified profiles
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-600">
                  ₹
                </span>
                Flexible budgets
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  ↗
                </span>
                Direct communication
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================= MAIN ================= */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-8">

        {/* Section heading */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Explore talent
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Browse Creators
            </h2>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Find someone who fits your project and budget.
            </p>
          </div>

          <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur">
            <span className={`mr-2 h-2 w-2 rounded-full ${creators.length ? "bg-emerald-500" : "bg-slate-300"}`} />
            {creators.length} {creators.length === 1 ? "creator" : "creators"} found
          </div>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
              !
            </span>

            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1 text-red-600">
                Unable to load creators right now. Please try again later.
              </p>
            </div>
          </div>
        )}

        {/* ================= CREATOR GRID ================= */}
        {creators && creators.length > 0 ? (

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {creators.map((creator) => {

              const fullName = creator.full_name || "Creator";

              const skills: string[] = Array.isArray(creator.skills) ? creator.skills : [];
              const portfolio = Array.isArray(creator.portfolio) ? creator.portfolio : [];

              return (

                <article
                  key={creator.id}
                  className="group relative overflow-hidden rounded-[1.7rem] border border-slate-200/90 bg-white/90 shadow-[0_18px_55px_-38px_rgba(15,23,42,.4)] backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/10"
                >

                  {/* Card gradient top */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="p-6 sm:p-7">

                    {portfolio.length > 0 && (
                      <Link href={`/creators/${creator.username || creator.id}`} className="mb-5 block overflow-hidden rounded-2xl bg-slate-100">
                        {portfolio[0]?.mediaType === "image" ? <img src={portfolio[0].url} alt={portfolio[0].title || "Portfolio sample"} className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : <div className="flex h-48 items-center justify-center text-sm font-bold text-slate-400">Portfolio sample • Open creator</div>}
                      </Link>
                    )}

                    {/* Profile header */}
                    <div className="flex items-start gap-4">

                      {/* Avatar */}
                      <div className="relative shrink-0">

                        {creator.avatar_url ? (

                          <img
                            src={creator.avatar_url}
                            alt={fullName}
                            className="h-20 w-20 rounded-2xl object-cover shadow-md ring-4 ring-slate-50 transition duration-300 group-hover:scale-105"
                          />

                        ) : (

                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-2xl font-black text-white shadow-md transition duration-300 group-hover:scale-105">
                            {fullName.charAt(0).toUpperCase()}
                          </div>

                        )}

                        {/* Online indicator */}
                        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-green-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>

                      </div>

                      {/* Name */}
                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <h2 className="truncate text-lg font-extrabold text-slate-950">
                            {fullName}
                          </h2>

                          <span
                            title="Freelancer"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-600"
                          >
                            ✓
                          </span>

                        </div>

                        {creator.username && (
                          <p className="mt-1 truncate text-sm text-slate-500">
                            @{creator.username}
                          </p>
                        )}

                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Available
                        </div>

                      </div>

                    </div>

                    {/* Divider */}
                    <div className="my-6 h-px bg-slate-100" />

                    {/* Bio */}
                    <div>

                      <p className="line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-600">
                        {creator.bio ||
                          "This creator hasn't added a bio yet. Check their profile to learn more about their skills and experience."}
                      </p>

                    </div>

                    {/* Skills */}
                    {skills.length > 0 ? (

                      <div className="mt-5">

                        <div className="mb-2.5 flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                            Skills
                          </p>

                          <span className="text-xs text-slate-400">
                            {skills.length}{" "}
                            {skills.length === 1 ? "skill" : "skills"}
                          </span>
                        </div>

                        <div className="flex min-h-[52px] flex-wrap content-start gap-2">

                          {skills.slice(0, 5).map((skill) => (

                            <span
                              key={skill}
                              className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition duration-200 group-hover:border-blue-200"
                            >
                              {skill}
                            </span>

                          ))}

                          {skills.length > 5 && (
                            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
                              +{skills.length - 5} more
                            </span>
                          )}

                        </div>

                      </div>

                    ) : (

                      <div className="mt-5 min-h-[52px]">
                        <p className="text-xs text-slate-400">
                          Skills not added yet
                        </p>
                      </div>

                    )}

                  </div>

                  <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                    <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Starting from</p><p className="mt-1 text-xl font-black">₹{Number(creator.starting_price || 0).toLocaleString("en-IN")}</p></div>
                    <span className="text-xs font-semibold text-slate-400">{portfolio.length} work {portfolio.length === 1 ? "sample" : "samples"}</span>
                  </div>

                  {/* Card footer */}
                  <div className="border-t border-slate-100 bg-slate-50/70 p-4 transition duration-300 group-hover:bg-blue-50/40">

                    <Link
                      href={`/creators/${creator.username || creator.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-600/20"
                    >
                      View Profile
                      <span className="text-base transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </Link>

                  </div>

                </article>

              );

            })}

          </div>

        ) : (

          /* ================= NO CREATORS ================= */
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">

            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 text-3xl shadow-inner">
              ✨
            </div>

            <h2 className="relative mt-6 text-2xl font-black text-slate-950">
              No creators yet
            </h2>

            <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
              There are no freelancers available right now.
              Be one of the first creators to showcase your skills
              and find clients on YOUTENT.
            </p>

            <Link
              href="/profile"
              className="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Become a Freelancer
              <span>→</span>
            </Link>

          </div>

        )}

      </section>

      {/* ================= BOTTOM CTA ================= */}
      <section className="border-t border-slate-200 bg-white px-5 py-16 sm:px-6 md:py-20">

        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-slate-950 px-6 py-12 text-center shadow-2xl sm:px-10">

          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl text-blue-400">
            ✦
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Have a creative skill?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
            Join YOUTENT, showcase your talent, connect with clients,
            and turn your creativity into opportunities.
          </p>

          <Link
            href="/profile"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50"
          >
            Create Your Profile
            <span>→</span>
          </Link>

        </div>

      </section>

    </main>
  );
}