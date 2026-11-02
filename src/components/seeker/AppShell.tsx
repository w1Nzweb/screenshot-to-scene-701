import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  User, Server, Tag, Image, Users, CalendarDays, TrendingUp, Settings, LogOut, Menu, X,
  LayoutDashboard, UserCog, ShieldCheck, Gavel, BarChart3, ScrollText, SlidersHorizontal, Megaphone,
} from "lucide-react";
import { EyeMark, Logo, EYE_URL } from "./Logo";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useAccess, useSettings, useSignOut } from "@/hooks/use-seeker";
import { atLeast, type AppRole } from "@/lib/validation";

type Item = { to: string; label: string; icon: typeof User; min?: AppRole; exact?: boolean };

const MAIN: Item[] = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/servers", label: "Servers", icon: Server },
  { to: "/nicknames", label: "Nicknames", icon: Tag },
  { to: "/media", label: "Media", icon: Image },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/report", label: "Extended Report", icon: TrendingUp },
];

const ADMIN: Item[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, min: "support", exact: true },
  { to: "/admin/users", label: "Users", icon: UserCog, min: "support" },
  { to: "/admin/roles", label: "Role Management", icon: ShieldCheck, min: "admin" },
  { to: "/admin/moderation", label: "Moderation", icon: Gavel, min: "moderator" },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, min: "support" },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText, min: "support" },
  { to: "/admin/settings", label: "Platform Settings", icon: SlidersHorizontal, min: "admin" },
];

function NavLink({ item, path, onClick }: { item: Item; path: string; onClick?: () => void }) {
  const active = item.exact ? path === item.to : path === item.to || path.startsWith(item.to + "/");
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
        active ? "bg-row-hover text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.6} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: access } = useAccess();
  const { data: settings } = useSettings();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const role = access?.role ?? "user";
  const inAdmin = path.startsWith("/admin");
  const adminItems = ADMIN.filter((i) => atLeast(role, i.min ?? "user"));

  if (settings?.maintenance_mode && access && !atLeast(role, "support")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <EyeMark className="h-16 w-16" />
        <h1 className="text-xl font-semibold">Under maintenance</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{settings.site_name} is temporarily unavailable. Please check back soon.</p>
        <button className="btn btn-ghost" onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col px-6 py-6">
      <div className="flex items-center justify-between">
        <Link to="/profile" onClick={() => setOpen(false)}><Logo /></Link>
        <button className="md:hidden text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="mt-6 gap-1 flex flex-col" aria-label="Main">
        {inAdmin ? (
          <>
            <Link to="/profile" onClick={() => setOpen(false)} className="mb-2 px-2 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">← Back to SEEKER</Link>
            {adminItems.map((i) => <NavLink key={i.to} item={i} path={path} onClick={() => setOpen(false)} />)}
          </>
        ) : (
          <>
            {MAIN.map((i) => <NavLink key={i.to} item={i} path={path} onClick={() => setOpen(false)} />)}
            {adminItems.length > 0 && (
              <>
                <div className="my-3 border-t border-border" />
                <NavLink item={{ to: "/admin", label: "Admin Panel", icon: ShieldCheck }} path={path} onClick={() => setOpen(false)} />
              </>
            )}
          </>
        )}
      </nav>
      {!inAdmin && (
        <div className="mt-6 aspect-square w-full overflow-hidden rounded-md bg-ink">
          <img src={EYE_URL} alt="SEEKER" className="h-full w-full object-contain" />
        </div>
      )}
      {!inAdmin && <SearchId onDone={() => setOpen(false)} />}
      <div className="mt-auto flex flex-col pt-6">
        <NavLink item={{ to: "/account", label: "Account settings", icon: Settings }} path={path} onClick={() => setOpen(false)} />
        <button onClick={() => signOut()} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-secondary text-[15px] text-muted-foreground hover:text-foreground">
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 overflow-y-auto border-r border-border bg-panel md:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] overflow-y-auto bg-panel">{sidebar}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Logo />
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-muted-foreground"><Menu className="h-5 w-5" /></button>
        </header>
        {settings?.announcement && (
          <div className="flex items-center gap-3 border-b border-border px-6 py-3 text-sm text-muted-foreground">
            <Megaphone className="h-4 w-4 shrink-0" strokeWidth={1.6} />
            <span>{settings.announcement}</span>
          </div>
        )}
        <main key={path} className="fade-in flex-1">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string | undefined; action?: ReactNode | undefined }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border px-6 py-6 md:px-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Row({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`border-b border-border px-6 py-3 text-sm transition-colors hover:bg-row-hover md:px-8 ${onClick ? "cursor-pointer" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="px-8 py-12 text-center text-sm text-muted-foreground">{text}</p>;
}

export function Pager({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="flex items-center justify-between px-6 py-4 text-xs text-muted-foreground md:px-8">
      <span>{total} total · page {page + 1} of {pages}</span>
      <div className="flex gap-2">
        <button className="btn btn-ghost h-8" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
        <button className="btn btn-ghost h-8" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  const cls = status === "banned" ? "bg-destructive" : status === "suspended" ? "bg-warning" : status === "online" ? "bg-success" : status === "away" ? "bg-warning" : status === "active" ? "bg-success" : "bg-muted-foreground";
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${cls}`} aria-hidden />;
}

function SearchId({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      className="relative mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        onDone();
        navigate({ to: "/search", search: { id: q.trim() } });
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID" aria-label="Search ID" className="field rounded-lg pl-9" />
    </form>
  );
}
