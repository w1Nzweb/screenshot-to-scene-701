import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/seeker/AppShell";
import { useAccess, useMyProfile, fmtDate } from "@/hooks/use-seeker";
import { contacts, events, media, nicknames, servers, DEMO_NOTICE } from "@/lib/demo";
import { ROLE_LABEL } from "@/lib/validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => seo("Extended Report", "A structured summary of your account."),
  component: ReportPage,
});

function ReportPage() {
  const { data: p } = useMyProfile();
  const { data: a } = useAccess();
  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: "Account",
      rows: [
        ["Username", p?.username ?? "—"],
        ["Role", ROLE_LABEL[a?.role ?? "user"]],
        ["Member since", fmtDate(p?.created_at)],
        ["Visibility", p?.visibility ?? "—"],
        ["Status", p?.status ?? "—"],
      ],
    },
    {
      title: "Activity (demo)",
      rows: [
        ["Servers", String(servers.length)],
        ["Nicknames recorded", String(nicknames.length)],
        ["Media items", String(media.length)],
        ["Contacts", String(contacts.length)],
        ["Events", String(events.length)],
      ],
    },
  ];
  return (
    <div>
      <PageHeader title="Extended Report" subtitle={`Account data is real. ${DEMO_NOTICE}`} />
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="border-b border-border px-6 pb-2 pt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground md:px-8">{s.title}</h2>
          {s.rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[180px_1fr] border-b border-border px-6 py-3 text-sm md:px-8">
              <span className="text-muted-foreground">{k}</span>
              <span className="capitalize">{v}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
