import InfoPage, { InfoSection } from "@/components/InfoPage";
export const metadata = { title: "Terms of Service | YOUTENT" };
export default function TermsPage() { return <InfoPage eyebrow="Legal" title="Terms of Service." intro="These are starter marketplace terms for the current YOUTENT MVP. Have final terms reviewed for your operating jurisdiction before launch.">
  <InfoSection title="Marketplace role"><p>YOUTENT provides tools for discovering creators, managing project requests, communicating and processing project payments. Users remain responsible for the accuracy and legality of their work and agreements.</p></InfoSection>
  <InfoSection title="Project payments"><p>The amount and platform fee shown at checkout should be reviewed before payment. Captured project funds may be held until the project's completion flow releases the freelancer's project amount.</p></InfoSection>
  <InfoSection title="Acceptable use"><p>Users must not use YOUTENT for unlawful activity, fraud, impersonation, abuse, malicious software or unauthorized access.</p></InfoSection>
</InfoPage>; }
