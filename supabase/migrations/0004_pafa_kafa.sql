-- ============================================================
-- PAFA/KAFA (Fardu Ain) module schema
-- Drives age-appropriate questions for the 3 children:
--   ilyas   -> 't1'  (Tahun 1 level - simple/concrete)
--   hafeeza -> 't4'  (Tahun 4 level - intermediate/process)
--   dhiya   -> 'f3'  (Tingkatan 3 level - advanced/reasoning/KBAT)
-- ============================================================

CREATE TYPE pafakafa_level AS ENUM ('t1', 't4', 'f3');
CREATE TYPE pafakafa_qtype AS ENUM ('mcq', 'true_false', 'fill_blank');
CREATE TYPE pafakafa_difficulty AS ENUM ('easy', 'standard', 'kbat');

CREATE TABLE pafakafa_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level           pafakafa_level NOT NULL,
  chapter         INT NOT NULL,
  chapter_title   TEXT NOT NULL,
  question_text   TEXT NOT NULL,
  question_type   pafakafa_qtype NOT NULL DEFAULT 'mcq',
  options         TEXT[],
  correct_answer  TEXT NOT NULL,
  explanation     TEXT,
  image_url       TEXT,
  difficulty      pafakafa_difficulty NOT NULL DEFAULT 'standard',
  tags            TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pafakafa_questions_level_chapter_idx
  ON pafakafa_questions (level, chapter);

CREATE TABLE pafakafa_quiz_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          TEXT NOT NULL,
  level             pafakafa_level NOT NULL,
  chapter           INT NOT NULL,
  total_questions   INT NOT NULL,
  correct_answers   INT NOT NULL,
  duration_sec      INT,
  points_earned     INT,
  term_gaps_logged  INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pafakafa_quiz_results_child_idx
  ON pafakafa_quiz_results (child_id, created_at DESC);

CREATE TABLE pafakafa_answer_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id        UUID NOT NULL REFERENCES pafakafa_quiz_results(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES pafakafa_questions(id),
  given_answer     TEXT NOT NULL,
  is_correct       BOOLEAN NOT NULL,
  response_time_ms INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pafakafa_term_gaps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     TEXT NOT NULL,
  question_id  UUID REFERENCES pafakafa_questions(id),
  term         TEXT NOT NULL,
  chapter      INT,
  context      TEXT,
  reviewed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SEED — 60 questions (10 chapters x 3 levels x 2 questions)
-- ============================================================

-- ---------- CHAPTER 1: Dua Kalimah Syahadah ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 1, 'Dua Kalimah Syahadah', 'Mengapakah kita mengucap dua kalimah syahadah?', 'mcq', ARRAY['Tanda menjadi Muslim', 'Supaya boleh makan', 'Untuk mendapat hadiah', 'Supaya pandai menulis'], 'Tanda menjadi Muslim', 'Mengucap dua kalimah syahadah ialah rukun Islam pertama dan pintu masuk Islam.', 'easy', ARRAY['syahadah', 'akidah']),
('t1', 1, 'Dua Kalimah Syahadah', 'Lafaz "Asyhadu alla ilaha illallah" bermaksud: Aku bersaksi bahawa tiada Tuhan melainkan ____.', 'fill_blank', NULL, 'Allah', 'Sambungan maksudnya ialah: tiada tuhan melainkan Allah.', 'easy', ARRAY['syahadah', 'akidah']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 1, 'Dua Kalimah Syahadah', 'Kalimah syahadah yang pertama dipanggil "Syahadah Tauhid".', 'true_false', NULL, 'true', 'Syahadah pertama memfokuskan kepada keesaan Allah (Tauhid).', 'standard', ARRAY['syahadah', 'akidah']),
('t4', 1, 'Dua Kalimah Syahadah', 'Apakah maksud kalimah syahadah yang kedua (Syahadah Rasul)?', 'mcq', ARRAY['Nabi Muhammad ialah utusan Allah', 'Nabi Isa ialah utusan Allah', 'Tiada tuhan melainkan Allah', 'Malaikat sentiasa taat kepada Allah'], 'Nabi Muhammad ialah utusan Allah', 'Syahadah Rasul bermaksud: Dan aku bersaksi bahawa Nabi Muhammad ialah utusan Allah.', 'standard', ARRAY['syahadah', 'rasul']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 1, 'Dua Kalimah Syahadah', 'Syarat sah mengucap syahadah bagi seorang mualaf merangkumi kefahaman terhadap maksud kalimah yang dilafazkan.', 'true_false', NULL, 'true', 'Seseorang perlu melafazkan dengan lisan serta memahami dan mempercayai maknanya di dalam hati.', 'standard', ARRAY['syahadah', 'mualaf']),
('f3', 1, 'Dua Kalimah Syahadah', 'Antara berikut, manakah perkataan arab yang bermaksud "Aku naik saksi"?', 'mcq', ARRAY['Asyhadu', 'Rasulullah', 'Ilaha', 'Wa-asyhadu'], 'Asyhadu', 'Asyhadu bermaksud "Aku bersaksi" atau "Aku naik saksi".', 'kbat', ARRAY['syahadah', 'bahasa_arab']);


