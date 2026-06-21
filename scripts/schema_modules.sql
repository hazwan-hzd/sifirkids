-- ===================================================================
-- Generic subject-quiz schema (Sains + the other six KSSR/KSSM subjects)
-- Run once in the Supabase SQL editor before seeding with seed_modules.mjs.
--
-- All subjects share these three tables, keyed by (module, grade):
--   module        e.g. 'sains', 'matematik', 'english', ...
--   grade         'std1' | 'std4' | 'form3'
-- A child only ever sees rows tagged for their own grade (see CHILD_GRADE).
-- ===================================================================

create extension if not exists "pgcrypto";

create table if not exists module_questions (
  id            uuid primary key default gen_random_uuid(),
  module        text not null,
  grade         text not null check (grade in ('std1', 'std4', 'form3')),
  chapter       int  not null,
  chapter_title text not null,
  question_text text not null,
  question_type text not null check (question_type in ('mcq', 'true_false', 'fill_blank')),
  options       jsonb,
  correct_answer text not null,
  explanation   text,
  difficulty    text not null default 'standard' check (difficulty in ('easy', 'standard', 'kbat')),
  created_at    timestamptz not null default now()
);

create index if not exists module_questions_lookup
  on module_questions (module, grade, chapter);

create table if not exists module_results (
  id              uuid primary key default gen_random_uuid(),
  child_id        text not null,
  module          text not null,
  grade           text not null,
  chapter         int  not null,
  total_questions int  not null,
  correct_answers int  not null,
  duration_sec    int,
  points_earned   int,
  created_at      timestamptz not null default now()
);

create index if not exists module_results_lookup
  on module_results (child_id, module, grade);

create table if not exists module_answer_log (
  id               uuid primary key default gen_random_uuid(),
  result_id        uuid not null references module_results (id) on delete cascade,
  question_id      uuid,
  given_answer     text,
  is_correct       boolean not null,
  response_time_ms int,
  created_at       timestamptz not null default now()
);

create index if not exists module_answer_log_result
  on module_answer_log (result_id);

-- Row Level Security: this app uses the anon key client-side, mirroring the
-- existing sejarah/peribahasa tables. Enable RLS and allow read + insert.
alter table module_questions  enable row level security;
alter table module_results    enable row level security;
alter table module_answer_log enable row level security;

create policy "module_questions read"   on module_questions  for select using (true);
create policy "module_results read"      on module_results    for select using (true);
create policy "module_results insert"    on module_results    for insert with check (true);
create policy "module_answer_log read"   on module_answer_log for select using (true);
create policy "module_answer_log insert" on module_answer_log for insert with check (true);
