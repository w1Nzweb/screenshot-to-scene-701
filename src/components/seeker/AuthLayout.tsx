import type { ReactNode } from "react";
import clouds from "@/assets/clouds.png.asset.json";
import { Logo } from "./Logo";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string | undefined; children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full bg-ink bg-cover bg-center"
      style={{ backgroundImage: `url(${clouds.url})` }}
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-10 md:justify-end md:pr-[10vw]">
        <div className="auth-panel fade-in w-full max-w-sm rounded-md p-8">
          <Logo size="lg" />
          <h1 className="mt-8 text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}