-- ---------- CHAPTER 2: Rukun Islam & Rukun Iman ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 2, 'Rukun Islam & Rukun Iman', 'Berapakah jumlah Rukun Islam?', 'mcq', ARRAY['5', '6', '7', '4'], '5', 'Rukun Islam ada 5 perkara utama.', 'easy', ARRAY['rukun_islam']),
('t1', 2, 'Rukun Islam & Rukun Iman', 'Rukun Iman mempunyai ____ perkara.', 'fill_blank', NULL, '6', 'Rukun Iman ada 6 perkara yang wajib diyakini.', 'easy', ARRAY['rukun_iman']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 2, 'Rukun Islam & Rukun Iman', 'Beriman kepada Hari Kiamat ialah Rukun Iman yang keberapa?', 'mcq', ARRAY['Ke-5', 'Ke-6', 'Ke-4', 'Ke-3'], 'Ke-5', 'Urutan Rukun Iman: 1. Allah, 2. Malaikat, 3. Kitab, 4. Rasul, 5. Hari Kiamat, 6. Qada & Qadar.', 'standard', ARRAY['rukun_iman', 'kiamat']),
('t4', 2, 'Rukun Islam & Rukun Iman', 'Solat lima waktu sehari semalam termasuk dalam Rukun Islam.', 'true_false', NULL, 'true', 'Solat fardu ialah rukun Islam yang kedua.', 'easy', ARRAY['rukun_islam', 'solat']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 2, 'Rukun Islam & Rukun Iman', 'Apakah takrifan "Qadar" di bawah rukun iman yang keenam?', 'mcq', ARRAY['Pelaksanaan ketetapan Allah sejak azali', 'Ketetapan Allah sejak azali terhadap semua perkara', 'Sesuatu yang berlaku secara kebetulan', 'Hukum alam semula jadi'], 'Pelaksanaan ketetapan Allah sejak azali', 'Qadar ialah pelaksanaan (realisasi) daripada ketetapan Allah (Qada) yang telah diputuskan sejak azali.', 'standard', ARRAY['rukun_iman', 'qada_qadar']),
('f3', 2, 'Rukun Islam & Rukun Iman', 'Mengerjakan ibadat Haji bagi yang berkemampuan dikira sebagai fardu ain ke atas setiap Muslim.', 'true_false', NULL, 'true', 'Haji ialah fardu ain bagi mukalaf yang memenuhi syarat kemampuan (istita''ah).', 'standard', ARRAY['rukun_islam', 'haji']);


