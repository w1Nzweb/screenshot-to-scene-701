import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => seo("Profile", "Profile on SEEKER."),
  component: () => <div className="min-h-screen" aria-label="Profile" />,
});
