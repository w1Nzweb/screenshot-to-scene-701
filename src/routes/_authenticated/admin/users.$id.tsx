import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  getUserDetail, moderateUser, addModerationNote, adminUpdateProfile, deleteAccount, setRole,
} from "@/lib/admin.functions";
import { PageHeader, Row, Empty, StatusDot } from "@/components/seeker/AppShell";
import { Confirm, errMsg } from "@/components/seeker/Confirm";
import { H } from "./index";
import { fmtDate, fmtDateTime } from "@/hooks/use-seeker";
import { ROLES, ROLE_LABEL, atLeast, canAssignRole, ROLE_RANK, type AppRole } from "@/lib/validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/users/$id")({
  head: () => seo("User detail", "Account administration."),
  component: UserDetail,
});

function UserDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fn = useServerFn(getUserDetail);
  const moderate = useServerFn(moderateUser);
  const note = useServerFn(addModerationNote);
  const update = useServerFn(adminUpdateProfile);
  const del = useServerFn(deleteAccount);
  const role = useServerFn(setRole);
  const { data: d, error, isLoading } = useQuery({ queryKey: ["admin-user", id], queryFn: () => fn({ data: { id } }) });
  const [form, setForm] = useState({ username: "", display_name: "", bio: "" });
  const [noteText, setNoteText] = useState("");
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState("");
  const [nextRole, setNextRole] = useState<AppRole>("user");
  const [dialog, setDialog] = useState<null | "ban" | "suspend" | "restore" | "delete" | "role">(null);

  useEffect(() => {
    if (d) { setForm({ username: d.profile.username, display_name: d.profile.display_name ?? "", bio: d.profile.bio }); setNextRole(d.role); }
  }, [d]);

  if (error) return <Empty text={error.message} />;
  if (isLoading || !d) return <Empty text="Loading…" />;
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-user", id] }); qc.invalidateQueries({ queryKey: ["admin-users"] }); };
  const outranks = ROLE_RANK[d.myRole] > ROLE_RANK[d.role] && !d.isSelf;
  const run = async (p: Promise<unknown>, ok: string) => {
    try { await p; toast.success(ok); refresh(); } catch (e) { toast.error(errMsg(e)); throw e; }
  };
  const roleProblem = canAssignRole(d.myRole, d.role, nextRole, d.isSelf);

  return (
    <div>
      <PageHeader title={d.profile.username} subtitle={d.profile.display_name ?? undefined} action={<Link to="/admin/users" className="btn btn-ghost">All users</Link>} />
      <KV k="Profile ID" v={<button className="inline-flex items-center gap-2 font-mono text-xs" onClick={() => { navigator.clipboard.writeText(d.profile.id); toast.success("Copied."); }}>{d.profile.id}<Copy className="h-3.5 w-3.5" /></button>} />
      <KV k="Email" v={d.email ?? "Requires administrator"} />
      <KV k="Role" v={ROLE_LABEL[d.role]} />
      <KV k="Status" v={<span className="inline-flex items-center gap-2 capitalize"><StatusDot status={d.profile.status} />{d.profile.status}{d.profile.status_reason ? ` — ${d.profile.status_reason}` : ""}{d.profile.status_until ? ` (until ${fmtDateTime(d.profile.status_until)})` : ""}</span>} />
      <KV k="Registered" v={fmtDate(d.profile.created_at)} />
      <KV k="Last sign-in" v={d.email ? fmtDateTime(d.last_sign_in_at) : "—"} />
      <KV k="Visibility" v={d.profile.visibility} />

      {atLeast(d.myRole, "admin") && (outranks || d.isSelf) && (
        <>
          <H>Edit profile</H>
          <div className="grid max-w-2xl gap-3 px-6 py-5 sm:grid-cols-2 md:px-8">
            <input className="field" aria-label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input className="field" aria-label="Display name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            <textarea className="field h-24 py-2 sm:col-span-2" aria-label="Description" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            <div><button className="btn btn-primary" onClick={() => run(update({ data: { userId: id, ...form } }), "Profile updated.").catch(() => {})}>Save profile</button></div>
          </div>
        </>
      )}

      {atLeast(d.myRole, "admin") && (
        <>
          <H>Role</H>
          <div className="flex flex-wrap items-center gap-2 px-6 py-5 md:px-8">
            <select className="field w-48" aria-label="New role" value={nextRole} onChange={(e) => setNextRole(e.target.value as AppRole)}>
              {ROLES.filter((r) => r !== "owner").map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <button className="btn btn-primary" disabled={!!roleProblem || nextRole === d.role} onClick={() => setDialog("role")}>Apply role</button>
            {roleProblem && <span className="text-xs text-muted-foreground">{roleProblem}</span>}
          </div>
        </>
      )}

      {atLeast(d.myRole, "moderator") && (
        <>
          <H>Moderation</H>
          {outranks ? (
            <div className="space-y-3 px-6 py-5 md:px-8">
              <input className="field max-w-xl" placeholder="Reason (required for suspend/ban)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex flex-wrap items-center gap-2">
                <input type="datetime-local" className="field w-56" aria-label="Suspension end" value={until} onChange={(e) => setUntil(e.target.value)} />
                <button className="btn btn-ghost" disabled={!reason || !until} onClick={() => setDialog("suspend")}>Suspend</button>
                <button className="btn btn-danger" disabled={!reason} onClick={() => setDialog("ban")}>Ban</button>
                <button className="btn btn-ghost" disabled={d.profile.status === "active"} onClick={() => setDialog("restore")}>Restore</button>
              </div>
            </div>
          ) : <Empty text="You can only moderate accounts below your level." />}
          <H>Internal notes</H>
          <div className="flex gap-2 px-6 py-4 md:px-8">
            <input className="field" placeholder="Add an internal note" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button className="btn btn-primary" disabled={!noteText.trim()} onClick={() => run(note({ data: { userId: id, note: noteText } }), "Note added.").then(() => setNoteText("")).catch(() => {})}>Add</button>
          </div>
          {d.notes.map((n: any) => <Row key={n.id}><p>{n.note}</p><p className="mt-1 text-xs text-muted-foreground">{n.author ?? "unknown"} · {fmtDateTime(n.created_at)}</p></Row>)}
        </>
      )}

      <H>Role history</H>
      {d.history.length ? d.history.map((h: any) => (
        <Row key={h.id} className="flex justify-between gap-4"><span>{h.previous_role ? ROLE_LABEL[h.previous_role as AppRole] : "—"} → {ROLE_LABEL[h.new_role as AppRole]} <span className="text-muted-foreground">by {h.actor ?? "system"}</span></span><span className="text-xs text-muted-foreground">{fmtDateTime(h.created_at)}</span></Row>
      )) : <Empty text="Requires administrator or no history." />}

      <H>Activity</H>
      {d.events.map((e: any) => (
        <Row key={e.id} className="flex justify-between gap-4"><span><span className="font-mono text-xs">{e.action}</span> <span className="text-muted-foreground">by {e.actor ?? "system"}</span></span><span className="text-xs text-muted-foreground">{fmtDateTime(e.created_at)}</span></Row>
      ))}

      {atLeast(d.myRole, "admin") && outranks && d.role !== "owner" && (
        <>
          <H>Danger zone</H>
          <div className="px-6 py-5 md:px-8"><button className="btn btn-danger" onClick={() => setDialog("delete")}>Delete account</button></div>
        </>
      )}

      <Confirm open={dialog === "role"} onOpenChange={(o) => !o && setDialog(null)} title={`Change role to ${ROLE_LABEL[nextRole]}?`} description={`${d.profile.username}: ${ROLE_LABEL[d.role]} → ${ROLE_LABEL[nextRole]}`}
        onConfirm={() => run(role({ data: { userId: id, role: nextRole, confirm: true } }), "Role updated.")} />
      <Confirm open={dialog === "suspend"} onOpenChange={(o) => !o && setDialog(null)} title="Suspend account?" description={`Until ${until}. Reason: ${reason}`}
        onConfirm={() => run(moderate({ data: { userId: id, action: "suspend", reason, until: until ? new Date(until).toISOString() : null } }), "Account suspended.")} />
      <Confirm open={dialog === "ban"} danger onOpenChange={(o) => !o && setDialog(null)} title="Ban account?" description={`Reason: ${reason}`} confirmLabel="Ban"
        onConfirm={() => run(moderate({ data: { userId: id, action: "ban", reason, until: null } }), "Account banned.")} />
      <Confirm open={dialog === "restore"} onOpenChange={(o) => !o && setDialog(null)} title="Restore account?" description="Lifts any suspension or ban."
        onConfirm={() => run(moderate({ data: { userId: id, action: "restore", reason: "", until: null } }), "Account restored.")} />
      <Confirm open={dialog === "delete"} danger onOpenChange={(o) => !o && setDialog(null)} title="Delete account permanently?" description="This cannot be undone." typeToConfirm={d.profile.username} confirmLabel="Delete"
        onConfirm={async (typed) => { await run(del({ data: { userId: id, confirmUsername: typed } }), "Account deleted."); navigate({ to: "/admin/users" }); }} />
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border px-6 py-3 text-sm sm:grid-cols-[160px_1fr] md:px-8">
      <span className="text-muted-foreground">{k}</span><span className="min-w-0 break-all">{v}</span>
    </div>
  );
}
