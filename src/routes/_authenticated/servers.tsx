import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/servers")({
  head: () => seo("Servers", "Servers on SEEKER."),
  component: () => <div className="min-h-screen" aria-label="Servers" />,
});