-- ---------- CHAPTER 3: Bersuci & Istinjak ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 3, 'Bersuci & Istinjak', 'Kita membersihkan diri selepas membuang air menggunakan air mutlak. Proses ini dinamakan ____.', 'fill_blank', NULL, 'istinjak', 'Istinjak ialah perbuatan membersihkan kubul atau dubur selepas membuang air.', 'easy', ARRAY['bersuci', 'istinjak']),
('t1', 3, 'Bersuci & Istinjak', 'Kita boleh menggunakan batu kering untuk beristinjak jika tiada air.', 'true_false', NULL, 'true', 'Batu, daun kering, atau benda kesat yang bukan benda suci dihormati boleh digunakan untuk istinjak apabila tiada air.', 'easy', ARRAY['bersuci', 'istinjak']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 3, 'Bersuci & Istinjak', 'Antara berikut, bahan manakah yang BUKAN alat beristinjak selain air?', 'mcq', ARRAY['Batu licin', 'Tisu bersih', 'Kertas tisu', 'Tulang kering'], 'Tulang kering', 'Tulang dan makanan adalah benda yang dihormati (makanan jin/manusia), maka haram digunakan untuk beristinjak.', 'standard', ARRAY['istinjak']),
('t4', 3, 'Bersuci & Istinjak', 'Najis mukhaffafah ialah najis ringan seperti air kencing bayi lelaki berumur kurang 2 tahun yang hanya minum susu ibunya sahaja.', 'true_false', NULL, 'true', 'Betul, ia dibersihkan hanya dengan merenjis air mutlak ke atas kawasan najis setelah dibuang zatnya.', 'standard', ARRAY['najis', 'mukhaffafah']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 3, 'Bersuci & Istinjak', 'Bagaimanakah cara menyucikan najis mutawassitah yang berupa "najis aini" (mempunyai warna, bau, atau rasa)?', 'mcq', ARRAY['Dibasuh sehingga hilang warna, bau, dan rasanya dengan air mutlak', 'Direnjis dengan air mutlak sahaja', 'Dibasuh 7 kali dengan air tanah', 'Cukup sekadar dilap dengan tisu kering'], 'Dibasuh sehingga hilang warna, bau, dan rasanya dengan air mutlak', 'Najis aini mesti dibersihkan sehingga hilang zat najis tersebut (warna, bau, dan rasa).', 'standard', ARRAY['najis', 'mutawassitah']),
('f3', 3, 'Bersuci & Istinjak', 'Menyucikan najis mughallazah memerlukan basuhan 7 kali dengan air mutlak, di mana salah satu basuhannya mestilah bercampur dengan tanah bersih.', 'true_false', NULL, 'true', 'Betul. Ini cara menyucikan najis berat (anjing, babi, dan keturunannya).', 'standard', ARRAY['najis', 'mughallazah']);


-- ---------- CHAPTER 4: Wuduk & Tayamum ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 4, 'Wuduk & Tayamum', 'Sebelum solat, kita mesti mengambil ____ menggunakan air bersih.', 'fill_blank', NULL, 'wuduk', 'Wuduk adalah syarat sah solat untuk menghilangkan hadas kecil.', 'easy', ARRAY['wuduk']),
('t1', 4, 'Wuduk & Tayamum', 'Berkumur-kumur semasa mengambil wuduk ialah perkara sunat.', 'true_false', NULL, 'true', 'Berkumur-kumur ialah sunat wuduk, manakala membasuh muka ialah rukun.', 'easy', ARRAY['wuduk', 'sunat']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 4, 'Wuduk & Tayamum', 'Manakah antara berikut yang BUKAN rukun wuduk?', 'mcq', ARRAY['Membasuh muka', 'Membasuh telinga', 'Membasuh tangan hingga ke siku', 'Membasuh kaki hingga ke buku lali'], 'Membasuh telinga', 'Membasuh atau menyapu telinga ialah perkara sunat wuduk, bukan rukun.', 'standard', ARRAY['wuduk', 'rukun']),
('t4', 4, 'Wuduk & Tayamum', 'Tayamum dilakukan dengan menggunakan debu tanah yang bersih untuk menggantikan wuduk apabila ketiadaan air.', 'true_false', NULL, 'true', 'Betul, tayamum ialah rukhsah (kelonggaran) apabila tiada air atau uzur untuk menggunakan air.', 'standard', ARRAY['tayamum']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 4, 'Wuduk & Tayamum', 'Apakah rukun tayamum yang kedua selepas niat?', 'mcq', ARRAY['Menyapu debu tanah ke muka', 'Menyapu debu tanah ke tangan hingga ke siku', 'Tertib', 'Membasuh kaki'], 'Menyapu debu tanah ke muka', 'Rukun tayamum: 1. Niat, 2. Menyapu debu ke muka, 3. Menyapu debu ke kedua-dua belah tangan hingga siku, 4. Tertib.', 'standard', ARRAY['tayamum', 'rukun']),
('f3', 4, 'Wuduk & Tayamum', 'Seseorang yang bertayamum dibenarkan menunaikan lebih daripada satu solat fardu dengan satu kali tayamum.', 'true_false', NULL, 'false', 'Satu tayamum hanya sah untuk satu solat fardu sahaja (dan beberapa solat sunat).', 'kbat', ARRAY['tayamum', 'fiqh']);


