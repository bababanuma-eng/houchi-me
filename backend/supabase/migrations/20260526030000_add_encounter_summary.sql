alter table public.encounter_logs
  add column if not exists summary jsonb;
