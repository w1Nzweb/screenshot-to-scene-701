import { Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { listUsers } from "@/lib/admin.functions";
import { Empty, Pager, Row, StatusDot } from "./AppShell";
import { fmtDate, fmtDateTime } from "@/hooks/use-seeker";
import { ROLE_LABEL, type AppRole } from "@/lib/validation";

export function UserTable({ defaultStatus = "all" as "all" | "active" | "suspended" | "banned" }) {
  const fn = useServerFn(listUsers);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState(defaultStatus);
  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(0); }, 300); return () => clearTimeout(t); }, [q]);
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-users", debounced, page, status],
    queryFn: () => fn({ data: { q: debounced, page, status } }),
    placeholderData: keepPreviousData,
  });
  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-border px-6 py-4 md:px-8">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="field pl-9" placeholder="Search by username or profile UUID" aria-label="Search users" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field w-40" aria-label="Status filter" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0); }}>
          <option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="banned">Banned</option>
        </select>
      </div>
      {error ? <Empty text={error.message} /> : isLoading || !data ? <Empty text="Loading…" /> : !data.users.length ? <Empty text="No accounts match." /> : (
        <>
          {data.users.map((u) => (
            <Link key={u.id} to="/admin/users/$id" params={{ id: u.id }}>
              <Row className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_110px_100px_110px_140px]">
                <div className="min-w-0"><p className="truncate font-semibold">{u.username}</p><p className="truncate font-mono text-[11px] text-muted-foreground">{u.id}</p></div>
                <span className="hidden truncate text-muted-foreground lg:block">{data.canSeeEmail ? u.email : "hidden"}</span>
                <span className="text-muted-foreground">{ROLE_LABEL[u.role as AppRole]}</span>
                <span className="hidden items-center gap-2 capitalize text-muted-foreground lg:flex"><StatusDot status={u.status} />{u.status}</span>
                <span className="hidden text-muted-foreground lg:block">{fmtDate(u.created_at)}</span>
                <span className="hidden text-xs text-muted-foreground lg:block">{data.canSeeEmail ? fmtDateTime(u.last_sign_in_at) : "—"}</span>
              </Row>
            </Link>
          ))}
          <Pager page={page} total={data.total} size={data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}
