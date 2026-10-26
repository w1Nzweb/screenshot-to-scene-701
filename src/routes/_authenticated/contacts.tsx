import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Row, StatusDot } from "@/components/seeker/AppShell";
import { contacts, DEMO_NOTICE } from "@/lib/demo";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/contacts")({
  head: () => seo("Contacts", "Your contacts."),
  component: () => (
    <div>
      <PageHeader title="Contacts" subtitle={DEMO_NOTICE} />
      {contacts.map((c) => (
        <Row key={c.handle} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.handle}</p>
          </div>
          <span className="flex items-center gap-2 text-xs capitalize text-muted-foreground"><StatusDot status={c.status} />{c.status}</span>
        </Row>
      ))}
    </div>
  ),
});
