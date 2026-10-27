import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/seeker/AppShell";
import { AuditList } from "@/components/seeker/AuditList";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => seo("Audit Logs", "Every privileged action on SEEKER."),
  component: () => (
    <div>
      <PageHeader title="Audit Logs" subtitle="Every privileged action, newest first." />
      <AuditList />
    </div>
  ),
});
