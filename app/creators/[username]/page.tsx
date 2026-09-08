import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import HireForm from "./HireForm";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import MessageCreatorButton from "./MessageCreatorButton";
import PortfolioLightbox from "./PortfolioLightbox";

type PortfolioItem = {
  id: string;
  title: string;
  description?: string;
  url: string;
  mediaType: "image" | "video" | "audio";
  category?: string;
};

type ServicePackage = {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
};

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const cleanUsername = username.toLowerCase();
  const { data: creator } = await supabaseAdmin
    .from("profiles")
    .select("full_name, username, bio, avatar_url, primary_category, categories")
    .eq("username", cleanUsername)
    .eq("account_type", "freelancer")
    .maybeSingle();

  if (!creator) {
    return {
      title: "Creator Not Found | YOUTENT",
      robots: { index: false, follow: false },
    };
  }

  const name = creator.full_name || creator.username || "Creator";
  const categories = Array.isArray(creator.categories) ? creator.categories : [];
  const specialty = creator.primary_category || categories[0] || "Freelance creative services";
  const description = String(creator.bio || `${name} offers ${specialty} services on YOUTENT.`).replace(/\s+/g, " ").trim().slice(0, 155);
  const canonical = `/creators/${encodeURIComponent(String(creator.username || cleanUsername))}`;

  return {
    title: `${name} — ${specialty} | YOUTENT`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${name} — ${specialty} | YOUTENT`,
      description,
      url: canonical,
      siteName: "YOUTENT",
      type: "profile",
      ...(creator.avatar_url ? { images: [{ url: creator.avatar_url, alt: name }] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CreatorProfilePage({ params }: Props) {
  const { username } = await params;
  const cleanUsername = username.toLowerCase();

  const { data: creator } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, full_name, username, bio, avatar_url, account_type, skills, categories, primary_category, starting_price, service_packages, portfolio"
    )
    .eq("username", cleanUsername)
    .eq("account_type", "freelancer")
    .maybeSingle();

  if (!creator) notFound();

  const fullName = creator.full_name || "Creator";
  const skills: string[] = Array.isArray(creator.skills) ? creator.skills : [];
  const categories: string[] = Array.isArray(creator.categories) ? creator.categories : [];
  const portfolio: PortfolioItem[] = Array.isArray(creator.portfolio) ? creator.portfolio : [];
  const packages: ServicePackage[] = Array.isArray(creator.service_packages)
    ? creator.service_packages
    : [];

  const startingPrice =
    Number(creator.starting_price) || Number(packages[0]?.price) || 0;

  const { data: reviewRows } = await supabaseAdmin
    .from("reviews")
    .select("rating")
    .eq("freelancer_id", creator.id);

  const reviewCount = reviewRows?.length || 0;
  const averageRating = reviewCount
    ? (
        reviewRows!.reduce((sum, item) => sum + Number(item.rating), 0) /
        reviewCount
      ).toFixed(1)
    : "New";

  const creatorUrl = `https://youtent.in/creators/${encodeURIComponent(String(creator.username))}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: fullName,
    url: creatorUrl,
    ...(creator.avatar_url ? { image: creator.avatar_url } : {}),
    description: creator.bio || undefined,
    jobTitle: creator.primary_category || categories[0] || "Freelancer",
    ...(reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(averageRating), reviewCount } } : {}),
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_8%_8%,rgba(59,130,246,.12),transparent_25rem),radial-gradient(circle_at_92%_12%,rgba(124,58,237,.10),transparent_26rem),linear-gradient(180deg,#f4f8ff_0%,#eef4fb_48%,#f8faff_100%)] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MarketplaceHeader accountType="client" />

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href="/creators"
          className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/75 px-3.5 py-2 text-sm font-bold text-slate-600 shadow-sm backdrop-blur transition hover:border-blue-200 hover:text-blue-600"
        >
          ← Back to Creators
        </Link>

        <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_24px_70px_-40px_rgba(30,64,175,.35),0_8px_24px_rgba(15,23,42,.06)] sm:rounded-[2rem]">
          {/* Cover */}
          <div className="relative h-36 overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 sm:h-44 md:h-48">
            <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-24 -bottom-40 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,.07)_45%,transparent_70%)]" />
            <div className="absolute bottom-5 left-5 text-[10px] font-black uppercase tracking-[0.22em] text-white/75 sm:left-8 sm:text-xs">
              YOUTENT CREATOR
            </div>
          </div>

          {/* Creator identity */}
          <div className="px-5 pb-6 sm:px-8 sm:pb-7 lg:px-10">
            <div className="grid gap-5 pt-5 sm:grid-cols-[auto,minmax(0,1fr),auto] sm:items-center sm:gap-6">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    alt={fullName}
                    className="h-28 w-28 rounded-[1.35rem] border-4 border-white object-cover shadow-xl ring-1 ring-slate-200 sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-[1.35rem] border-4 border-white bg-gradient-to-br from-blue-100 to-violet-100 text-4xl font-black text-blue-600 shadow-xl ring-1 ring-slate-200 sm:h-32 sm:w-32">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white bg-emerald-500 shadow-sm" />
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Available for projects
                </span>
                <h1 className="mt-3 truncate text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                  {fullName}
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  @{creator.username}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-700 sm:justify-start">
                  <span className="text-amber-500">★</span>
                  {averageRating}
                  <span className="text-xs font-medium text-slate-400">
                    ({reviewCount} reviews)
                  </span>
                </div>
              </div>

              <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                <MessageCreatorButton creatorId={creator.id} />
                <HireForm creatorId={creator.id} creatorName={fullName} />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="border-t border-slate-100/90 bg-slate-50/35 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_350px]">
              <div className="min-w-0">
                <section>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                    About
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    {creator.primary_category ||
                      categories[0] ||
                      "Creative professional"}
                  </h2>
                  <p className="mt-3 max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-slate-600">
                    {creator.bio || "This creator hasn't added a bio yet."}
                  </p>
                </section>

                {categories.length > 0 && (
                  <section className="mt-8">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-600">
                      Categories
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {categories.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-8">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
                    Expertise
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Skills & expertise</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.length ? (
                      skills.map((item) => (
                        <span
                          key={item}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">
                        No skills added yet.
                      </span>
                    )}
                  </div>
                </section>

                <section className="mt-10">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-600">
                        Portfolio
                      </p>
                      <h2 className="mt-1 text-2xl font-black">Selected work</h2>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm">
                      {portfolio.length} items
                    </span>
                  </div>

                  {portfolio.length ? (
                    <PortfolioLightbox items={portfolio} />
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                      Portfolio samples will appear here when this creator adds
                      their work.
                    </div>
                  )}
                </section>
              </div>

              {/* Pricing */}
              <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_18px_50px_-32px_rgba(15,23,42,.35)] sm:p-5">
                  <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                      Service pricing
                    </p>
                    <p className="mt-2 text-sm text-slate-500">Starting from</p>
                    <p className="text-4xl font-black tracking-tight">
                      ₹{startingPrice.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {packages.length ? (
                      packages.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-black">{item.name}</h3>
                            <span className="shrink-0 text-lg font-black">
                              ₹{Number(item.price).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                              {item.deliveryDays} day delivery
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                              {item.revisions} revisions
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                        Custom pricing available through a project request.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 p-5 text-white shadow-[0_18px_35px_-20px_rgba(79,70,229,.55)]">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                      Ready to work together?
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/95">
                      Send a project request and discuss the exact scope.
                    </p>
                    <div className="mt-4">
                      <HireForm
                        creatorId={creator.id}
                        creatorName={fullName}
                      />
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
