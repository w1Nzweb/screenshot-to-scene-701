import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/seeker/AppShell";
import { UserTable } from "@/components/seeker/UserTable";
import { AuditList } from "@/components/seeker/AuditList";
import { H } from "./index";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  head: () => seo("Moderation", "Suspend, ban and restore accounts."),
  component: () => (
    <div>
      <PageHeader title="Moderation" subtitle="Open an account to suspend, ban, restore or add notes." />
      <UserTable />
      <H>Moderation history</H>
      <AuditList moderationOnly />
    </div>
  ),
});
