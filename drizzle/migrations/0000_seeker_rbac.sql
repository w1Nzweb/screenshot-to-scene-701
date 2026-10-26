create type public.app_role as enum ('owner','admin','moderator','support','user');
create type public.account_status as enum ('active','suspended','banned');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_.]{3,24}$'),
  display_name text,
  bio text not null default '',
  visibility text not null default 'public' check (visibility in ('public','private')),
  status public.account_status not null default 'active',
  status_reason text,
  status_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles (lower(username));
grant select on public.profiles to authenticated;
grant update (username, display_name, bio, visibility, updated_at) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  updated_at timestamptz not null default now()
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create table public.role_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid,
  previous_role public.app_role,
  new_role public.app_role not null,
  created_at timestamptz not null default now()
);
grant select on public.role_history to authenticated;
grant all on public.role_history to service_role;
alter table public.role_history enable row level security;

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created on public.audit_log (created_at desc);
create index audit_log_actor on public.audit_log (actor_id, created_at desc);
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;
alter table public.audit_log enable row level security;

create table public.moderation_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  author_id uuid,
  note text not null,
  created_at timestamptz not null default now()
);
grant select on public.moderation_notes to authenticated;
grant all on public.moderation_notes to service_role;
alter table public.moderation_notes enable row level security;

create table public.platform_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'SEEKER',
  registration_open boolean not null default true,
  maintenance_mode boolean not null default false,
  announcement text not null default '',
  default_role public.app_role not null default 'user' check (default_role in ('user','support')),
  default_profile_visibility text not null default 'public' check (default_profile_visibility in ('public','private')),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
grant select on public.platform_settings to anon, authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
insert into public.platform_settings (id) values (1);

create or replace function public.role_rank(_role public.app_role) returns int
language sql immutable set search_path = public as $$
  select case _role when 'owner' then 5 when 'admin' then 4 when 'moderator' then 3 when 'support' then 2 else 1 end
$$;

create or replace function public.get_user_role(_user_id uuid) returns public.app_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.user_roles where user_id = _user_id), 'user'::public.app_role)
$$;

create or replace function public.has_min_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select public.role_rank(public.get_user_role(_user_id)) >= public.role_rank(_role)
$$;

create or replace function public.username_available(_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(_name))
$$;
grant execute on function public.username_available(text) to anon, authenticated;

create policy "own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "public profiles" on public.profiles for select to authenticated using (visibility = 'public');
create policy "staff read profiles" on public.profiles for select to authenticated using (public.has_min_role(auth.uid(), 'support'));
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "own role" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "staff read roles" on public.user_roles for select to authenticated using (public.has_min_role(auth.uid(), 'support'));
create policy "admins read role history" on public.role_history for select to authenticated using (public.has_min_role(auth.uid(), 'admin'));
create policy "staff read audit" on public.audit_log for select to authenticated using (public.has_min_role(auth.uid(), 'support'));
create policy "mods read notes" on public.moderation_notes for select to authenticated using (public.has_min_role(auth.uid(), 'moderator'));
create policy "everyone reads settings" on public.platform_settings for select to anon, authenticated using (true);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s public.platform_settings;
  uname text;
  r public.app_role;
begin
  select * into s from public.platform_settings where id = 1;
  if s.registration_open = false then
    raise exception 'Registration is currently closed';
  end if;
  uname := coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'user_' || substr(replace(new.id::text, '-', ''), 1, 8));
  if not (uname ~ '^[A-Za-z0-9_.]{3,24}$') or exists (select 1 from public.profiles where lower(username) = lower(uname)) then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  insert into public.profiles (id, username, display_name, visibility)
    values (new.id, uname, uname, s.default_profile_visibility);
  if not exists (select 1 from public.user_roles where role = 'owner') then
    r := 'owner';
  else
    r := s.default_role;
  end if;
  insert into public.user_roles (user_id, role) values (new.id, r);
  insert into public.role_history (user_id, actor_id, previous_role, new_role) values (new.id, null, null, r);
  insert into public.audit_log (actor_id, action, target_id, details) values (new.id, 'account.registered', new.id, jsonb_build_object('role', r));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();