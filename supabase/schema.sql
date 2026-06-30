-- EcoPulse — schéma Supabase pour la persistance des journées simulées.
-- Pas d'auth : l'appartenance d'une ligne est portée par anon_id, un UUID v4
-- généré côté serveur et stocké dans le cookie ecopulse_anon_id (1 an,
-- SameSite=Lax). Aucune donnée personnelle.

create extension if not exists pgcrypto;

create table if not exists saved_days (
  id uuid primary key default gen_random_uuid(),
  anon_id uuid not null,
  saved_at timestamptz not null default now(),
  intensity_at_save integer not null check (intensity_at_save >= 0),
  total_gco2eq numeric not null check (total_gco2eq >= 0),
  devices jsonb not null default '[]'::jsonb
);

create index if not exists saved_days_anon_id_idx on saved_days (anon_id);

alter table saved_days enable row level security;

-- IMPORTANT : SupabaseAdapter (src/lib/storage/supabaseAdapter.ts) se
-- connecte avec la clé service_role, qui a l'attribut Postgres BYPASSRLS —
-- les policies ci-dessous ne s'appliquent donc PAS à elle. L'isolation par
-- anon_id pour service_role est assurée explicitement dans le code de
-- l'adapter (chaque requête filtre sur anon_id). Ces policies sont une
-- défense en profondeur pour un usage futur/accidentel de la clé "anon"
-- publique (jamais utilisée par EcoPulse aujourd'hui : le front ne parle
-- qu'aux routes API, jamais directement à Supabase).
--
-- Mécanisme : chaque fonction RPC ci-dessous positionne app.anon_id via
-- set_config(..., true) PUIS exécute la requête, dans LA MÊME transaction.
-- set_config avec is_local=true ne survit pas entre deux appels HTTP
-- PostgREST séparés (connexions/transactions distinctes) : il doit donc être
-- positionné et consommé à l'intérieur d'un seul appel RPC.

create policy saved_days_select_own
  on saved_days for select
  using (anon_id = current_setting('app.anon_id', true)::uuid);

create policy saved_days_insert_own
  on saved_days for insert
  with check (anon_id = current_setting('app.anon_id', true)::uuid);

create policy saved_days_delete_own
  on saved_days for delete
  using (anon_id = current_setting('app.anon_id', true)::uuid);

create or replace function list_saved_days(p_anon_id uuid)
returns setof saved_days
language plpgsql
security invoker
as $$
begin
  perform set_config('app.anon_id', p_anon_id::text, true);
  return query
    select * from saved_days
    where anon_id = p_anon_id
    order by saved_at desc;
end;
$$;

create or replace function insert_saved_day(
  p_anon_id uuid,
  p_intensity_at_save integer,
  p_total_gco2eq numeric,
  p_devices jsonb
)
returns setof saved_days
language plpgsql
security invoker
as $$
begin
  perform set_config('app.anon_id', p_anon_id::text, true);
  return query
    insert into saved_days (anon_id, intensity_at_save, total_gco2eq, devices)
    values (p_anon_id, p_intensity_at_save, p_total_gco2eq, p_devices)
    returning *;
end;
$$;

create or replace function delete_saved_day(p_anon_id uuid, p_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  perform set_config('app.anon_id', p_anon_id::text, true);
  delete from saved_days where id = p_id and anon_id = p_anon_id;
end;
$$;
