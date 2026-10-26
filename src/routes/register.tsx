import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, Field } from "@/components/seeker/AuthLayout";
import { EMAIL_RE, USERNAME_RE, passwordProblem } from "@/lib/validation";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — SEEKER" },
      { name: "description", content: "Create a SEEKER account." },
      { property: "og:title", content: "Create account — SEEKER" },
      { property: "og:description", content: "Create a SEEKER account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [regOpen, setRegOpen] = useState(true);

  useEffect(() => {
    supabase.from("platform_settings").select("registration_open").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setRegOpen(data.registration_open);
    });
  }, []);

  useEffect(() => {
    setAvailable(null);
    if (!USERNAME_RE.test(form.username)) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc("username_available", { _name: form.username });
      setAvailable(Boolean(data));
    }, 350);
    return () => clearTimeout(t);
  }, [form.username]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const errs: Record<string, string> = {};
    if (!USERNAME_RE.test(form.username)) errs.username = "3–24 characters: letters, numbers, _ or .";
    else if (available === false) errs.username = "This username is taken.";
    if (!EMAIL_RE.test(form.email)) errs.email = "Enter a valid email.";
    const pw = passwordProblem(form.password);
    if (pw) errs.password = pw;
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match.";
    if (!agree) errs.agree = "You must accept the terms.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { emailRedirectTo: window.location.origin, data: { username: form.username } },
    });
    setLoading(false);
    if (error) {
      const msg = /closed/i.test(error.message) ? "Registration is currently closed." : error.message;
      setErrors({ form: msg });
      toast.error(msg);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a confirmation link. Open it to activate your account.">
        <Link to="/auth" className="btn btn-ghost w-full">Back to sign in</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account">
      {!regOpen && <p className="mb-4 text-xs text-warning">Registration is currently closed by the administrators.</p>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Username" id="username" error={errors.username}>
          <input id="username" autoComplete="username" className="field" value={form.username} onChange={set("username")} />
          {available !== null && !errors.username && (
            <p className={`text-xs ${available ? "text-success" : "text-destructive"}`}>{available ? "Available" : "Taken"}</p>
          )}
        </Field>
        <Field label="Email" id="email" error={errors.email}>
          <input id="email" type="email" autoComplete="email" className="field" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Password" id="password" error={errors.password}>
          <input id="password" type="password" autoComplete="new-password" className="field" value={form.password} onChange={set("password")} />
        </Field>
        <Field label="Confirm password" id="confirm" error={errors.confirm}>
          <input id="confirm" type="password" autoComplete="new-password" className="field" value={form.confirm} onChange={set("confirm")} />
        </Field>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-foreground" />
          I agree to the Terms of Service and Privacy Policy.
        </label>
        {errors.agree && <p className="text-xs text-destructive">{errors.agree}</p>}
        {errors.form && <p className="text-xs text-destructive" role="alert">{errors.form}</p>}
        <button type="submit" disabled={loading || !regOpen} className="btn btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Already registered? <Link to="/auth" className="text-foreground hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
