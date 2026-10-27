import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updatePlatformSettings } from "@/lib/admin.functions";
import { PageHeader, Empty } from "@/components/seeker/AppShell";
import { errMsg } from "@/components/seeker/Confirm";
import { useAccess, useSettings } from "@/hooks/use-seeker";
import { atLeast } from "@/lib/validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => seo("Platform Settings", "Configure SEEKER."),
  component: SettingsPage,
});

type F = { site_name: string; registration_open: boolean; maintenance_mode: boolean; announcement: string; default_role: "user" | "support"; default_profile_visibility: "public" | "private" };

function SettingsPage() {
  const { data: s } = useSettings();
  const { data: a } = useAccess();
  const save = useServerFn(updatePlatformSettings);
  const qc = useQueryClient();
  const [f, setF] = useState<F | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (s) setF({ site_name: s.site_name, registration_open: s.registration_open, maintenance_mode: s.maintenance_mode, announcement: s.announcement, default_role: s.default_role as F["default_role"], default_profile_visibility: s.default_profile_visibility as F["default_profile_visibility"] }); }, [s]);
  if (!a || !atLeast(a.role, "admin")) return <Empty text="Only administrators can change platform settings." />;
  if (!f) return <Empty text="Loading…" />;

  async function submit() {
    setBusy(true);
    try { await save({ data: f! }); toast.success("Settings saved."); qc.invalidateQueries({ queryKey: ["platform-settings"] }); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }
  const Toggle = ({ k, label, hint }: { k: "registration_open" | "maintenance_mode"; label: string; hint: string }) => (
    <label className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 text-sm md:px-8">
      <span><span className="block">{label}</span><span className="text-xs text-muted-foreground">{hint}</span></span>
      <input type="checkbox" className="h-4 w-4 accent-foreground" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} />
    </label>
  );
  return (
    <div>
      <PageHeader title="Platform Settings" action={<button className="btn btn-primary" disabled={busy} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>} />
      <Toggle k="registration_open" label="Registration open" hint="When off, new sign-ups are rejected by the database." />
      <Toggle k="maintenance_mode" label="Maintenance mode" hint="Regular users see a maintenance screen. Staff keep access." />
      <Field label="Platform name"><input className="field max-w-sm" value={f.site_name} onChange={(e) => setF({ ...f, site_name: e.target.value })} /></Field>
      <Field label="Announcement (shown to all signed-in users, empty to hide)"><textarea className="field h-20 max-w-xl py-2" maxLength={500} value={f.announcement} onChange={(e) => setF({ ...f, announcement: e.target.value })} /></Field>
      <Field label="Default role for new accounts">
        <select className="field max-w-sm" value={f.default_role} onChange={(e) => setF({ ...f, default_role: e.target.value as F["default_role"] })}><option value="user">User</option><option value="support">Support</option></select>
      </Field>
      <Field label="Default profile visibility">
        <select className="field max-w-sm" value={f.default_profile_visibility} onChange={(e) => setF({ ...f, default_profile_visibility: e.target.value as F["default_profile_visibility"] })}><option value="public">Public</option><option value="private">Private</option></select>
      </Field>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 border-b border-border px-6 py-4 md:px-8"><span className="block text-xs text-muted-foreground">{label}</span>{children}</label>;
}
