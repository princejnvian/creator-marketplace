import Link from "next/link";
import YoutentLogo from "@/components/YoutentLogo";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <YoutentLogo href="/" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
            YOUTENT connects clients with talented creators and freelancers through a dedicated marketplace for creative services.
          </p>
          <p className="mt-3 text-xs font-bold text-slate-500">
            Founded by <Link href="/about" className="text-slate-800 hover:text-blue-600">Prince JNVian</Link>
          </p>
          <Link
            href="https://www.instagram.com/youtent.in"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-extrabold text-violet-800 transition hover:bg-violet-100"
          >
            <span aria-hidden="true">◎</span> Follow us on Instagram
          </Link>
        </div>
        <FooterGroup title="Platform" links={[
          ["Browse Creators", "/creators"], ["How it works", "/about"], ["FAQ", "/faq"],
        ]} />
        <FooterGroup title="Company" links={[
          ["About YOUTENT", "/about"], ["Contact Us", "/contact"], ["Security", "/security"],
        ]} />
        <FooterGroup title="Legal" links={[
          ["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"],
        ]} />
      </div>
      <div className="border-t border-slate-100 px-5 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} YOUTENT. All rights reserved. <span className="mx-1">·</span> Founded by Prince JNVian
      </div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[.16em] text-slate-400">{title}</p>
      <div className="mt-3 space-y-2">
        {links.map(([label, href]) => <Link key={href + label} href={href} className="block text-sm font-semibold text-slate-600 hover:text-blue-600">{label}</Link>)}
      </div>
    </div>
  );
}
