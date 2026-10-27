import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => seo("Contacts", "Contacts on SEEKER."),
  component: () => <div className="min-h-screen" aria-label="Contacts" />,
});
