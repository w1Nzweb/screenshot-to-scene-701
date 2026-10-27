import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => seo("Events", "Events on SEEKER."),
  component: () => <div className="min-h-screen" aria-label="Events" />,
});
