-- טבלת נתוני עולם המבחן (פסיכוטכני) — מסמך אחד לכל משתמש.
-- להריץ פעם אחת: Supabase → SQL Editor → New query → Run.

create table if not exists public.exam_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.exam_state enable row level security;

drop policy if exists "exam_state own rows" on public.exam_state;
create policy "exam_state own rows" on public.exam_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- עדכונים בזמן אמת בין הטלפון למחשב
do $$ begin
  alter publication supabase_realtime add table public.exam_state;
exception when duplicate_object then null; end $$;
