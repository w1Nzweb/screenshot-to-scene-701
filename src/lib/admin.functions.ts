import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canAssignRole, ROLE_RANK, atLeast, type AppRole } from "./validation";

const roleEnum = z.enum(["owner", "admin", "moderator", "support", "user"]);
const uuid = z.string().uuid();

type Ctx = { supabase: any; userId: string };

async function actorRole(ctx: Ctx): Promise<AppRole> {
  const { data, error } = await ctx.supabase.rpc("get_user_role", { _user_id: ctx.userId });
  if (error) throw new Error("Could not verify permissions");
  return (data ?? "user") as AppRole;
}

async function requireRole(ctx: Ctx, min: AppRole) {
  const role = await actorRole(ctx);
  if (!atLeast(role, min)) throw new Error("Forbidden: insufficient permissions");
  return role;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function rateLimit(db: any, actorId: string) {
  const since = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", actorId)
    .gte("created_at", since);
  if ((count ?? 0) >= 30) throw new Error("Too many administrative actions. Wait a minute.");
}

async function audit(db: any, actorId: string, action: string, targetId: string | null, details: object = {}) {
  await db.from("audit_log").insert({ actor_id: actorId, action, target_id: targetId, details });
}

async function targetRole(db: any, userId: string): Promise<AppRole> {
  const { data } = await db.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  return (data?.role ?? "user") as AppRole;
}

function effectiveStatus(p: { status: string; status_until: string | null }) {
  if (p.status === "suspended" && p.status_until && new Date(p.status_until) < new Date()) return "active";
  return p.status;
}

async function usernames(db: any, ids: string[]) {
  const uniq = [...new Set(ids.filter(Boolean))];
  if (!uniq.length) return {} as Record<string, string>;
  const { data } = await db.from("profiles").select("id, username").in("id", uniq);
  return Object.fromEntries((data ?? []).map((r: any) => [r.id, r.username])) as Record<string, string>;
}

/* ---------- access ---------- */

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await actorRole(context as Ctx);
    return { role, userId: context.userId };
  });

/* ---------- overview ---------- */

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRole(context as Ctx, "support");
    const db = await admin();
    const [total, roles, banned, suspended, recent, actions, week] = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("user_roles").select("role"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("status", "banned"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("status", "suspended"),
      db.from("profiles").select("id, username, created_at").order("created_at", { ascending: false }).limit(6),
      db.from("audit_log").select("*").order("created_at", { ascending: false }).limit(8),
      db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString()),
    ]);
    const roleCounts: Record<string, number> = {};
    for (const r of roles.data ?? []) roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
    const names = await usernames(db, (actions.data ?? []).flatMap((a: any) => [a.actor_id, a.target_id]));
    return {
      total: total.count ?? 0,
      admins: (roleCounts.admin ?? 0) + (roleCounts.owner ?? 0),
      moderators: roleCounts.moderator ?? 0,
      banned: banned.count ?? 0,
      suspended: suspended.count ?? 0,
      newThisWeek: week.count ?? 0,
      recent: recent.data ?? [],
      actions: (actions.data ?? []).map((a: any) => ({ ...a, actor: names[a.actor_id], target: names[a.target_id] })),
    };
  });

/* ---------- users ---------- */

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      q: z.string().max(64).default(""),
      page: z.number().int().min(0).max(10000).default(0),
      status: z.enum(["all", "active", "suspended", "banned"]).default("all"),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const me = await requireRole(context as Ctx, "support");
    const db = await admin();
    const size = 20;
    let q = db
      .from("profiles")
      .select("id, username, display_name, status, status_until, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(data.page * size, data.page * size + size - 1);
    const term = data.q.trim();
    if (term) {
      if (uuid.safeParse(term).success) q = q.eq("id", term);
      else q = q.ilike("username", `%${term.replace(/[%_\\]/g, (c) => "\\" + c)}%`);
    }
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r: any) => r.id);
    const { data: roles } = ids.length ? await db.from("user_roles").select("user_id, role").in("user_id", ids) : { data: [] };
    const roleMap = Object.fromEntries((roles ?? []).map((r: any) => [r.user_id, r.role]));
    const showEmail = atLeast(me, "admin");
    const users = await Promise.all(
      (rows ?? []).map(async (r: any) => {
        let email: string | null = null;
        let last_sign_in_at: string | null = null;
        if (showEmail) {
          const { data: u } = await db.auth.admin.getUserById(r.id);
          email = u.user?.email ?? null;
          last_sign_in_at = u.user?.last_sign_in_at ?? null;
        }
        return { ...r, status: effectiveStatus(r), role: (roleMap[r.id] ?? "user") as AppRole, email, last_sign_in_at };
      }),
    );
    return { users, total: count ?? 0, pageSize: size, canSeeEmail: showEmail };
  });

