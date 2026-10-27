import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => seo("Extended Report", "Extended Report on SEEKER."),
  component: () => <div className="min-h-screen" aria-label="Extended Report" />,
});
