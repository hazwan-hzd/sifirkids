-- ============================================================
-- Bahasa Melayu module schema (mirrors science_*), with a
-- `level` axis so questions are served per child:
--   ilyas   -> 't1'  (KSSR Bahasa Melayu Tahun 1)
--   hafeeza -> 't4'  (KSSR Bahasa Melayu Tahun 4)
--   dhiya   -> 'f3'  (KSSM Bahasa Melayu Tingkatan 3 / PT3)
--
-- Uses `topic` instead of `chapter` to reflect BM subject
-- structure: tatabahasa, pemahaman, penulisan, komsas (f3).
-- ============================================================

create type bm_level as enum ('t1', 't4', 'f3');
create type bm_qtype as enum ('mcq', 'true_false', 'fill_blank');
create type bm_difficulty as enum ('easy', 'standard', 'kbat');

create table bm_questions (
  id              uuid primary key default gen_random_uuid(),
  level           bm_level not null,
  topic           int not null,
  topic_title     text not null,
  question_text   text not null,
  question_type   bm_qtype not null default 'mcq',
  options         text[],
  correct_answer  text not null,
  explanation     text,
  image_url       text,
  difficulty      bm_difficulty not null default 'standard',
  tags            text[],
  created_at      timestamptz not null default now()
);
create index bm_questions_level_topic_idx
  on bm_questions (level, topic);

create table bm_quiz_results (
  id                uuid primary key default gen_random_uuid(),
  child_id          text not null,
  level             bm_level not null,
  topic             int not null,
  total_questions   int not null,
  correct_answers   int not null,
  duration_sec      int,
  points_earned     int,
  vocab_gaps_logged int not null default 0,
  created_at        timestamptz not null default now()
);
create index bm_quiz_results_child_idx
  on bm_quiz_results (child_id, created_at desc);

create table bm_answer_log (
  id               uuid primary key default gen_random_uuid(),
  result_id        uuid not null references bm_quiz_results(id) on delete cascade,
  question_id      uuid not null references bm_questions(id),
  given_answer     text not null,
  is_correct       boolean not null,
  response_time_ms int,
  created_at       timestamptz not null default now()
);

