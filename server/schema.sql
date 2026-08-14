-- Waitlist schema — Bravo 3.0 pre-launch signups.
--
-- Idempotent: safe to run repeatedly (that is how `npm run db:migrate` applies
-- it), so the production table is created from this file rather than by hand in
-- the Neon dashboard.
--
-- Deliberately minimal. An email address and when it arrived is the whole
-- purpose; no name, phone, IP, location, user-agent or tracking data is
-- collected, so there is nothing here to leak or to have to explain later.

create table if not exists waitlist_signups (
  -- identity rather than serial: the modern SQL-standard form, and it stops the
  -- value being overwritten by an explicit insert.
  id          bigint generated always as identity primary key,

  -- Addresses are normalised (trimmed + lower-cased) by the API before they get
  -- here, so a plain unique constraint is enough to make duplicates impossible
  -- without needing the citext extension.
  --
  -- 254 is the maximum length of a deliverable address (RFC 5321). The API
  -- rejects longer input first; this is the backstop if anything ever writes to
  -- the table by another route.
  email       text        not null unique
                          constraint waitlist_signups_email_len
                          check (char_length(email) between 3 and 254),

  -- Server-side clock. Never supplied by the client.
  created_at  timestamptz not null default now(),

  -- Which surface the signup came from, so a future second entry point (an app
  -- banner, a campaign page) stays distinguishable without a schema change.
  source      text        not null default 'bravoapp.ai'
);

-- The unique constraint above already creates the index used for lookups and
-- for ON CONFLICT, so no additional index is needed.

-- Show timestamps in Vancouver time.
--
-- This changes DISPLAY only, which is the point. created_at is timestamptz, so
-- Postgres stores an absolute instant and renders it in the session's zone —
-- setting that zone here means the Neon console, psql and any client all show
-- local Vancouver time without altering a single stored value.
--
-- Storing a naive local time instead would be the wrong trade: it loses the
-- offset, and the hour that repeats when DST ends each November becomes
-- genuinely ambiguous. 'America/Vancouver' (not a fixed -08:00) also means
-- PST/PDT is handled for us.
--
-- `format(%I)` quotes the database name safely; ALTER DATABASE cannot take a
-- bind parameter. Applies to connections opened after this runs.
do $$
begin
  execute format('alter database %I set timezone = %L', current_database(), 'America/Vancouver');
end
$$;
