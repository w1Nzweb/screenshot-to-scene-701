import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminOverview } from "@/lib/admin.functions";
import { PageHeader, Row, Empty } from "@/components/seeker/AppShell";
import { fmtDate, fmtDateTime } from "@/hooks/use-seeker";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => seo("Admin overview", "SEEKER administration overview."),
  component: Overview,
});

function Overview() {
  const fn = useServerFn(adminOverview);
  const { data, error, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
  if (error) return <Empty text={error.message} />;
  if (isLoading || !data) return <Empty text="Loading…" />;
  const stats = [
    ["Registered users", data.total], ["Administrators", data.admins], ["Moderators", data.moderators],
    ["Banned", data.banned], ["Suspended", data.suspended], ["New in 7 days", data.newThisWeek],
  ] as const;
  return (
    <div>
      <PageHeader title="Overview" />
      <div className="grid grid-cols-2 gap-px border-b border-border bg-border md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-background px-6 py-5">
            <p className="text-2xl font-semibold">{v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-border">
        <section>
          <H>Recently registered</H>
          {data.recent.length ? data.recent.map((u: any) => (
            <Link key={u.id} to="/admin/users/$id" params={{ id: u.id }}>
              <Row className="flex justify-between"><span className="font-semibold">{u.username}</span><span className="text-muted-foreground">{fmtDate(u.created_at)}</span></Row>
            </Link>
          )) : <Empty text="No users yet." />}
        </section>
        <section>
          <H>Recent administrative actions</H>
          {data.actions.length ? data.actions.map((a: any) => (
            <Row key={a.id} className="flex justify-between gap-4">
              <span className="truncate"><span className="font-mono text-xs">{a.action}</span> <span className="text-muted-foreground">by {a.actor ?? "system"}{a.target ? ` → ${a.target}` : ""}</span></span>
              <span className="shrink-0 text-xs text-muted-foreground">{fmtDateTime(a.created_at)}</span>
            </Row>
          )) : <Empty text="No actions recorded." />}
        </section>
      </div>
    </div>
  );
}

export function H({ children }: { children: React.ReactNode }) {
  return <h2 className="border-b border-border px-6 pb-2 pt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground md:px-8">{children}</h2>;
}
