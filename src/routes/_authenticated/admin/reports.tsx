import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminReports } from "@/lib/admin.functions";
import { PageHeader, Empty, Row } from "@/components/seeker/AppShell";
import { H } from "./index";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => seo("Reports", "Platform statistics."),
  component: Reports,
});

function Reports() {
  const fn = useServerFn(adminReports);
  const { data, error, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: () => fn() });
  if (error) return <Empty text={error.message} />;
  if (isLoading || !data) return <Empty text="Loading…" />;
  const max = Math.max(1, ...data.signups.map((d) => d.count));
  const block = (title: string, o: Record<string, number>) => (
    <section key={title}>
      <H>{title}</H>
      {Object.keys(o).length ? Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
        <Row key={k} className="flex justify-between"><span className="capitalize">{k}</span><span className="text-muted-foreground">{v}</span></Row>
      )) : <Empty text="No data." />}
    </section>
  );
  return (
    <div>
      <PageHeader title="Reports" subtitle="Live database statistics." />
      <H>Registrations — last 30 days</H>
      <div className="flex h-40 items-end gap-1 border-b border-border px-6 py-5 md:px-8" role="img" aria-label="Registrations per day">
        {data.signups.map((d) => (
          <div key={d.day} title={`${d.day}: ${d.count}`} className="flex-1 rounded-t-sm bg-foreground/70" style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }} />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border">
        {block("Roles", data.roles)}
        {block("Account status", data.statuses)}
        {block("Profile visibility", data.visibility)}
        {block("Admin actions — 30 days", data.actions)}
      </div>
    </div>
  );
}
