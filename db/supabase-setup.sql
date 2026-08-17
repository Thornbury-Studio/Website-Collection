-- Website Collection — password gate schema.
-- Run this once, in full, in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
--
-- Security model: every table below has RLS enabled with ZERO policies.
-- In Postgres/Supabase, RLS-enabled + no policies = deny by default to the
-- `anon` and `authenticated` roles (the ones the public anon key maps to).
-- Only the `service_role` key bypasses RLS entirely, and that key lives
-- ONLY in Vercel's server-side environment variables — never in this repo,
-- never shipped to the browser. So even if someone finds the anon key, they
-- can select nothing from these tables.

-- The admin password. Opens /portfolio and the Admin panel (Testing, Change
-- Password), and also opens every Client Preview slug (an admin can see
-- everything a client credential can).
create table if not exists site_auth (
  id int primary key default 1,
  hash text not null,
  salt text not null,
  updated_at timestamptz not null default now(),
  constraint site_auth_single_row check (id = 1)
);

-- The shared Client Preview password — deliberately a separate credential
-- from site_auth, even though both are set to the same value for now. This
-- is the password an agent types in while physically walking a client
-- through the Client Preview gallery; it opens every staged build but never
-- /portfolio or the Admin panel. Per-client signed links (api/preview/
-- redeem.js) are the mechanism for handing a client their own scoped link
-- without sharing this password at all.
create table if not exists client_auth (
  id int primary key default 1,
  hash text not null,
  salt text not null,
  updated_at timestamptz not null default now(),
  constraint client_auth_single_row check (id = 1)
);

create table if not exists login_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create table if not exists test_clients (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text,
  notes text
);

create table if not exists test_backend_info (
  id bigint generated always as identity primary key,
  service_name text not null,
  internal_note text
);

alter table site_auth enable row level security;
alter table client_auth enable row level security;
alter table login_attempts enable row level security;
alter table test_clients enable row level security;
alter table test_backend_info enable row level security;

-- Helpful for the rate limiter's "attempts in the last N minutes" query.
create index if not exists login_attempts_ip_time
  on login_attempts (ip_hash, attempted_at);

-- Seed the initial password. Generate YOUR OWN hash/salt locally first —
-- never paste a real password or hash into a file that goes anywhere near
-- git — with:
--
--   node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log('salt:',s);console.log('hash:',c.scryptSync(process.argv[1],s,64).toString('hex'))" "your-chosen-password"
--
-- then paste the printed salt/hash below and run this INSERT once. Change
-- the password afterwards from Settings > Admin > Change Password — that
-- flow generates and stores its own hash, so this initial one only matters
-- for the very first login.
-- IMPORTANT: paste in this exact order — hash first, salt second. The node
-- command above prints "salt:" before "hash:", which is the opposite order;
-- copying its output top-to-bottom into these two columns swaps them and
-- silently locks out every password forever (hash and salt end up the wrong
-- byte lengths — 16 bytes where 64 is expected and vice versa — so the
-- length check in verifyPassword() fails before it even compares anything).
insert into site_auth (id, hash, salt)
values (
  1,
  '<paste the printed "hash:" value here — 128 hex chars>',
  '<paste the printed "salt:" value here — 32 hex chars>'
)
on conflict (id) do nothing;

-- Client Preview starts out on the same password as Admin — copied straight
-- from site_auth rather than pasted separately, so there's no second hash to
-- get wrong. They're still two independent rows from this point on: change
-- one from Settings > Admin > Client Access and the other is untouched.
insert into client_auth (id, hash, salt)
select 1, hash, salt from site_auth where id = 1
on conflict (id) do nothing;

-- Obviously-fake seed data for the Testing tab (Settings > Admin > Testing).
-- Nothing here is a real client — every row says so.
insert into test_clients (name, email, phone, notes) values
  ('TEST RECORD — Jane Doe', 'jane@example-test.invalid', '+65 0000 0000', 'Simulated record for security testing only. Not a real client.'),
  ('TEST RECORD — Acme Pte Ltd', 'contact@acme-test.invalid', '+65 0000 0001', 'Simulated record for security testing only. Not a real client.')
on conflict do nothing;

insert into test_backend_info (service_name, internal_note) values
  ('TEST — internal-billing-service', 'Simulated backend descriptor for security testing only. Not a real system.'),
  ('TEST — client-file-storage', 'Simulated backend descriptor for security testing only. Not a real system.')
on conflict do nothing;
