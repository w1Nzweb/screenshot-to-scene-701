import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SEEKER" },
      { name: "description", content: "SEEKER — a private, minimal profile platform." },
      { property: "og:title", content: "SEEKER" },
      { property: "og:description", content: "SEEKER — a private, minimal profile platform." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/profile" });
  },
});
