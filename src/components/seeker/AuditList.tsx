import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAudit } from "@/lib/admin.functions";
import { Empty, Pager, Row } from "./AppShell";
import { fmtDateTime } from "@/hooks/use-seeker";

export function AuditList({ moderationOnly = false }: { moderationOnly?: boolean }) {
  const fn = useServerFn(listAudit);
  const [page, setPage] = useState(0);
  const [prefix, setPrefix] = useState("");
  const { data, error, isLoading } = useQuery({
    queryKey: ["audit", page, prefix, moderationOnly],
    queryFn: () => fn({ data: { page, prefix, moderationOnly } }),
    placeholderData: keepPreviousData,
  });
  return (
    <div>
      {!moderationOnly && (
        <div className="border-b border-border px-6 py-4 md:px-8">
          <select className="field w-56" aria-label="Filter actions" value={prefix} onChange={(e) => { setPrefix(e.target.value); setPage(0); }}>
            <option value="">All actions</option><option value="role.">Roles</option><option value="moderation.">Moderation</option>
            <option value="account.">Accounts</option><option value="profile.">Profiles</option><option value="settings.">Settings</option><option value="ownership.">Ownership</option>
          </select>
        </div>
      )}
      {error ? <Empty text={error.message} /> : isLoading || !data ? <Empty text="Loading…" /> : !data.rows.length ? <Empty text="Nothing recorded yet." /> : (
        <>
          {data.rows.map((r: any) => (
            <Row key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
              <div className="min-w-0">
                <p><span className="font-mono text-xs">{r.action}</span> <span className="text-muted-foreground">by {r.actor ?? "system"}{r.target ? ` → ${r.target}` : ""}</span></p>
                {r.details && Object.keys(r.details).length > 0 && <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{JSON.stringify(r.details)}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</span>
            </Row>
          ))}
          <Pager page={page} total={data.total} size={data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
