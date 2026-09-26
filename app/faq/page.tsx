import InfoPage, { InfoSection } from "@/components/InfoPage";
export const metadata = { title: "FAQ | YOUTENT", description: "Frequently asked questions about YOUTENT." };
export default function FAQPage() { return <InfoPage eyebrow="Help Center" title="Frequently asked questions." intro="Quick answers about projects, payments, creators and account security on YOUTENT.">
  <InfoSection title="How does a project start?"><p>A client browses creators, opens a profile and sends a project request. When the creator accepts, YOUTENT creates a project workspace for both sides.</p></InfoSection>
  <InfoSection title="How does payment work?"><p>The client pays the project amount plus the displayed YOUTENT platform fee through Razorpay. The payment is verified server-side before the project becomes active.</p></InfoSection>
  <InfoSection title="When does the freelancer receive the project amount?"><p>The project amount is held in escrow/pending balance after payment. It becomes available to the freelancer after the client approves completion.</p></InfoSection>
  <InfoSection title="Can I message a creator before hiring?" ><p>Yes. Creator profiles support direct communication, while accepted projects have a dedicated project conversation.</p></InfoSection>
  <InfoSection title="What if there is a problem with delivery?"><p>Use the project workspace to communicate and request revisions before completion. For account or payment issues, contact support.</p></InfoSection>
  <InfoSection title="How do notifications work?"><p>New requests, messages and project updates appear in the notification center. Opening the relevant section clears its badge; later new activity creates a new badge.</p></InfoSection>
</InfoPage>; }
