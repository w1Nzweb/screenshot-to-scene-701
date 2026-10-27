import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/media")({
  head: () => seo("Media", "Media on SEEKER."),
  component: () => <div className="min-h-screen" aria-label="Media" />,
});
