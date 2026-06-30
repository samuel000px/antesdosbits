create table if not exists public.card_ml_samples (
    id text primary key,
    label text not null,
    pattern jsonb not null default '[]'::jsonb,
    features jsonb not null default '[]'::jsonb,
    feature_mode text not null default 'mask-v2',
    image_bytes text not null,
    size integer not null default 64,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.card_ml_samples
add column if not exists feature_mode text not null default 'mask-v2';

alter table public.card_ml_samples enable row level security;

drop policy if exists "card ml public read" on public.card_ml_samples;
drop policy if exists "card ml public insert" on public.card_ml_samples;
drop policy if exists "card ml public update" on public.card_ml_samples;
drop policy if exists "card ml public delete" on public.card_ml_samples;

create policy "card ml public read"
on public.card_ml_samples
for select
to anon, authenticated
using (true);

create policy "card ml public insert"
on public.card_ml_samples
for insert
to anon, authenticated
with check (true);

create policy "card ml public update"
on public.card_ml_samples
for update
to anon, authenticated
using (true)
with check (true);

create policy "card ml public delete"
on public.card_ml_samples
for delete
to anon, authenticated
using (true);
