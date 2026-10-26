import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/seeker/AppShell";
import { fmtDateTime, useMyProfile, useSignOut } from "@/hooks/use-seeker";
import { passwordProblem } from "@/lib/validation";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => seo("Account settings", "Manage your SEEKER account and sessions."),
  component: AccountPage,
});

function AccountPage() {
  const { data: p } = useMyProfile();
  const signOut = useSignOut();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword() {
    const prob = passwordProblem(pw);
    if (!cur) return toast.error("Enter your current password.");
    if (prob) return toast.error(prob);
    if (pw !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password changed.");
    setCur(""); setPw(""); setConfirm("");
  }

  return (
    <div>
      <PageHeader title="Account settings" />
      <Section title="Identity">
        <KV k="Email" v={p?.email ?? "—"} />
        <KV
          k="Profile ID"
          v={
            <button className="inline-flex items-center gap-2 font-mono text-xs hover:text-foreground" onClick={() => { if (p) { navigator.clipboard.writeText(p.id); toast.success("Copied."); } }}>
              {p?.id} <Copy className="h-3.5 w-3.5" />
            </button>
          }
        />
      </Section>
      <Section title="Password">
        <div className="max-w-sm space-y-3 px-6 py-5 md:px-8">
          <input type="password" className="field" placeholder="Current password" aria-label="Current password" value={cur} onChange={(e) => setCur(e.target.value)} />
          <input type="password" className="field" placeholder="New password" aria-label="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <input type="password" className="field" placeholder="Confirm new password" aria-label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button className="btn btn-primary" disabled={busy} onClick={changePassword}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Change password</button>
        </div>
      </Section>
      <Section title="Sessions">
        <KV k="Last sign-in" v={fmtDateTime(p?.last_sign_in_at)} />
        <div className="flex flex-wrap gap-2 px-6 py-5 md:px-8">
          <button className="btn btn-ghost" onClick={() => signOut("local")}>Sign out of this device</button>
          <button className="btn btn-danger" onClick={() => signOut("global")}>Sign out everywhere</button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="border-b border-border px-6 pb-2 pt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground md:px-8">{title}</h2>
      {children}
    </section>
  );
}
function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border px-6 py-3 text-sm sm:grid-cols-[180px_1fr] md:px-8">
      <span className="text-muted-foreground">{k}</span>
      <span className="min-w-0 break-all text-muted-foreground">{v}</span>
    </div>
  );
}
