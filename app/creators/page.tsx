import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import MarketplaceHeader from "@/components/MarketplaceHeader";
import { normalizeGigs, packagePriceRange, type CreatorGig } from "@/lib/gigs";

export const metadata = {
  title: "YOUTENT Marketplace",
  description: "Discover gigs and creators on YOUTENT.",
  alternates: { canonical: "/creators" },
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  account_type: string | null;
  skills: string[] | null;
  categories: string[] | null;
  primary_category: string | null;
  starting_price: number | null;
  service_packages: unknown;
  gigs: unknown;
  portfolio: unknown;
  last_seen_at: string | null;
  created_at?: string | null;
};

type GigListing = {
  creator: ProfileRow;
  gig: CreatorGig;
};

const categoryRules: Record<string, string[]> = {
  "Graphics & Design": ["graphics", "graphic", "design", "thumbnail", "logo", "illustration", "poster", "ui", "ux", "brand"],
  "Video & Animation": ["video", "editing", "editor", "shorts", "reels", "youtube", "motion", "animation", "color grading", "intro", "outro"],
  "Writing & Translation": ["writing", "writer", "script", "copywriting", "content", "translation", "proofreading", "storytelling", "research"],
  "Music & Audio": ["audio", "voice", "voice over", "podcast", "sound", "music", "mixing", "mastering", "jingle"],
  "Programming & Tech": ["web", "development", "developer", "app", "next.js", "react", "wordpress", "automation", "bug", "programming", "tech"],
  "Digital Marketing": ["marketing", "seo", "social media", "youtube marketing", "email", "ads", "influencer", "analytics", "content strategy"],
  "AI Services": ["ai", "artificial intelligence", "prompt", "chatbot", "automation", "ai content", "ai voice", "ai video", "ai image"],
  Photography: ["photography", "photographer", "photo", "portrait"],
  Business: ["business", "consulting", "strategy"],
  Finance: ["finance", "accounting", "bookkeeping"],
};

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

function gigSearchText(gig: CreatorGig) {
  return [
    gig.title,
    gig.category,
    gig.subcategory,
    ...gig.tags,
    gig.description,
    ...gig.packages.flatMap((pkg) => [pkg.name, pkg.description, pkg.scope || "", pkg.includes || ""]),
  ].filter(Boolean).join(" ").toLowerCase();
}

function matchesGig(gig: CreatorGig, creator: ProfileRow, query: string, category: string, service: string) {
  const text = gigSearchText(gig);
  const q = normalize(query);
  const wantedCategory = normalize(category);
  const wantedService = normalize(service);

  const categoryMatch = !wantedCategory || normalize(gig.category) === wantedCategory ||
    ((categoryRules[category] || []).some((rule) => text.includes(rule)) && !normalize(gig.category));

  // Service/subcategory filters must be matched against the gig itself, not the creator.
  const serviceMatch = !wantedService || [gig.subcategory, ...gig.tags, gig.title, gig.category, gig.description].some((value) => normalize(value).includes(wantedService));
  const queryMatch = !q || text.includes(q) || normalize(creator.full_name).includes(q) || normalize(creator.username).includes(q);

  return categoryMatch && serviceMatch && queryMatch;
}

