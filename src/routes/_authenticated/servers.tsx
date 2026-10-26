import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Row } from "@/components/seeker/AppShell";
import { servers, DEMO_NOTICE } from "@/lib/demo";
import { fmtDate } from "@/hooks/use-seeker";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/servers")({
  head: () => seo("Servers", "Servers linked to your account."),
  component: () => (
    <div>
      <PageHeader title="Servers" subtitle={DEMO_NOTICE} />
      {servers.map((s) => (
        <Row key={s.name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 sm:grid-cols-[minmax(0,1fr)_120px_120px_120px]">
          <span className="truncate font-semibold">{s.name}</span>
          <span className="text-muted-foreground">{s.role}</span>
          <span className="hidden text-muted-foreground sm:block">{s.members.toLocaleString()} members</span>
          <span className="hidden text-right text-muted-foreground sm:block">{fmtDate(s.joined)}</span>
        </Row>
      ))}
    </div>
  ),
});