-- ---------- CHAPTER 5: Mandi Wajib ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 5, 'Mandi Wajib', 'Mandi untuk membersihkan diri daripada hadas besar dinamakan mandi wajib.', 'true_false', NULL, 'true', 'Mandi wajib dilakukan untuk menyucikan diri daripada janabah, haid, nifas, dll.', 'easy', ARRAY['mandi_wajib']),
('t1', 5, 'Mandi Wajib', 'Kita mesti mengalirkan air ke seluruh ____ semasa mandi wajib.', 'fill_blank', NULL, 'badan', 'Rukun mandi wajib ialah meratakan air ke seluruh rambut, kulit, dan badan.', 'easy', ARRAY['mandi_wajib']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 5, 'Mandi Wajib', 'Antara berikut, yang manakah sebab yang mewajibkan mandi bagi pelajar perempuan apabila dewasa?', 'mcq', ARRAY['Haid', 'Berpeluh', 'Tidur', 'Selesai wuduk'], 'Haid', 'Keluarnya darah haid mewajibkan mandi wajib ke atas perempuan apabila darah tersebut berhenti.', 'standard', ARRAY['mandi_wajib', 'perempuan']),
('t4', 5, 'Mandi Wajib', 'Rukun mandi wajib ada dua: Niat dan meratakan air ke seluruh anggota badan, kulit, dan rambut.', 'true_false', NULL, 'true', 'Betul, hanya ada dua rukun mandi wajib mengikut mazhab Syafi''i.', 'standard', ARRAY['mandi_wajib', 'rukun']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 5, 'Mandi Wajib', 'Apakah hukum sekiranya terdapat sisa pewarna kuku atau gam yang menghalang air sampai ke kulit semasa mandi wajib?', 'mcq', ARRAY['Mandi tidak sah dan wajib diulangi selepas sisa dibuang', 'Mandi tetap sah tetapi makruh', 'Mandi sah sekiranya terlupa', 'Hanya perlu mengambil wuduk semula'], 'Mandi tidak sah dan wajib diulangi selepas sisa dibuang', 'Menghilangkan halangan air sampai ke kulit/rambut ialah syarat sah mandi wajib.', 'standard', ARRAY['mandi_wajib', 'syarat_sah']),
('f3', 5, 'Mandi Wajib', 'Lafaz niat mandi wajib selepas haid ialah: "Nawaitu gusla minal haidi fardhan lillahi ta''ala".', 'true_false', NULL, 'true', 'Niat mandi kerana haid bermaksud: Sahaja aku mandi wajib daripada haid kerana Allah Taala.', 'kbat', ARRAY['mandi_wajib', 'niat']);


-- ---------- CHAPTER 6: Solat Fardu & Toma'ninah ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 6, 'Solat Fardu & Toma''ninah', 'Berapakah jumlah solat fardu sehari semalam?', 'mcq', ARRAY['5', '3', '7', '4'], '5', 'Solat fardu wajib ada 5 (Subuh, Zohor, Asar, Maghrib, Isyak).', 'easy', ARRAY['solat_fardu']),
('t1', 6, 'Solat Fardu & Toma''ninah', 'Solat yang dikerjakan pada waktu pagi sebelum terbit matahari ialah solat ____.', 'fill_blank', NULL, 'subuh', 'Solat Subuh dikerjakan dari terbit fajar sadiq sehingga terbit matahari.', 'easy', ARRAY['solat_fardu', 'subuh']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 6, 'Solat Fardu & Toma''ninah', 'Apakah maksud "Toma''ninah" dalam perbuatan solat seperti rukuk dan sujud?', 'mcq', ARRAY['Berhenti seketika dengan tenang', 'Membaca doa panjang', 'Melihat ke tempat sujud', 'Bergerak dengan cepat'], 'Berhenti seketika dengan tenang', 'Toma''ninah bermaksud berhenti seketika selepas pergerakan anggota badan dengan sekurang-kurangnya tempoh tasbih (Subhanallah).', 'standard', ARRAY['solat', 'tomaninah']),
('t4', 6, 'Solat Fardu & Toma''ninah', 'Membaca Surah al-Fatihah ialah salah satu rukun qauli (bacaan) dalam solat.', 'true_false', NULL, 'true', 'Betul, Al-Fatihah wajib dibaca pada setiap rakaat solat.', 'standard', ARRAY['solat', 'rukun']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 6, 'Solat Fardu & Toma''ninah', 'Tertib bermaksud melakukan rukun solat mengikut urutan yang betul.', 'true_false', NULL, 'true', 'Tertib adalah rukun yang mewajibkan pelaksanaan rukun-rukun solat mengikut susunan dari niat hingga salam.', 'standard', ARRAY['solat', 'tertib']),
('f3', 6, 'Solat Fardu & Toma''ninah', 'Sekiranya seseorang tertinggal "Tahiyyat Awal" dalam solat Zohor, bagaimanakah cara menutup kesilapan tersebut sebelum salam?', 'mcq', ARRAY['Melakukan Sujud Sahwi sebelum memberi salam', 'Mengulangi solat dari awal', 'Membayar denda (dam)', 'Membaca doa qunut'], 'Melakukan Sujud Sahwi sebelum memberi salam', 'Tahiyyat awal ialah sunat ab''ad; jika tertinggal, ia diganti dengan sujud sahwi sebelum salam.', 'kbat', ARRAY['solat', 'sujud_sahwi']);