function GigCard({ listing }: { listing: GigListing }) {
  const { creator, gig } = listing;
  const range = packagePriceRange(gig);
  const media = gig.packages.flatMap((pkg) => pkg.media || [])[0] || gig.media?.[0];
  const creatorName = creator.full_name || "Creator";
  const creatorUrl = `/creators/${creator.username || creator.id}`;
  const gigUrl = `${creatorUrl}#gig-${encodeURIComponent(gig.id)}`;
  const isOnline = Boolean(creator.last_seen_at) && Date.now() - new Date(creator.last_seen_at || 0).getTime() < 2 * 60 * 1000;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/10">
      <Link href={gigUrl} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100">
          {media?.url && media.mediaType === "image" ? (
            <img src={media.url} alt={media.title || gig.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : media?.url && media.mediaType === "video" ? (
            <video src={media.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl text-blue-500/60">✦</div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-slate-700 shadow-sm backdrop-blur">
            {gig.category}
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-slate-950/85 px-2.5 py-1 text-[10px] font-black text-white">
            From ₹{range.min.toLocaleString("en-IN")}
          </div>
        </div>
      </Link>

      <div className="px-4 pb-4 pt-3.5">
        <Link href={gigUrl} className="block">
          <h2 className="line-clamp-2 min-h-[44px] text-[15px] font-black leading-5 text-slate-950 transition group-hover:text-blue-700">{gig.title}</h2>
          <p className="mt-1.5 line-clamp-1 text-xs font-semibold text-slate-500">
            {gig.subcategory || gig.category}
          </p>
        </Link>

        {gig.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {gig.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{tag}</span>)}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
          <Link href={creatorUrl} className="relative shrink-0" aria-label={`View ${creatorName}'s profile`}>
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creatorName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white ring-2 ring-white shadow-sm">{creatorName.charAt(0).toUpperCase()}</div>
            )}
            <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={creatorUrl} className="block truncate text-xs font-black text-slate-900 hover:text-blue-600">{creatorName}</Link>
            <p className="truncate text-[10px] text-slate-500">{creator.username ? `@${creator.username}` : "YOUTENT creator"}</p>
          </div>
          <Link href={gigUrl} className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-black text-white transition hover:bg-blue-600">View Gig</Link>
        </div>
      </div>
    </article>
  );
}

function CreatorCard({ creator }: { creator: ProfileRow }) {
  const name = creator.full_name || "Creator";
  const gigs = normalizeGigs(creator.gigs, creator.service_packages, creator.primary_category || creator.categories?.[0]);
  const url = `/creators/${creator.username || creator.id}`;
  const online = Boolean(creator.last_seen_at) && Date.now() - new Date(creator.last_seen_at || 0).getTime() < 2 * 60 * 1000;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-4">
        {creator.avatar_url ? <img src={creator.avatar_url} alt={name} className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-black text-white">{name.charAt(0).toUpperCase()}</div>}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-black text-slate-950">{name}</h2>
          {creator.username && <p className="truncate text-xs text-slate-500">@{creator.username}</p>}
          <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{online ? "Online" : "Offline"}</span>
        </div>
      </div>
      <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-5 text-slate-500">{creator.bio || "Creative professional ready to work on your next project."}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-xs font-bold text-slate-500">{gigs.length} {gigs.length === 1 ? "gig" : "gigs"}</span>
        <Link href={url} className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-600">View Profile →</Link>
      </div>
    </article>
  );
}

export default async function CreatorsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; service?: string; view?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const category = (params.category || "").trim();
  const service = (params.service || "").trim();
  const creatorMode = params.view === "creators";

  const { data: allCreators, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, username, bio, avatar_url, account_type, skills, categories, primary_category, starting_price, service_packages, gigs, portfolio, last_seen_at, created_at")
    .eq("account_type", "freelancer")
    .order("created_at", { ascending: false });

  const profiles = (allCreators || []) as ProfileRow[];
  const listings: GigListing[] = profiles.flatMap((creator) => {
    const gigs = normalizeGigs(creator.gigs, creator.service_packages, creator.primary_category || creator.categories?.[0]);
    return gigs.map((gig) => ({ creator, gig }));
  });

  const filteredGigs = listings.filter(({ creator, gig }) => matchesGig(gig, creator, query, category, service));
  const filteredCreators = profiles.filter((creator) => {
    const gigs = normalizeGigs(creator.gigs, creator.service_packages, creator.primary_category || creator.categories?.[0]);
    const text = [creator.full_name, creator.username, creator.bio, ...(creator.skills || []), ...gigs.map(gigSearchText)].filter(Boolean).join(" ").toLowerCase();
    return !query || text.includes(query.toLowerCase());
  });

  return (
    <main className="min-h-screen youtent-app-bg text-slate-950">
      <MarketplaceHeader accountType="client" />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-blue-700">
                YOUTENT Marketplace
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                {creatorMode ? "Browse Creators" : category || service || query ? "Find the right gig." : "Trending gigs for you."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {creatorMode ? "Explore freelancer profiles, skills and their published gigs." : "Browse every published gig separately. The same creator can appear multiple times when they offer different services."}
              </p>
            </div>
            <Link href={creatorMode ? "/creators" : "/creators?view=creators"} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-600">
              {creatorMode ? "Browse Gigs →" : "Browse Creators →"}
            </Link>
          </div>

          {!creatorMode && (category || service || query) && (
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-bold">
              {category && <span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">Category: {category}</span>}
              {service && <span className="rounded-full bg-violet-50 px-3 py-1.5 text-violet-700">Service: {service}</span>}
              {query && <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">Search: {query}</span>}
              <Link href="/creators" className="px-2 py-1.5 text-red-600 hover:underline">Clear</Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 md:py-14 lg:px-8">
        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Unable to load marketplace listings right now.</div>}

        {creatorMode ? (
          <>
            <div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">People</p><h2 className="mt-1 text-2xl font-black">{filteredCreators.length} creators found</h2></div></div>
            {filteredCreators.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredCreators.map((creator) => <CreatorCard key={creator.id} creator={creator} />)}</div> : <EmptyState title="No creators found" text="Try another search." />}
          </>
        ) : (
          <>
            <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-blue-600">Gigs & services</p><h2 className="mt-1 text-2xl font-black">{filteredGigs.length} {filteredGigs.length === 1 ? "gig" : "gigs"} found</h2></div></div>
            {filteredGigs.length > 0 ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filteredGigs.map((listing) => <GigCard key={`${listing.creator.id}-${listing.gig.id}`} listing={listing} />)}</div> : <EmptyState title="No gigs found" text="Try another category, subcategory, tag or search term." />}
          </>
        )}
      </section>
    </main>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl">✦</div><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{text}</p></div>;
}
