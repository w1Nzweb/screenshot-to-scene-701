import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/seeker/AppShell";
import { UserTable } from "@/components/seeker/UserTable";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/users/")({
  head: () => seo("Users", "Manage SEEKER accounts."),
  component: () => (
    <div>
      <PageHeader title="Users" subtitle="All registered accounts." />
      <UserTable />
    </div>
  ),
});
