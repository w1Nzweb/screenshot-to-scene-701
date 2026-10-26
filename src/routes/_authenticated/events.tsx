import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Row } from "@/components/seeker/AppShell";
import { events, DEMO_NOTICE } from "@/lib/demo";
import { fmtDate } from "@/hooks/use-seeker";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => seo("Events", "Chronological account events."),
  component: () => (
    <div>
      <PageHeader title="Events" subtitle={DEMO_NOTICE} />
      {events.map((e) => (
        <Row key={e.date + e.title} className="grid grid-cols-[110px_minmax(0,1fr)_auto] gap-4">
          <span className="text-muted-foreground">{fmtDate(e.date)}</span>
          <span className="truncate">{e.title}</span>
          <span className="text-xs text-muted-foreground">{e.kind}</span>
        </Row>
      ))}
    </div>
  ),
});
