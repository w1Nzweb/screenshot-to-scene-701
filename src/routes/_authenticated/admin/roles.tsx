import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { findAccount, setRole, transferOwnership } from "@/lib/admin.functions";
import { PageHeader, Row, Empty } from "@/components/seeker/AppShell";
import { Confirm, errMsg } from "@/components/seeker/Confirm";
import { H } from "./index";
import { useAccess, fmtDate } from "@/hooks/use-seeker";
import { ROLES, ROLE_LABEL, canAssignRole, type AppRole } from "@/lib/validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/roles")({
  head: () => seo("Role Management", "Grant or revoke SEEKER roles."),
  component: Roles,
});

type Match = { id: string; username: string; created_at: string; status: string; role: AppRole };

function Roles() {
  const { data: access } = useAccess();
  const find = useServerFn(findAccount);
  const apply = useServerFn(setRole);
  const transfer = useServerFn(transferOwnership);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [sel, setSel] = useState<Match | null>(null);
  const [next, setNext] = useState<AppRole>("moderator");
  const [dlg, setDlg] = useState<null | "role" | "owner">(null);
  const me = access?.role ?? "user";

  async function search(e?: FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    try {
      const r = await find({ data: { query: query.trim() } });
      setMatches(r.matches as Match[]);
      setSel(r.matches.length === 1 ? (r.matches[0] as Match) : null);
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  }

  const problem = sel ? canAssignRole(me, sel.role, next, sel.id === access?.userId) : null;

  return (
    <div>
      <PageHeader title="Role Management" subtitle="Find an account by profile UUID or exact username." />
      <form onSubmit={search} className="flex gap-2 border-b border-border px-6 py-5 md:px-8">
        <input className="field" placeholder="Profile UUID or exact username" aria-label="Account" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Find</button>
      </form>
      {matches && !matches.length && <Empty text="No account found." />}
      {matches && matches.length > 1 && (
        <>
          <p className="px-8 pt-4 text-xs text-warning">Multiple matches — select the exact account.</p>
          {matches.map((m) => <Row key={m.id} onClick={() => setSel(m)} className={sel?.id === m.id ? "bg-row-hover" : ""}>{m.username} <span className="font-mono text-xs text-muted-foreground">{m.id}</span></Row>)}
        </>
      )}
      {sel && (
        <>
          <H>Matched account</H>
          <Row><Link to="/admin/users/$id" params={{ id: sel.id }} className="font-semibold hover:underline">{sel.username}</Link></Row>
          <Row className="font-mono text-xs text-muted-foreground">{sel.id}</Row>
          <Row className="text-muted-foreground">Current role: <span className="text-foreground">{ROLE_LABEL[sel.role]}</span> · Registered {fmtDate(sel.created_at)} · <span className="capitalize">{sel.status}</span></Row>
          <div className="flex flex-wrap items-center gap-2 px-6 py-5 md:px-8">
            <select className="field w-48" aria-label="Role" value={next} onChange={(e) => setNext(e.target.value as AppRole)}>
              {ROLES.filter((r) => r !== "owner").map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <button className="btn btn-primary" disabled={!!problem || next === sel.role} onClick={() => setDlg("role")}>{next === "user" ? "Revoke to User" : "Apply role"}</button>
            {me === "owner" && sel.id !== access?.userId && <button className="btn btn-danger" onClick={() => setDlg("owner")}>Transfer ownership</button>}
          </div>
          {problem && <p className="px-8 pb-4 text-xs text-muted-foreground">{problem}</p>}
        </>
      )}
      <Confirm open={dlg === "role"} onOpenChange={(o) => !o && setDlg(null)} title="Confirm role change"
        description={sel ? `${sel.username}: ${ROLE_LABEL[sel.role]} → ${ROLE_LABEL[next]}` : ""}
        onConfirm={async () => {
          try { await apply({ data: { userId: sel!.id, role: next, confirm: true } }); toast.success("Role updated."); setSel({ ...sel!, role: next }); }
          catch (e) { toast.error(errMsg(e)); throw e; }
        }} />
      <Confirm open={dlg === "owner"} danger onOpenChange={(o) => !o && setDlg(null)} title="Transfer ownership?"
        description="You will become an Administrator. This cannot be undone by you." typeToConfirm={sel?.username ?? ""} confirmLabel="Transfer"
        onConfirm={async (typed) => {
          try { await transfer({ data: { userId: sel!.id, confirmUsername: typed } }); toast.success("Ownership transferred."); window.location.reload(); }
          catch (e) { toast.error(errMsg(e)); throw e; }
        }} />
    </div>
  );
}
