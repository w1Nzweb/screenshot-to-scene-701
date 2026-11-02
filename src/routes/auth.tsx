import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout, Field } from "@/components/seeker/AuthLayout";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SEEKER" },
      { name: "description", content: "Sign in to your SEEKER account." },
      { property: "og:title", content: "Sign in — SEEKER" },
      { property: "og:description", content: "Sign in to your SEEKER account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const errs: Record<string, string> = {};
    if (!email.trim()) errs["email"] = "Email is required.";
    if (!password) errs["password"] = "Password is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      const msg = /banned/i.test(error.message) ? "This account is suspended or banned." : error.message;
      setErrors({ form: msg });
      toast.error(msg);
      return;
    }
    if (!remember) sessionStorage.setItem("seeker-ephemeral", "1");
    toast.success("Welcome back.");
    navigate({ to: "/profile" });
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Enter your credentials to continue.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" id="email" error={errors["email"]}>
          <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" id="password" error={errors["password"]}>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password" className="field pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-foreground" />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot password?</Link>
        </div>
        {errors["form"] && <p className="text-xs text-destructive" role="alert">{errors["form"]}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </button>
        <p className="text-center text-xs text-muted-foreground">
          No account? <Link to="/register" className="text-foreground hover:underline">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