export const getUserDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: uuid }).parse(i))
  .handler(async ({ data, context }) => {
    const me = await requireRole(context as Ctx, "support");
    const db = await admin();
    const { data: p } = await db.from("profiles").select("*").eq("id", data.id).maybeSingle();
    if (!p) throw new Error("Account not found");
    const role = await targetRole(db, data.id);
    let email: string | null = null;
    let last_sign_in_at: string | null = null;
    if (atLeast(me, "admin")) {
      const { data: u } = await db.auth.admin.getUserById(data.id);
      email = u.user?.email ?? null;
      last_sign_in_at = u.user?.last_sign_in_at ?? null;
    }
    const [notes, history, events] = await Promise.all([
      atLeast(me, "moderator")
        ? db.from("moderation_notes").select("*").eq("user_id", data.id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      db.from("role_history").select("*").eq("user_id", data.id).order("created_at", { ascending: false }),
      db.from("audit_log").select("*").eq("target_id", data.id).order("created_at", { ascending: false }).limit(30),
    ]);
    const names = await usernames(db, [
      ...(notes.data ?? []).map((n: any) => n.author_id),
      ...(history.data ?? []).map((h: any) => h.actor_id),
      ...(events.data ?? []).map((e: any) => e.actor_id),
    ]);
    return {
      profile: { ...p, status: effectiveStatus(p) },
      role,
      email,
      last_sign_in_at,
      myRole: me,
      isSelf: data.id === context.userId,
      notes: (notes.data ?? []).map((n: any) => ({ ...n, author: names[n.author_id] })),
      history: (history.data ?? []).map((h: any) => ({ ...h, actor: names[h.actor_id] })),
      events: (events.data ?? []).map((e: any) => ({ ...e, actor: names[e.actor_id] })),
    };
  });

export const findAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ query: z.string().trim().min(1).max(64) }).parse(i))
  .handler(async ({ data, context }) => {
    await requireRole(context as Ctx, "admin");
    const db = await admin();
    const q = db.from("profiles").select("id, username, created_at, status, status_until");
    const { data: rows } = uuid.safeParse(data.query).success
      ? await q.eq("id", data.query)
      : await q.ilike("username", data.query.replace(/[%_\\]/g, (c) => "\\" + c));
    const out = await Promise.all(
      (rows ?? []).map(async (r: any) => ({ ...r, status: effectiveStatus(r), role: await targetRole(db, r.id) })),
    );
    return { matches: out };
  });

/* ---------- roles ---------- */

