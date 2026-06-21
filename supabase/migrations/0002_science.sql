-- ============================================================
-- Sains module schema (mirrors sejarah_*), with a `level` axis
-- so questions are served per child:
--   ilyas  -> 't1'  (KSSR Sains Tahun 1)
--   hafeeza-> 't4'  (KSSR Sains Tahun 4)
--   dhiya  -> 'f3'  (KSSM Sains Tingkatan 3 / PT3)
-- ============================================================

create type science_level as enum ('t1', 't4', 'f3');
create type science_qtype as enum ('mcq', 'true_false', 'fill_blank');
create type science_difficulty as enum ('easy', 'standard', 'kbat');

create table science_questions (
  id              uuid primary key default gen_random_uuid(),
  level           science_level not null,
  chapter         int not null,
  chapter_title   text not null,
  question_text   text not null,
  question_type   science_qtype not null default 'mcq',
  options         text[],
  correct_answer  text not null,
  explanation     text,
  image_url       text,
  difficulty      science_difficulty not null default 'standard',
  tags            text[],
  created_at      timestamptz not null default now()
);
create index science_questions_level_chapter_idx
  on science_questions (level, chapter);

create table science_quiz_results (
  id                uuid primary key default gen_random_uuid(),
  child_id          text not null,
  level             science_level not null,
  chapter           int not null,
  total_questions   int not null,
  correct_answers   int not null,
  duration_sec      int,
  points_earned     int,
  term_gaps_logged  int not null default 0,
  created_at        timestamptz not null default now()
);
create index science_quiz_results_child_idx
  on science_quiz_results (child_id, created_at desc);

create table science_answer_log (
  id               uuid primary key default gen_random_uuid(),
  result_id        uuid not null references science_quiz_results(id) on delete cascade,
  question_id      uuid not null references science_questions(id),
  given_answer     text not null,
  is_correct       boolean not null,
  response_time_ms int,
  created_at       timestamptz not null default now()
);

create table science_term_gaps (
  id           uuid primary key default gen_random_uuid(),
  child_id     text not null,
  question_id  uuid references science_questions(id),
  term         text not null,
  chapter      int,
  context      text,
  reviewed     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- SEED — sample questions per level (demonstrates age-tiering).
-- Expand each level to ~30-40 questions per chapter for real use.
-- ============================================================

-- ---------- TAHUN 1 (Ilyas) : concrete, single-step ----------
insert into science_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty) values
('t1', 1, 'Deria Kita', 'Berapakah jumlah deria yang ada pada manusia?', 'mcq', array['3','4','5','6'], '5', 'Lima deria: lihat, dengar, hidu, rasa, sentuh.', 'easy'),
('t1', 1, 'Deria Kita', 'Kita menggunakan ____ untuk mendengar.', 'fill_blank', null, 'telinga', 'Telinga ialah organ deria pendengaran.', 'easy'),
('t1', 2, 'Benda Hidup dan Benda Bukan Hidup', 'Pokok bunga ialah benda hidup.', 'true_false', null, 'true', 'Pokok membesar, bernafas dan memerlukan air - ia benda hidup.', 'easy'),
('t1', 2, 'Benda Hidup dan Benda Bukan Hidup', 'Antara berikut, yang manakah benda bukan hidup?', 'mcq', array['Kucing','Batu','Ikan','Pokok'], 'Batu', 'Batu tidak membesar, makan atau bernafas.', 'standard');

-- ---------- TAHUN 4 (Hafeeza) : process + classification ----------
insert into science_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty) values
('t4', 1, 'Proses Hidup Tumbuhan', 'Apakah proses tumbuhan menghasilkan makanan sendiri?', 'mcq', array['Respirasi','Fotosintesis','Perkumuhan','Pendebungaan'], 'Fotosintesis', 'Fotosintesis berlaku pada daun menggunakan cahaya matahari, air dan karbon dioksida.', 'standard'),
('t4', 1, 'Proses Hidup Tumbuhan', 'Gas yang dibebaskan oleh tumbuhan semasa fotosintesis ialah ____.', 'fill_blank', null, 'oksigen', 'Tumbuhan menyerap karbon dioksida dan membebaskan oksigen.', 'standard'),
('t4', 2, 'Keadaan Bahan', 'Air yang dipanaskan akan bertukar menjadi wap. Proses ini dipanggil pewapan.', 'true_false', null, 'true', 'Pemanasan menukar pepejal/cecair kepada gas - pewapan.', 'standard'),
('t4', 3, 'Magnet', 'Manakah bahan yang BUKAN ditarik oleh magnet?', 'mcq', array['Paku besi','Klip kertas','Getah','Skru keluli'], 'Getah', 'Hanya bahan logam ferromagnet (besi, keluli) ditarik magnet.', 'kbat');

-- ---------- TINGKATAN 3 / PT3 (Dhiya) : reasoning + symbols ----------
insert into science_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty) values
('f3', 1, 'Sistem Respirasi Manusia', 'Pertukaran gas dalam sistem respirasi berlaku di ____.', 'fill_blank', null, 'alveolus', 'Alveolus mempunyai dinding nipis dan banyak kapilari untuk resapan gas.', 'standard'),
('f3', 2, 'Keelektrikan', 'Apakah unit S.I. bagi arus elektrik?', 'mcq', array['Volt','Ampere','Ohm','Watt'], 'Ampere', 'Arus diukur dalam ampere (A); volt ialah unit beza keupayaan.', 'standard'),
('f3', 3, 'Tindak Balas Kimia', 'Persamaan perkataan bagi fotosintesis: karbon dioksida + air -> glukosa + ____.', 'fill_blank', null, 'oksigen', 'Tenaga cahaya diserap klorofil; hasil sampingan ialah oksigen.', 'standard'),
('f3', 4, 'Genetik', 'Seorang bapa bergolongan darah AB dan ibu bergolongan darah O. Antara berikut, golongan darah yang MUSTAHIL bagi anak mereka ialah?', 'mcq', array['A','B','AB','Semua mungkin'], 'AB', 'Anak mewarisi satu alel daripada setiap ibu bapa: A atau B (bapa) dengan O (ibu) -> A atau B sahaja, tidak mungkin AB atau O.', 'kbat');
