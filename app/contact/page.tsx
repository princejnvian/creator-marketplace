import InfoPage, { InfoSection } from "@/components/InfoPage";
import Link from "next/link";
export const metadata = { title: "Contact YOUTENT", description: "Contact YOUTENT support." };
export default function ContactPage() { return <InfoPage eyebrow="Support" title="Contact YOUTENT." intro="Need help with an account, project, payment or creator profile? Reach out and include the relevant project or payment reference when possible.">
  <InfoSection title="General support"><p>Email us at <a className="font-bold text-blue-600" href="mailto:support@youtent.in">support@youtent.in</a>. For payment issues, include the project ID and Razorpay payment/order ID. Never send your password, OTP or payment card details.</p></InfoSection>
  <InfoSection title="Project support"><p>For an active project, start with the project workspace so the conversation remains attached to the correct project. You can also use the Notifications page to open the relevant request or project.</p></InfoSection>
  <InfoSection title="Account & security"><p>If you suspect unauthorized access, sign out of active sessions, change your password if applicable and contact support immediately.</p></InfoSection>
  <div className="mt-6 flex flex-wrap gap-3"><Link href="/faq" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Read FAQ →</Link><Link href="/security" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Security →</Link></div>
</InfoPage>; }
