import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, Field } from "@/components/seeker/AuthLayout";
import { EMAIL_RE } from "@/lib/validation";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — SEEKER" },
      { name: "description", content: "Request a SEEKER password reset link." },
      { property: "og:title", content: "Reset password — SEEKER" },
      { property: "og:description", content: "Request a SEEKER password reset link." },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!EMAIL_RE.test(email)) return setError("Enter a valid email.");
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <AuthLayout title="Forgot password" subtitle={sent ? "If that email exists, a reset link is on its way." : "We'll email you a reset link."}>
      {!sent && (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" id="email" error={error}>
            <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </button>
        </form>
      )}
      <Link to="/auth" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">Back to sign in</Link>
    </AuthLayout>
  );
}
