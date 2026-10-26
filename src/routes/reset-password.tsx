import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, Field } from "@/components/seeker/AuthLayout";
import { passwordProblem } from "@/lib/validation";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — SEEKER" },
      { name: "description", content: "Choose a new SEEKER password." },
      { property: "og:title", content: "Set new password — SEEKER" },
      { property: "og:description", content: "Choose a new SEEKER password." },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const errs: Record<string, string> = {};
    const p = passwordProblem(pw);
    if (p) errs.pw = p;
    if (pw !== confirm) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/profile" });
  }

  return (
    <AuthLayout title="Set a new password">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="New password" id="pw" error={errors.pw}>
          <input id="pw" type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <Field label="Confirm password" id="confirm" error={errors.confirm}>
          <input id="confirm" type="password" className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </button>
      </form>
    </AuthLayout>
  );
}