export const setRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: uuid, role: roleEnum, confirm: z.literal(true) }).parse(i))
  .handler(async ({ data, context }) => {
    const me = await requireRole(context as Ctx, "admin");
    const db = await admin();
    await rateLimit(db, context.userId);
    const { data: exists } = await db.from("profiles").select("id").eq("id", data.userId).maybeSingle();
    if (!exists) throw new Error("Account not found");
    const current = await targetRole(db, data.userId);
    const problem = canAssignRole(me, current, data.role, data.userId === context.userId);
    if (problem) throw new Error(problem);
    if (current === data.role) return { ok: true, unchanged: true };
    const { error } = await db.from("user_roles").upsert({ user_id: data.userId, role: data.role, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    await db.from("role_history").insert({ user_id: data.userId, actor_id: context.userId, previous_role: current, new_role: data.role });
    await audit(db, context.userId, data.role === "user" ? "role.revoked" : "role.granted", data.userId, { from: current, to: data.role });
    return { ok: true };
  });

export const transferOwnership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: uuid, confirmUsername: z.string().min(1) }).parse(i))
  .handler(async ({ data, context }) => {
    await requireRole(context as Ctx, "owner");
    if (data.userId === context.userId) throw new Error("You already own SEEKER.");
    const db = await admin();
    await rateLimit(db, context.userId);
    const { data: p } = await db.from("profiles").select("username, status").eq("id", data.userId).maybeSingle();
    if (!p) throw new Error("Account not found");
    if (p.username.toLowerCase() !== data.confirmUsername.trim().toLowerCase()) throw new Error("Confirmation username does not match.");
    if (p.status === "banned") throw new Error("Cannot transfer ownership to a banned account.");
    const prev = await targetRole(db, data.userId);
    await db.from("user_roles").upsert({ user_id: data.userId, role: "owner", updated_at: new Date().toISOString() });
    await db.from("user_roles").upsert({ user_id: context.userId, role: "admin", updated_at: new Date().toISOString() });
    await db.from("role_history").insert([
      { user_id: data.userId, actor_id: context.userId, previous_role: prev, new_role: "owner" },
      { user_id: context.userId, actor_id: context.userId, previous_role: "owner", new_role: "admin" },
    ]);
    await audit(db, context.userId, "ownership.transferred", data.userId, { from: context.userId });
    return { ok: true };
  });

/* ---------- moderation ---------- */

export const moderateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      userId: uuid,
      action: z.enum(["suspend", "ban", "restore"]),
      reason: z.string().trim().max(500).default(""),
      until: z.string().datetime().nullable().default(null),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const me = await requireRole(context as Ctx, "moderator");
    if (data.userId === context.userId) throw new Error("You cannot moderate your own account.");
    const db = await admin();
    await rateLimit(db, context.userId);
    const tr = await targetRole(db, data.userId);
    if (ROLE_RANK[tr] >= ROLE_RANK[me]) throw new Error("You cannot moderate an account at or above your level.");
    if (data.action !== "restore" && !data.reason) throw new Error("A reason is required.");
    let ban_duration = "none";
    let status: "active" | "suspended" | "banned" = "active";
    let until: string | null = null;
    if (data.action === "ban") {
      ban_duration = "876000h";
      status = "banned";
    } else if (data.action === "suspend") {
      if (!data.until) throw new Error("Suspensions need an end date.");
      const hours = Math.ceil((new Date(data.until).getTime() - Date.now()) / 36e5);
      if (hours < 1) throw new Error("End date must be in the future.");
      ban_duration = `${hours}h`;
      status = "suspended";
      until = data.until;
    }
    const { error: authErr } = await db.auth.admin.updateUserById(data.userId, { ban_duration } as any);
    if (authErr) throw new Error(authErr.message);
    await db
      .from("profiles")
      .update({ status, status_reason: data.action === "restore" ? null : data.reason, status_until: until, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    await audit(db, context.userId, `moderation.${data.action}`, data.userId, { reason: data.reason, until });
    return { ok: true };
  });

