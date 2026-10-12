import InfoPage, { InfoSection } from "@/components/InfoPage";
export const metadata = { title: "About YOUTENT", description: "Learn about YOUTENT and its creator marketplace." };
export default function AboutPage() { return <InfoPage eyebrow="About YOUTENT" title="Where talent meets opportunity." intro="YOUTENT is a creator marketplace designed to make hiring, communication, payments and project delivery easier for clients and independent professionals.">
  <InfoSection title="What YOUTENT does"><p>Clients can discover creators, review profiles, send project requests, communicate inside a project workspace and pay through a verified payment flow. Freelancers can manage requests, active projects, deliveries and their wallet.</p></InfoSection>
  <InfoSection title="Built around project clarity"><p>Every accepted request can become a dedicated project workspace with its own budget, deadline, messages, files, delivery and review flow. The goal is to keep important project information in one place.</p></InfoSection>
  <InfoSection title="Secure by design"><p>Authentication is handled with Supabase Auth, payments are verified with Razorpay signatures and server-side checks, and escrow balances are released only through the project completion flow.</p></InfoSection>
</InfoPage>; }
