import Image from "next/image";
import Link from "next/link";
import InfoPage, { InfoSection } from "@/components/InfoPage";

const instagramUrl = "https://www.instagram.com/youtent.in";

export const metadata = {
  title: "About YOUTENT | Founder Prince JNVian",
  description:
    "Meet Prince JNVian, Founder & CEO of YOUTENT — a creator marketplace connecting clients with video editors, designers, writers and independent talent.",
  alternates: { canonical: "https://youtent.in/about" },
  openGraph: {
    title: "About YOUTENT | Founded by Prince JNVian",
    description:
      "YOUTENT brings clients and independent creators together. Meet its Founder & CEO, Prince JNVian.",
    url: "https://youtent.in/about",
    siteName: "YOUTENT",
    type: "website",
    images: [{ url: "/prince-jnvian-founder.webp", width: 966, height: 1280, alt: "Prince JNVian, Founder & CEO of YOUTENT" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About YOUTENT | Founder Prince JNVian",
    description: "Where Talent Meets Opportunity.",
    images: ["/prince-jnvian-founder.webp"],
  },
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Our story"
      title="Where talent meets opportunity."
      intro="YOUTENT is a creator marketplace built to make it easier for people and businesses to discover independent talent, find the right creative service and manage projects in one place."
    >
      <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(240px,.78fr)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">The person behind YOUTENT</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Prince JNVian</h2>
          <p className="mt-2 text-sm font-extrabold uppercase tracking-[.12em] text-violet-700">Founder &amp; CEO, YOUTENT</p>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Prince JNVian founded YOUTENT with a simple vision: make creative opportunities easier to find and help talented people showcase their skills to a wider audience. YOUTENT is being built as a place where clients can discover creators and creators can present their services, connect with clients and work on projects.
          </p>
          <Link
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5"
          >
            <span aria-hidden="true">◎</span> Follow YOUTENT on Instagram
            <span aria-hidden="true">↗</span>
          </Link>
          <p className="mt-3 text-xs font-semibold text-slate-400">@youtent.in</p>
        </div>
        <div className="relative mx-auto w-full max-w-[320px]">
          <div className="absolute -inset-3 rounded-[30px] bg-gradient-to-br from-cyan-400 via-blue-600 to-fuchsia-600 opacity-25 blur-xl" />
          <div className="relative overflow-hidden rounded-[26px] border border-white bg-slate-100 shadow-2xl shadow-violet-950/15">
            <Image
              src="/prince-jnvian-founder.webp"
              alt="Prince JNVian, Founder and CEO of YOUTENT"
              width={966}
              height={1280}
              priority
              className="aspect-[3/4] w-full object-cover"
              sizes="(max-width: 768px) 80vw, 320px"
            />
          </div>
          <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-sm font-black text-slate-950">Prince JNVian</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">Building YOUTENT</p>
          </div>
        </div>
      </section>

      <div className="my-10 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <InfoSection title="What is YOUTENT?">
        <p>YOUTENT is an online marketplace where clients can explore creative services and independent professionals can showcase their work. From video editing and thumbnail design to graphic design, writing and other digital services, the platform aims to bring discovery and project collaboration together.</p>
      </InfoSection>
      <InfoSection title="Our mission">
        <p>Our mission is to make talent more visible and opportunity more accessible. We want creators to have a place to present their skills professionally, while clients can compare services and connect with people who match their project needs.</p>
      </InfoSection>
      <InfoSection title="How the platform works">
        <p>Clients can browse creator profiles and service listings, review available packages, send project requests and communicate about project requirements. Creators can manage their gigs, requests, project updates and deliveries through their YOUTENT account.</p>
      </InfoSection>
      <InfoSection title="Built by Prince JNVian">
        <p>YOUTENT is founded and led by Prince JNVian. The product is being developed with a focus on a clear user experience, useful creator tools and a dependable workflow for clients and freelancers.</p>
      </InfoSection>

      <section className="mt-8 rounded-2xl border border-violet-100 bg-gradient-to-br from-slate-950 via-[#171044] to-violet-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">Stay connected</p>
            <h2 className="mt-2 text-2xl font-black">Follow the YOUTENT journey.</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">News, creator highlights and updates from YOUTENT.</p>
          </div>
          <Link href={instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
            Instagram @youtent.in ↗
          </Link>
        </div>
      </section>
    </InfoPage>
  );
}