-- ---------- CHAPTER 7: Solat Berjemaah & Masbuk Muafik ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 7, 'Solat Berjemaah & Masbuk Muafik', 'Orang yang mengetuai solat berjemaah dipanggil ____.', 'fill_blank', NULL, 'imam', 'Imam mengetuai solat di hadapan, manakah makmum mengikut di belakang.', 'easy', ARRAY['solat_berjemaah']),
('t1', 7, 'Solat Berjemaah & Masbuk Muafik', 'Kita mendapat pahala lebih banyak jika solat bersendirian berbanding berjemaah.', 'true_false', NULL, 'false', 'Solat berjemaah mendapat pahala 27 kali ganda berbanding solat bersendirian.', 'easy', ARRAY['solat_berjemaah', 'pahala']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 7, 'Solat Berjemaah & Masbuk Muafik', 'Seseorang makmum yang sempat membaca Surah al-Fatihah bersama imam dengan sempurna dipanggil makmum ____.', 'fill_blank', NULL, 'muafik', 'Makmum muafik sempat membaca Fatihah bersama imam dalam kadar biasa.', 'standard', ARRAY['solat_berjemaah', 'muafik']),
('t4', 7, 'Solat Berjemaah & Masbuk Muafik', 'Makmum masbuk ialah makmum yang lewat dan tidak sempat membaca Surah al-Fatihah bersama imam sebelum imam rukuk.', 'true_false', NULL, 'true', 'Betul, makmum masbuk perlu terus rukuk mengikut imam jika imam sedang rukuk.', 'standard', ARRAY['solat_berjemaah', 'masbuk']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 7, 'Solat Berjemaah & Masbuk Muafik', 'Apakah tindakan yang betul bagi makmum masbuk yang mendapati imam sedang sujud apabila dia sampai?', 'mcq', ARRAY['Takbiratul Ihram berdiri tegak, kemudian terus sujud mengikut imam tanpa mengira rakaat tersebut', 'Menunggu sehingga imam berdiri semula untuk rakaat seterusnya', 'Terus duduk tahiyyat akhir', 'Melakukan rukuk dahulu baru sujud'], 'Takbiratul Ihram berdiri tegak, kemudian terus sujud mengikut imam tanpa mengira rakaat tersebut', 'Makmum perlu melakukan takbiratul ihram ketika berdiri (syarat sah), kemudian terus turun sujud mengikut imam.', 'kbat', ARRAY['solat_berjemaah', 'masbuk']),
('f3', 7, 'Solat Berjemaah & Masbuk Muafik', 'Jika makmum bergerak mendahului imam sebanyak dua rukun fi''li secara sengaja tanpa uzur, solat makmum tersebut menjadi batal.', 'true_false', NULL, 'true', 'Mengikut mazhab Syafi''i, mendahului imam sebanyak dua rukun fi''li yang panjang secara sengaja membatalkan solat.', 'standard', ARRAY['solat_berjemaah', 'rukun']);


