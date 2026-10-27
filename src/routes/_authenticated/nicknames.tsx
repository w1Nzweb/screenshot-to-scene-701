import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/nicknames")({
  head: () => seo("Nicknames", "Nicknames on SEEKER."),
  component: () => <div className="min-h-screen" aria-label="Nicknames" />,
});
