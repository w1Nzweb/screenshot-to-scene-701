import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/seeker/AppShell";
import { EyeMark } from "@/components/seeker/Logo";
import { fmtDate, useAccess, useMyProfile } from "@/hooks/use-seeker";
import { ROLE_LABEL, USERNAME_RE } from "@/lib/validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => seo("Profile", "Your SEEKER profile."),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: p, isLoading } = useMyProfile();
  const { data: access } = useAccess();
  const qc = useQueryClient();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ username: "", display_name: "", bio: "", visibility: "public" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (p) setForm({ username: p.username, display_name: p.display_name ?? "", bio: p.bio, visibility: p.visibility });
  }, [p]);

  if (isLoading || !p) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  async function save() {
    if (!USERNAME_RE.test(form.username)) return setErr("Username: 3–24 letters, numbers, _ or .");
    if (form.bio.length > 500) return setErr("Bio is too long.");
    setErr("");
    setSaving(true);
    if (form.username.toLowerCase() !== p!.username.toLowerCase()) {
      const { data: ok } = await supabase.rpc("username_available", { _name: form.username });
      if (!ok) { setSaving(false); return setErr("That username is taken."); }
    }
    const { error } = await supabase
      .from("profiles")
      .update({ ...form, display_name: form.display_name.trim(), updated_at: new Date().toISOString() })
      .eq("id", p!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved.");
    setEdit(false);
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        action={!edit ? <button className="btn btn-ghost" onClick={() => setEdit(true)}>Edit profile</button> : null}
      />
      <div className="flex items-center gap-5 border-b border-border px-6 py-6 md:px-8">
        <EyeMark className="h-16 w-16" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{p.display_name || p.username}</p>
          <p className="text-sm text-muted-foreground">@{p.username} · {ROLE_LABEL[access?.role ?? "user"]}</p>
        </div>
      </div>

      {edit ? (
        <div className="max-w-xl space-y-4 px-6 py-6 md:px-8">
          <L label="Username"><input className="field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></L>
          <L label="Display name"><input className="field" maxLength={48} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></L>
          <L label="Description"><textarea className="field h-28 py-2" maxLength={500} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></L>
          <L label="Profile visibility">
            <select className="field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
              <option value="public">Public — visible to signed-in members</option>
              <option value="private">Private — only you and staff</option>
            </select>
          </L>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={saving} onClick={save}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</button>
            <button className="btn btn-ghost" onClick={() => setEdit(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <dl>
          <Item k="Description" v={p.bio || <span className="text-muted-foreground">No description yet.</span>} />
          <Item k="Member since" v={fmtDate(p.created_at)} />
          <Item k="Visibility" v={<span className="inline-flex items-center gap-2">{p.visibility === "private" ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}{p.visibility === "private" ? "Private" : "Public"}</span>} />
          <Item k="Email" v={<span className="text-muted-foreground">{p.email.replace(/^(.).*(@.*)$/, "$1•••$2")}</span>} />
          <Item
            k="Profile ID"
            v={
              <button className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground" onClick={() => { navigator.clipboard.writeText(p.id); toast.success("Profile ID copied."); }}>
                {p.id} <Copy className="h-3.5 w-3.5" />
              </button>
            }
          />
        </dl>
      )}
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs text-muted-foreground">{label}</span>{children}</label>;
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border px-6 py-3.5 text-sm sm:grid-cols-[180px_1fr] md:px-8">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </div>
  );
}
