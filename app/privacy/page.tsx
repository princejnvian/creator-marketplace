import InfoPage, { InfoSection } from "@/components/InfoPage";
export const metadata = { title: "Privacy Policy | YOUTENT" };
export default function PrivacyPage() { return <InfoPage eyebrow="Legal" title="Privacy Policy." intro="This page explains the main categories of information used to operate YOUTENT. Replace this draft with your final legal policy before public launch.">
  <InfoSection title="Information we use"><p>Account details, profile information, project information, messages, files and transaction references may be processed to provide the marketplace and project workflow.</p></InfoSection>
  <InfoSection title="Payments"><p>Payment processing is handled by the configured payment provider. YOUTENT stores transaction references needed to verify and reconcile project payments.</p></InfoSection>
  <InfoSection title="Your choices"><p>You can update profile information and contact support about account or data requests. Do not include sensitive credentials in support messages.</p></InfoSection>
</InfoPage>; }