create table bm_vocab_gaps (
  id           uuid primary key default gen_random_uuid(),
  child_id     text not null,
  question_id  uuid references bm_questions(id),
  word         text not null,
  topic        int,
  context      text,
  reviewed     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- SEED: sample questions per level (demonstrates age-tiering).
-- Expand each level to ~30-40 questions per topic for real use.
-- ============================================================

-- ==========================================================
-- TAHUN 1 (Ilyas): kata nama, kata kerja, suku kata
-- ==========================================================

-- Topic 1: Tatabahasa - Kata Nama
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('t1', 1, 'Tatabahasa - Kata Nama', 'Apakah kata nama bagi gambar "kucing"?', 'mcq', array['kucing','berlari','cantik','cepat'], 'kucing', 'Kucing ialah kata nama am kerana ia merujuk kepada haiwan.', 'easy', array['kata_nama','haiwan']),
('t1', 1, 'Tatabahasa - Kata Nama', '"Buku" ialah kata nama.', 'true_false', null, 'true', 'Buku ialah kata nama am kerana ia merujuk kepada benda.', 'easy', array['kata_nama','benda']),
('t1', 1, 'Tatabahasa - Kata Nama', 'Pilih kata nama khas daripada senarai berikut.', 'mcq', array['meja','Kuala Lumpur','cantik','makan'], 'Kuala Lumpur', 'Kuala Lumpur ialah kata nama khas kerana ia merujuk kepada tempat tertentu. Kata nama khas ditulis dengan huruf besar.', 'standard', array['kata_nama_khas','tempat']);

-- Topic 2: Tatabahasa - Kata Kerja
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('t1', 2, 'Tatabahasa - Kata Kerja', 'Ayah ____ surat khabar setiap pagi.', 'fill_blank', null, 'membaca', 'Membaca ialah kata kerja transitif kerana ia memerlukan objek (surat khabar).', 'easy', array['kata_kerja','imbuhan_me']),
('t1', 2, 'Tatabahasa - Kata Kerja', 'Perkataan "melompat" ialah kata kerja.', 'true_false', null, 'true', 'Melompat ialah kata kerja kerana ia menunjukkan perbuatan.', 'easy', array['kata_kerja']),
('t1', 2, 'Tatabahasa - Kata Kerja', 'Yang manakah kata kerja?', 'mcq', array['cantik','meja','menulis','merah'], 'menulis', 'Menulis ialah kata kerja kerana ia menunjukkan perbuatan. Cantik ialah kata adjektif, meja ialah kata nama, merah ialah kata adjektif.', 'easy', array['kata_kerja']);

-- Topic 3: Pemahaman - Suku Kata
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('t1', 3, 'Pemahaman - Suku Kata', 'Berapakah suku kata dalam perkataan "rumah"?', 'mcq', array['1','2','3','4'], '2', 'ru-mah mempunyai dua suku kata.', 'easy', array['suku_kata']),
('t1', 3, 'Pemahaman - Suku Kata', 'Perkataan "ibu" mempunyai ____ suku kata.', 'fill_blank', null, '2', 'i-bu mempunyai dua suku kata: i dan bu.', 'easy', array['suku_kata']);

-- ==========================================================
-- TAHUN 4 (Hafeeza): kata adjektif, imbuhan, ayat
-- ==========================================================

-- Topic 1: Tatabahasa - Kata Adjektif
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('t4', 1, 'Tatabahasa - Kata Adjektif', 'Pilih kata adjektif yang sesuai: Bangunan itu sangat ____.', 'mcq', array['tinggi','berlari','meja','mereka'], 'tinggi', 'Tinggi ialah kata adjektif kerana ia menerangkan sifat bangunan.', 'easy', array['kata_adjektif','sifat']),
('t4', 1, 'Tatabahasa - Kata Adjektif', 'Perkataan "rajin" ialah kata adjektif.', 'true_false', null, 'true', 'Rajin ialah kata adjektif kerana ia menerangkan sifat seseorang.', 'easy', array['kata_adjektif']),
('t4', 1, 'Tatabahasa - Kata Adjektif', 'Yang manakah BUKAN kata adjektif?', 'mcq', array['cantik','pandai','sekolah','bersih'], 'sekolah', 'Sekolah ialah kata nama, bukan kata adjektif. Cantik, pandai, dan bersih semuanya menerangkan sifat.', 'standard', array['kata_adjektif']);

-- Topic 2: Tatabahasa - Imbuhan
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('t4', 2, 'Tatabahasa - Imbuhan', 'Apakah kata dasar bagi perkataan "permainan"?', 'mcq', array['main','mainan','bermain','permain'], 'main', 'Kata dasar bagi "permainan" ialah "main". Imbuhan apitan per-...-an ditambah pada kata dasar.', 'standard', array['imbuhan','apitan']),
('t4', 2, 'Tatabahasa - Imbuhan', 'Imbuhan "ber-" dalam perkataan "berlari" ialah imbuhan ____.', 'fill_blank', null, 'awalan', 'Ber- ialah imbuhan awalan kerana ia ditambah di hadapan kata dasar "lari".', 'standard', array['imbuhan','awalan']);

-- Topic 3: Tatabahasa - Ayat Tunggal dan Majmuk
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('t4', 3, 'Tatabahasa - Ayat Tunggal dan Majmuk', '"Ali makan nasi dan minum air." ialah contoh ayat ____.', 'mcq', array['tunggal','majmuk gabungan','majmuk pancangan','majmuk campuran'], 'majmuk gabungan', 'Ayat ini menggabungkan dua klausa dengan kata hubung "dan", menjadikannya ayat majmuk gabungan.', 'standard', array['ayat_majmuk','kata_hubung']),
('t4', 3, 'Tatabahasa - Ayat Tunggal dan Majmuk', '"Siti membaca buku." ialah ayat tunggal.', 'true_false', null, 'true', 'Ayat ini hanya mempunyai satu subjek (Siti) dan satu predikat (membaca buku), menjadikannya ayat tunggal.', 'easy', array['ayat_tunggal']),
('t4', 3, 'Tatabahasa - Ayat Tunggal dan Majmuk', 'Pilih kata hubung yang betul: Ibu memasak ____ ayah membaca surat khabar.', 'mcq', array['tetapi','yang','untuk','sambil'], 'sambil', 'Sambil digunakan untuk menggabungkan dua perbuatan yang dilakukan pada masa yang sama.', 'kbat', array['kata_hubung','ayat_majmuk']);

-- ==========================================================
-- TINGKATAN 3 / PT3 (Dhiya): komsas, peribahasa konteks,
-- karangan, rumusan
-- ==========================================================

-- Topic 1: Tatabahasa - Ayat Aktif dan Pasif
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('f3', 1, 'Tatabahasa - Ayat Aktif dan Pasif', 'Tukarkan ayat aktif berikut kepada ayat pasif: "Aminah membasuh baju."', 'mcq', array['Baju dibasuh oleh Aminah.','Baju membasuh Aminah.','Aminah dibasuh baju.','Baju telah Aminah basuh.'], 'Baju dibasuh oleh Aminah.', 'Ayat pasif dibentuk dengan menjadikan objek sebagai subjek dan menambah kata "di-" serta "oleh".', 'standard', array['ayat_pasif','ayat_aktif']),
('f3', 1, 'Tatabahasa - Ayat Aktif dan Pasif', 'Ayat "Kuih itu dimakan oleh adik." ialah ayat pasif.', 'true_false', null, 'true', 'Ayat ini menggunakan kata kerja pasif "dimakan" dan frasa "oleh adik" yang menunjukkan pelaku.', 'easy', array['ayat_pasif']);

-- Topic 2: Komsas (Komponen Sastera)
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('f3', 2, 'Komsas - Komponen Sastera', 'Apakah maksud "watak antagonis" dalam sesebuah karya sastera?', 'mcq', array['Watak utama yang baik','Watak yang menentang watak utama','Watak sampingan','Watak yang tidak penting'], 'Watak yang menentang watak utama', 'Watak antagonis ialah watak yang menentang atau menjadi musuh kepada watak protagonis (utama) dalam karya sastera.', 'standard', array['komsas','watak']),
('f3', 2, 'Komsas - Komponen Sastera', 'Pantun terdiri daripada ____ baris dalam satu rangkap.', 'fill_blank', null, '4', 'Pantun Melayu tradisional mempunyai empat baris: dua baris pembayang dan dua baris maksud.', 'easy', array['komsas','pantun']),
('f3', 2, 'Komsas - Komponen Sastera', '"Latar" dalam karya sastera merujuk kepada tempat, masa, dan suasana sahaja.', 'true_false', null, 'true', 'Latar merangkumi tiga aspek: latar tempat (di mana), latar masa (bila), dan latar masyarakat/suasana.', 'standard', array['komsas','latar']);

-- Topic 3: Peribahasa dalam Konteks
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('f3', 3, 'Peribahasa dalam Konteks', 'Ali sering bergaduh dengan adiknya. Cikgu menasihatinya supaya bersabar kerana ____. Pilih peribahasa yang sesuai.', 'mcq', array['bersatu kita teguh, bercerai kita roboh','air yang tenang jangan disangka tiada buaya','ikut hati mati, ikut rasa binasa','harimau mati meninggalkan belang'], 'ikut hati mati, ikut rasa binasa', 'Peribahasa ini bermaksud jangan terlalu mengikut perasaan kerana ia boleh membawa keburukan.', 'kbat', array['peribahasa','konteks']),
('f3', 3, 'Peribahasa dalam Konteks', 'Peribahasa "seperti enau dalam belukar, melepaskan pucuk masing-masing" bermaksud sikap ____.', 'fill_blank', null, 'mementingkan diri sendiri', 'Peribahasa ini menggambarkan orang yang hanya mementingkan diri sendiri tanpa mempedulikan orang lain.', 'kbat', array['peribahasa','makna']);

-- Topic 4: Penulisan - Rumusan
insert into bm_questions (level, topic, topic_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) values
('f3', 4, 'Penulisan - Rumusan', 'Dalam penulisan rumusan, bahagian pertama hendaklah mengandungi ____.', 'mcq', array['Isi tersurat','Isi tersirat','Pendahuluan','Kesimpulan'], 'Pendahuluan', 'Format rumusan PT3: pendahuluan (ayat pengenalan topik), diikuti isi tersurat, isi tersirat, dan kesimpulan.', 'standard', array['rumusan','format']),
('f3', 4, 'Penulisan - Rumusan', 'Rumusan yang lengkap perlu mengandungi isi tersurat dan isi tersirat.', 'true_false', null, 'true', 'Rumusan PT3 yang lengkap mesti mengandungi kedua-dua isi tersurat (dari petikan) dan isi tersirat (inferens/tambahan).', 'easy', array['rumusan','isi']);