-- ---------- CHAPTER 8: Puasa Ramadan ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 8, 'Puasa Ramadan', 'Kita berpuasa pada bulan ____.', 'fill_blank', NULL, 'ramadan', 'Puasa pada bulan Ramadan ialah rukun Islam yang ketiga.', 'easy', ARRAY['puasa', 'ramadan']),
('t1', 8, 'Puasa Ramadan', 'Menahan diri daripada makan dan minum dari terbit fajar hingga terbenam matahari dipanggil puasa.', 'true_false', NULL, 'true', 'Puasa menuntut kawalan diri daripada perkara yang membatalkan dari fajar sadiq sehingga maghrib.', 'easy', ARRAY['puasa']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 8, 'Puasa Ramadan', 'Antara berikut, perkara manakah yang membatalkan puasa seseorang?', 'mcq', ARRAY['Memasukkan sesuatu ke dalam rongga terbuka dengan sengaja', 'Mandi pada waktu petang', 'Berkumur-kumur secara tidak berlebihan', 'Tidur di siang hari'], 'Memasukkan sesuatu ke dalam rongga terbuka dengan sengaja', 'Memasukkan benda ke rongga terbuka (mulut, hidung, telinga) secara sengaja membatalkan puasa.', 'standard', ARRAY['puasa', 'batal']),
('t4', 8, 'Puasa Ramadan', 'Niat puasa Ramadan wajib dilakukan pada waktu malam sebelum subuh.', 'true_false', NULL, 'true', 'Puasa fardu mewajibkan niat pada waktu malam (ta''yit al-niyyah) sebelum masuk fajar.', 'standard', ARRAY['puasa', 'niat']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 8, 'Puasa Ramadan', 'Golongan manakah yang diberi rukhsah (kelonggaran) untuk berbuka puasa tetapi wajib menggantinya (qada)?', 'mcq', ARRAY['Orang musafir dan orang sakit yang ada harapan sembuh', 'Orang tua yang sangat uzur', 'Kanak-kanak belum baligh', 'Orang gila'], 'Orang musafir dan orang sakit yang ada harapan sembuh', 'Musafir dan pesakit boleh berbuka tetapi wajib qada'' mengikut bilangan hari yang ditinggalkan.', 'standard', ARRAY['puasa', 'rukhsah']),
('f3', 8, 'Puasa Ramadan', 'Seseorang yang sakit berterusan sehingga tidak mampu berpuasa seumur hidupnya wajib membayar fidyah dan tidak perlu qada puasa.', 'true_false', NULL, 'true', 'Betul, orang yang sakit kronik/tua uzur tidak mampu mengganti puasa hanya perlu membayar fidyah (satu cupak makanan asasi sehari).', 'kbat', ARRAY['puasa', 'fidyah']);


-- ---------- CHAPTER 9: Adab & Akhlak Islamiah ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 9, 'Adab & Akhlak Islamiah', 'Kita hendaklah bercakap dengan sopan dan lembut apabila bercakap dengan ____ bapa.', 'fill_blank', NULL, 'ibu', 'Ibu bapa adalah insan paling wajib dihormati dan disayangi.', 'easy', ARRAY['adab', 'ibu_bapa']),
('t1', 9, 'Adab & Akhlak Islamiah', 'Membuang sampah di merata-rata tempat ialah amalan yang disukai oleh Allah.', 'true_false', NULL, 'false', 'Kebersihan sebahagian daripada iman; membuang sampah merata-rata adalah akhlak buruk.', 'easy', ARRAY['adab', 'kebersihan']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 9, 'Adab & Akhlak Islamiah', 'Manakah antara berikut adab yang betul ketika menziarahi rakan yang sakit?', 'mcq', ARRAY['Mendoakan kesembuhan mereka', 'Bercakap dengan suara yang sangat kuat', 'Menziarahi terlalu lama', 'Membawa makanan yang dilarang doktor'], 'Mendoakan kesembuhan mereka', 'Adab melawat orang sakit termasuk mendoakan kebaikan, menenangkan jiwa mereka, dan tidak mengganggu waktu rehat.', 'standard', ARRAY['adab', 'melawat_sakit']),
('t4', 9, 'Adab & Akhlak Islamiah', 'Adab menuntut ilmu termasuklah memberi perhatian sepenuhnya ketika guru sedang mengajar.', 'true_false', NULL, 'true', 'Menumpukan perhatian dan menghormati guru adalah kunci keberkatan ilmu.', 'standard', ARRAY['adab', 'menuntut_ilmu']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 9, 'Adab & Akhlak Islamiah', 'Bagaimanakah cara menunjukkan adab menjaga ikhtilat (pergaulan) dalam era komunikasi digital hari ini?', 'mcq', ARRAY['Mengelakkan perbualan santai yang tiada urusan penting serta menjaga bahasa sopan', 'Berkongsi gambar peribadi secara terbuka dengan semua orang', 'Bercakap kasar dengan rakan berlainan jantina', 'Menggunakan akaun palsu untuk mengomen'], 'Mengelakkan perbualan santai yang tiada urusan penting serta menjaga bahasa sopan', 'Ikhtilat atas talian (online interaction) juga tertakluk kepada batas adab, ketertiban, dan menjauhi fitnah.', 'kbat', ARRAY['adab', 'ikhtilat_digital']),
('f3', 9, 'Adab & Akhlak Islamiah', 'Adab memelihara alam sekitar dianggap sebahagian daripada tanggungjawab fardu kifayah manusia sebagai khalifah di bumi.', 'true_false', NULL, 'true', 'Manusia memikul amanah (khalifah) untuk memakmurkan dan tidak merosakkan alam sekitar.', 'standard', ARRAY['adab', 'alam_sekitar']);


