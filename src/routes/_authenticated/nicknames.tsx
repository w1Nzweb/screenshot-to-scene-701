import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Row } from "@/components/seeker/AppShell";
import { nicknames, DEMO_NOTICE } from "@/lib/demo";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/nicknames")({
  head: () => seo("Nicknames", "Nickname history."),
  component: () => (
    <div>
      <PageHeader title="Nicknames" subtitle={DEMO_NOTICE} />
      {nicknames.map((n) => (
        <Row key={n}><span className="font-semibold">{n}</span></Row>
      ))}
    </div>
  ),
});