export const addModerationNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: uuid, note: z.string().trim().min(1).max(2000) }).parse(i))
  .handler(async ({ data, context }) => {
    await requireRole(context as Ctx, "moderator");
    const db = await admin();
    await rateLimit(db, context.userId);
    await db.from("moderation_notes").insert({ user_id: data.userId, author_id: context.userId, note: data.note });
    await audit(db, context.userId, "moderation.note", data.userId, {});
    return { ok: true };
  });

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      userId: uuid,
      username: z.string().regex(/^[A-Za-z0-9_.]{3,24}$/),
      display_name: z.string().trim().max(48),
      bio: z.string().max(500),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const me = await requireRole(context as Ctx, "admin");
    const db = await admin();
    await rateLimit(db, context.userId);
    const tr = await targetRole(db, data.userId);
    if (data.userId !== context.userId && ROLE_RANK[tr] >= ROLE_RANK[me]) throw new Error("You cannot edit an account at or above your level.");
    const { data: clash } = await db.from("profiles").select("id").ilike("username", data.username).neq("id", data.userId).maybeSingle();
    if (clash) throw new Error("Username is taken.");
    const { error } = await db
      .from("profiles")
      .update({ username: data.username, display_name: data.display_name, bio: data.bio, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await audit(db, context.userId, "profile.edited", data.userId, { username: data.username });
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: uuid, confirmUsername: z.string().min(1) }).parse(i))
  .handler(async ({ data, context }) => {
    const me = await requireRole(context as Ctx, "admin");
    if (data.userId === context.userId) throw new Error("You cannot delete your own account here.");
    const db = await admin();
    await rateLimit(db, context.userId);
    const tr = await targetRole(db, data.userId);
    if (tr === "owner") throw new Error("The Owner account is protected.");
    if (ROLE_RANK[tr] >= ROLE_RANK[me]) throw new Error("You cannot delete an account at or above your level.");
    const { data: p } = await db.from("profiles").select("username").eq("id", data.userId).maybeSingle();
    if (!p) throw new Error("Account not found");
    if (p.username.toLowerCase() !== data.confirmUsername.trim().toLowerCase()) throw new Error("Confirmation username does not match.");
    const { error } = await db.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await audit(db, context.userId, "account.deleted", data.userId, { username: p.username });
    return { ok: true };
  });

/* ---------- audit + reports ---------- */

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ page: z.number().int().min(0).default(0), prefix: z.string().max(32).default(""), moderationOnly: z.boolean().default(false) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireRole(context as Ctx, "support");
    const db = await admin();
    const size = 25;
    let q = db.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(data.page * size, data.page * size + size - 1);
    if (data.moderationOnly) q = q.like("action", "moderation.%");
    else if (data.prefix) q = q.like("action", `${data.prefix}%`);
    const { data: rows, count } = await q;
    const names = await usernames(db, (rows ?? []).flatMap((r: any) => [r.actor_id, r.target_id]));
    return {
      rows: (rows ?? []).map((r: any) => ({ ...r, actor: names[r.actor_id], target: names[r.target_id] })),
      total: count ?? 0,
      pageSize: size,
    };
  });

export const adminReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRole(context as Ctx, "support");
    const db = await admin();
    const since = new Date(Date.now() - 30 * 864e5);
    const [profiles, roles, actions] = await Promise.all([
      db.from("profiles").select("created_at, status, visibility").gte("created_at", since.toISOString()),
      db.from("user_roles").select("role"),
      db.from("audit_log").select("action").gte("created_at", since.toISOString()),
    ]);
    const days: { day: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) days.push({ day: new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), count: 0 });
    for (const p of profiles.data ?? []) {
      const d = days.find((x) => x.day === p.created_at.slice(0, 10));
      if (d) d.count++;
    }
    const tally = (arr: any[], k: string) => {
      const o: Record<string, number> = {};
      for (const r of arr) o[r[k]] = (o[r[k]] ?? 0) + 1;
      return o;
    };
    const { data: allStatus } = await db.from("profiles").select("status, visibility");
    return {
      signups: days,
      roles: tally(roles.data ?? [], "role"),
      statuses: tally(allStatus ?? [], "status"),
      visibility: tally(allStatus ?? [], "visibility"),
      actions: tally(actions.data ?? [], "action"),
    };
  });

/* ---------- settings ---------- */

export const updatePlatformSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      site_name: z.string().trim().min(1).max(40),
      registration_open: z.boolean(),
      maintenance_mode: z.boolean(),
      announcement: z.string().max(500),
      default_role: z.enum(["user", "support"]),
      default_profile_visibility: z.enum(["public", "private"]),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await requireRole(context as Ctx, "admin");
    const db = await admin();
    await rateLimit(db, context.userId);
    const { error } = await db
      .from("platform_settings")
      .update({ ...data, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    await audit(db, context.userId, "settings.updated", null, data);
    return { ok: true };
  });