-- ---------- CHAPTER 10: Sirah Nabawiyah ----------
-- Tahap 1 (Ilyas)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t1', 10, 'Sirah Nabawiyah', 'Nabi Muhammad SAW dilahirkan di kota ____.', 'fill_blank', NULL, 'makkah', 'Nabi lahir di Makkah Al-Mukarramah sebelum berhijrah ke Madinah.', 'easy', ARRAY['sirah', 'nabi']),
('t1', 10, 'Sirah Nabawiyah', 'Bapa Nabi Muhammad SAW bernama Abdullah.', 'true_false', NULL, 'true', 'Betul, bapa Nabi bernama Abdullah bin Abdul Muttalib.', 'easy', ARRAY['sirah', 'nabi_bapa']);

-- Tahap 4 (Hafeeza)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('t4', 10, 'Sirah Nabawiyah', 'Apakah gelaran yang diberikan oleh penduduk Makkah kepada Nabi Muhammad SAW kerana sifat amanah baginda?', 'mcq', ARRAY['Al-Amin', 'As-Siddiq', 'Al-Farooq', 'Zun Nurain'], 'Al-Amin', 'Al-Amin bermaksud "yang dipercayai". Gelaran ini diberi sebelum baginda menjadi Rasul.', 'standard', ARRAY['sirah', 'gelaran']),
('t4', 10, 'Sirah Nabawiyah', 'Peristiwa penghijrahan Nabi Muhammad SAW dan umat Islam dari Makkah ke Madinah menandakan bermulanya Kalendar Hijrah.', 'true_false', NULL, 'true', 'Betul, hijrah adalah peristiwa besar yang melambangkan permulaan daulah Islamiah dan takwim Hijrah.', 'standard', ARRAY['sirah', 'hijrah']);

-- Tingkatan 3 (Dhiya)
INSERT INTO pafakafa_questions (level, chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags) VALUES
('f3', 10, 'Sirah Nabawiyah', 'Apakah intipati Perjanjian Aqabah Pertama yang berlaku sebelum Hijrah?', 'mcq', ARRAY['Ikrar taat setia penduduk Yathrib untuk menyembah Allah semata-mata dan tidak mencuri/berbohong', 'Perjanjian gencatan senjata antara orang Islam dan Quraisy', 'Perjanjian perdagangan antara Makkah dan Madinah', 'Pengisytiharan perang terhadap musuh Islam'], 'Ikrar taat setia penduduk Yathrib untuk menyembah Allah semata-mata dan tidak mencuri/berbohong', 'Perjanjian Aqabah Pertama (Perjanjian Wanita) memfokuskan kepada ikrar kesetiaan iman, moral, dan meninggalkan adat jahiliah.', 'standard', ARRAY['sirah', 'aqabah']),
('f3', 10, 'Sirah Nabawiyah', 'Piagam Madinah digubal oleh Rasulullah SAW untuk menyatukan penduduk Madinah yang terdiri daripada orang Islam (Muhajirin & Ansar) dan orang Yahudi.', 'true_false', NULL, 'true', 'Betul, Piagam Madinah ialah perlembagaan bertulis pertama di dunia untuk mengatur hubungan bermasyarakat di Madinah.', 'kbat', ARRAY['sirah', 'piagam_madinah']);
