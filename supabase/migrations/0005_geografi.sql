-- ============================================================
-- Geografi module schema (mirrors sejarah/science pattern)
-- KSSM Geografi Tingkatan 1-3  -  16 bab
-- ============================================================

create type geografi_qtype as enum ('mcq', 'true_false', 'fill_blank');
create type geografi_difficulty as enum ('easy', 'standard', 'kbat');

create table geografi_questions (
  id              uuid primary key default gen_random_uuid(),
  chapter         int not null,
  chapter_title   text not null,
  question_text   text not null,
  question_type   geografi_qtype not null default 'mcq',
  options         text[],
  correct_answer  text not null,
  explanation     text,
  image_url       text,
  difficulty      geografi_difficulty not null default 'standard',
  tags            text[],
  created_at      timestamptz not null default now()
);
create index geografi_questions_chapter_idx
  on geografi_questions (chapter);

create table geografi_quiz_results (
  id                uuid primary key default gen_random_uuid(),
  child_id          text not null,
  chapter           int not null,
  total_questions   int not null,
  correct_answers   int not null,
  duration_sec      int,
  points_earned     int,
  vocab_gaps_logged int not null default 0,
  created_at        timestamptz not null default now()
);
create index geografi_quiz_results_child_idx
  on geografi_quiz_results (child_id, created_at desc);

create table geografi_answer_log (
  id               uuid primary key default gen_random_uuid(),
  result_id        uuid not null references geografi_quiz_results(id) on delete cascade,
  question_id      uuid not null references geografi_questions(id),
  given_answer     text not null,
  is_correct       boolean not null,
  response_time_ms int,
  created_at       timestamptz not null default now()
);

create table geografi_vocab_gaps (
  id           uuid primary key default gen_random_uuid(),
  child_id     text not null,
  question_id  uuid references geografi_questions(id),
  word         text not null,
  chapter      int,
  context      text,
  reviewed     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Seed: 40 soalan Geografi KSSM (Bahasa Melayu)
-- ============================================================

-- Bab 1: Arah dan Kedudukan dalam Peta Topografi (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (1, 'Arah dan Kedudukan dalam Peta Topografi', 'Berapakah bearing sudutan bagi arah Barat Daya?', 'mcq', array['135°', '225°', '270°', '315°'], '225°', 'Bearing sudutan dikira mengikut arah jam dari Utara. Barat Daya berada pada 225°.', 'easy', array['bearing', 'arah']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (1, 'Arah dan Kedudukan dalam Peta Topografi', 'Rujukan grid enam angka digunakan untuk menentukan ______ sesuatu tempat di atas peta.', 'fill_blank', null, 'kedudukan tepat', 'Rujukan grid enam angka memberikan kedudukan tepat sesuatu ciri pada peta topografi, manakala rujukan grid empat angka hanya memberikan kedudukan umum.', 'standard', array['rujukan grid', 'peta topografi']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (1, 'Arah dan Kedudukan dalam Peta Topografi', 'Sebuah menara terletak pada bearing 045° dari sekolah. Apakah arah menara dari sekolah?', 'mcq', array['Timur Laut', 'Tenggara', 'Barat Laut', 'Barat Daya'], 'Timur Laut', 'Bearing 045° bermaksud 45° dari Utara mengikut arah jam, iaitu arah Timur Laut.', 'standard', array['bearing', 'arah mata angin']);

-- Bab 2: Skala, Jarak dan Luas (2 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (2, 'Skala, Jarak dan Luas', 'Jika skala peta ialah 1:50 000, berapakah jarak sebenar bagi 4 cm di atas peta?', 'mcq', array['1 km', '2 km', '4 km', '8 km'], '2 km', '4 cm x 50 000 = 200 000 cm = 2 km. Setiap 1 cm pada peta mewakili 0.5 km jarak sebenar.', 'easy', array['skala', 'jarak']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (2, 'Skala, Jarak dan Luas', 'Sebuah kawasan pada peta berskala 1:50 000 berukuran 2 cm x 3 cm. Berapakah luas sebenar kawasan tersebut dalam km persegi?', 'mcq', array['1.5 km²', '3 km²', '6 km²', '15 km²'], '1.5 km²', 'Luas pada peta = 6 cm². Setiap 1 cm = 0.5 km, jadi 1 cm² = 0.25 km². Luas sebenar = 6 x 0.25 = 1.5 km².', 'kbat', array['skala', 'luas']);

-- Bab 3: Ketinggian dan Keratan Rentas (2 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (3, 'Ketinggian dan Keratan Rentas', 'Apakah ciri yang ditunjukkan apabila garis kontur rapat antara satu sama lain?', 'mcq', array['Kawasan rata', 'Cerun curam', 'Lembah', 'Puncak bukit'], 'Cerun curam', 'Garis kontur yang rapat menunjukkan perubahan ketinggian yang besar dalam jarak mendatar yang pendek, iaitu cerun curam.', 'easy', array['garis kontur', 'cerun']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (3, 'Ketinggian dan Keratan Rentas', 'Benar atau Salah: Keratan rentas dilukis untuk menunjukkan profil muka bumi dari satu titik ke titik yang lain.', 'true_false', null, 'Benar', 'Keratan rentas menunjukkan rupa bentuk muka bumi secara profil dengan memindahkan maklumat ketinggian dari garis kontur ke atas kertas graf.', 'easy', array['keratan rentas', 'profil']);

-- Bab 4: Pandang Darat (2 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (4, 'Pandang Darat', 'Yang manakah antara berikut merupakan pandang darat budaya?', 'mcq', array['Sungai', 'Sawah padi', 'Gunung', 'Hutan'], 'Sawah padi', 'Pandang darat budaya ialah ciri landskap yang dihasilkan oleh aktiviti manusia seperti sawah padi, jalan raya, dan petempatan.', 'easy', array['pandang darat budaya', 'peta topografi']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (4, 'Pandang Darat', 'Berdasarkan peta topografi, nyatakan dua ciri pandang darat fizikal dan dua ciri pandang darat budaya yang boleh dikenal pasti.', 'fill_blank', null, 'Fizikal: sungai dan bukit; Budaya: jalan raya dan petempatan', 'Pandang darat fizikal merujuk kepada ciri semula jadi seperti sungai, bukit, lembah, dan hutan. Pandang darat budaya merujuk kepada ciri buatan manusia seperti jalan raya, petempatan, dan ladang.', 'kbat', array['pandang darat fizikal', 'pandang darat budaya']);

-- Bab 5: Pergerakan Plat Tektonik (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (5, 'Pergerakan Plat Tektonik', 'Apakah yang berlaku apabila dua plat tektonik bergerak menjauhi antara satu sama lain?', 'mcq', array['Pertembungan', 'Pencapahan', 'Slipan', 'Subduksi'], 'Pencapahan', 'Pencapahan (divergent) berlaku apabila dua plat bergerak menjauhi antara satu sama lain, menyebabkan magma naik ke permukaan dan membentuk kerak lautan baharu.', 'standard', array['plat tektonik', 'pencapahan']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (5, 'Pergerakan Plat Tektonik', 'Lapisan SIAL terdiri daripada unsur utama ______ dan ______.', 'fill_blank', null, 'silikon dan aluminium', 'SIAL ialah lapisan kerak bumi yang terdiri daripada unsur silikon (Si) dan aluminium (Al). Lapisan ini membentuk kerak benua yang kurang tumpat berbanding SIMA.', 'standard', array['SIAL', 'kerak bumi']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (5, 'Pergerakan Plat Tektonik', 'Jelaskan mengapa kawasan Cincin Api Pasifik sering mengalami gempa bumi dan letusan gunung berapi.', 'fill_blank', null, 'Kawasan ini terletak di sempadan plat tektonik yang aktif di mana pertembungan dan subduksi berlaku', 'Cincin Api Pasifik ialah zon di sekeliling Lautan Pasifik yang mempunyai banyak sempadan plat aktif. Pertembungan plat menyebabkan subduksi yang menghasilkan gempa bumi dan letusan gunung berapi.', 'kbat', array['Cincin Api Pasifik', 'gempa bumi', 'gunung berapi']);

-- Bab 6: Batuan (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (6, 'Batuan', 'Granit ialah sejenis batuan igneus ______.', 'mcq', array['letusan', 'rejahan', 'sedimen', 'metamorfik'], 'rejahan', 'Granit terbentuk apabila magma membeku secara perlahan di bawah permukaan bumi (rejahan/intrusive), menghasilkan hablur mineral yang besar.', 'standard', array['batuan igneus', 'granit', 'rejahan']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (6, 'Batuan', 'Marmar terbentuk daripada proses metamorfisme ke atas batuan ______.', 'mcq', array['granit', 'basalt', 'batu kapur', 'batu pasir'], 'batu kapur', 'Marmar ialah batuan metamorfik yang terbentuk apabila batu kapur (batuan sedimen) mengalami haba dan tekanan yang tinggi.', 'standard', array['batuan metamorfik', 'marmar', 'batu kapur']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (6, 'Batuan', 'Benar atau Salah: Kitaran batuan menunjukkan bahawa ketiga-tiga jenis batuan boleh bertukar antara satu sama lain melalui proses semula jadi.', 'true_false', null, 'Benar', 'Kitaran batuan menunjukkan batuan igneus, sedimen, dan metamorfik saling bertukar melalui proses seperti luluhawa, hakisan, pemendapan, haba, tekanan, dan peleburan.', 'easy', array['kitaran batuan', 'jenis batuan']);

-- Bab 7: Luluhawa (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (7, 'Luluhawa', 'Yang manakah merupakan contoh luluhawa mekanikal?', 'mcq', array['Tindakan asid ke atas batu kapur', 'Akar pokok memecahkan batuan', 'Pembekuan dan pencairan air dalam rekahan', 'Tindakan bakteria menguraikan batuan'], 'Pembekuan dan pencairan air dalam rekahan', 'Luluhawa mekanikal (fizikal) melibatkan pemecahan batuan secara fizikal tanpa mengubah komposisi kimia. Pembekuan dan pencairan air dalam rekahan memecahkan batuan melalui pengembangan isi padu.', 'standard', array['luluhawa mekanikal', 'pembekuan']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (7, 'Luluhawa', 'Luluhawa kimia berlaku dengan lebih cepat di kawasan ______.', 'mcq', array['beriklim sejuk dan kering', 'beriklim panas dan lembap', 'beriklim sederhana', 'kutub'], 'beriklim panas dan lembap', 'Iklim panas dan lembap mempercepatkan tindak balas kimia antara air, gas, dan mineral batuan. Suhu tinggi dan kelembapan yang banyak meningkatkan kadar luluhawa kimia.', 'standard', array['luluhawa kimia', 'iklim']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (7, 'Luluhawa', 'Apakah jenis luluhawa yang berlaku apabila akar tumbuhan meresap ke dalam rekahan batuan dan memecahkannya?', 'mcq', array['Luluhawa mekanikal', 'Luluhawa kimia', 'Luluhawa biologi', 'Hakisan'], 'Luluhawa biologi', 'Tindakan akar tumbuhan yang meresap ke dalam rekahan batuan dan memecahkannya ialah contoh luluhawa biologi kerana melibatkan organisma hidup.', 'easy', array['luluhawa biologi', 'akar tumbuhan']);

-- Bab 8: Gerakan Jisim (2 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (8, 'Gerakan Jisim', 'Yang manakah antara berikut merupakan jenis gerakan jisim yang paling cepat?', 'mcq', array['Rayapan tanah', 'Gelungsur tanah', 'Aliran lumpur', 'Runtuhan batu'], 'Runtuhan batu', 'Runtuhan batu (rockfall) ialah gerakan jisim yang paling pantas kerana bahan batuan jatuh secara bebas dari tebing atau cerun curam akibat graviti.', 'standard', array['gerakan jisim', 'runtuhan batu']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (8, 'Gerakan Jisim', 'Nyatakan dua faktor yang menyebabkan gelungsur tanah berlaku.', 'fill_blank', null, 'Cerun curam dan hujan lebat', 'Gelungsur tanah berlaku apabila tanah yang tepu air di cerun curam bergerak ke bawah akibat graviti. Faktor lain termasuk penyahutanan, aktiviti pembinaan, dan gempa bumi.', 'kbat', array['gelungsur tanah', 'faktor']);

-- Bab 9: Sungai (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (9, 'Sungai', 'Apakah proses sungai yang membentuk air terjun?', 'mcq', array['Pemendapan', 'Hakisan menegak', 'Pengangkutan', 'Hakisan sisi'], 'Hakisan menegak', 'Air terjun terbentuk apabila sungai menghakis batuan lembut secara menegak dengan lebih cepat daripada batuan keras, mewujudkan perbezaan aras yang curam.', 'standard', array['hakisan menegak', 'air terjun']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (9, 'Sungai', 'Dataran banjir terbentuk melalui proses ______ di bahagian ______ sungai.', 'fill_blank', null, 'pemendapan, hilir', 'Dataran banjir terbentuk apabila sungai melimpah dan mendapkan kelodak di kawasan rata di bahagian hilir. Proses ini berulang setiap kali banjir berlaku.', 'standard', array['dataran banjir', 'pemendapan']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (9, 'Sungai', 'Liku sungai (meander) terbentuk kerana gabungan proses hakisan sisi di bahagian ______ dan pemendapan di bahagian ______ sungai.', 'fill_blank', null, 'luar, dalam', 'Di bahagian luar liku, halaju air lebih deras menyebabkan hakisan sisi. Di bahagian dalam, halaju air perlahan menyebabkan pemendapan. Gabungan ini membentuk liku sungai.', 'kbat', array['liku sungai', 'hakisan sisi', 'pemendapan']);

-- Bab 10: Ombak (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (10, 'Ombak', 'Yang manakah merupakan bentuk muka bumi hasil hakisan ombak?', 'mcq', array['Tombolo', 'Gua laut', 'Tetanjung pasir', 'Pantai berpasir'], 'Gua laut', 'Gua laut terbentuk apabila ombak menghakis bahagian lemah tebing pantai secara berterusan. Hakisan membentuk lohong yang semakin besar menjadi gua.', 'easy', array['hakisan ombak', 'gua laut']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (10, 'Ombak', 'Susunkan urutan pembentukan bentuk muka bumi hakisan ombak yang betul.', 'mcq', array['Gua - Gerbang Laut - Tunggul Laut - Takuk Ombak', 'Takuk Ombak - Gua - Gerbang Laut - Tunggul Laut', 'Tunggul Laut - Gerbang Laut - Gua - Takuk Ombak', 'Gerbang Laut - Gua - Takuk Ombak - Tunggul Laut'], 'Takuk Ombak - Gua - Gerbang Laut - Tunggul Laut', 'Hakisan ombak bermula dengan membentuk takuk ombak di kaki tebing, kemudian berkembang menjadi gua. Gua yang menembusi tebing membentuk gerbang laut. Apabila gerbang runtuh, tunggul laut terbentuk.', 'kbat', array['hakisan ombak', 'urutan pembentukan']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (10, 'Ombak', 'Benar atau Salah: Tombolo terbentuk apabila bahan endapan menghubungkan daratan dengan sebuah pulau.', 'true_false', null, 'Benar', 'Tombolo ialah bentuk muka bumi pemendapan ombak yang terbentuk apabila bahan endapan seperti pasir terkumpul dan menghubungkan daratan utama dengan sebuah pulau berdekatan.', 'easy', array['tombolo', 'pemendapan ombak']);

-- Bab 11: Taburan Penduduk (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (11, 'Taburan Penduduk', 'Kawasan tanah pamah lembangan sungai biasanya mempunyai taburan penduduk yang ______.', 'mcq', array['jarang', 'padat', 'tiada penduduk', 'sama rata'], 'padat', 'Kawasan tanah pamah lembangan sungai mempunyai tanah subur, sumber air yang mencukupi, dan mudah dihubungi, menjadikannya kawasan yang padat penduduknya.', 'easy', array['taburan penduduk', 'tanah pamah']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (11, 'Taburan Penduduk', 'Yang manakah merupakan faktor manusia yang mempengaruhi taburan penduduk?', 'mcq', array['Bentuk muka bumi', 'Peluang pekerjaan', 'Iklim', 'Jenis tanah'], 'Peluang pekerjaan', 'Faktor manusia termasuk peluang pekerjaan, kemudahan pengangkutan, dan dasar kerajaan. Bentuk muka bumi, iklim, dan jenis tanah ialah faktor fizikal.', 'easy', array['taburan penduduk', 'faktor manusia']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (11, 'Taburan Penduduk', 'Jelaskan mengapa kawasan pedalaman Sarawak mempunyai taburan penduduk yang jarang.', 'fill_blank', null, 'Bentuk muka bumi bergunung-ganang, hutan tebal, dan kurang kemudahan asas', 'Kawasan pedalaman Sarawak mempunyai bentuk muka bumi yang bergunung-ganang dan diliputi hutan tebal. Kekurangan kemudahan asas, jalan raya, dan peluang pekerjaan menyebabkan penduduk kurang tertarik untuk menetap.', 'kbat', array['taburan penduduk', 'Sarawak', 'kawasan jarang']);

-- Bab 12: Pertumbuhan Penduduk (2 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (12, 'Pertumbuhan Penduduk', 'Pertambahan semula jadi penduduk dikira dengan formula ______.', 'mcq', array['Kadar kelahiran + Kadar kematian', 'Kadar kelahiran - Kadar kematian', 'Kadar imigrasi - Kadar emigrasi', 'Jumlah penduduk / Luas kawasan'], 'Kadar kelahiran - Kadar kematian', 'Pertambahan semula jadi ialah perbezaan antara kadar kelahiran dan kadar kematian dalam sesebuah negara. Jika kadar kelahiran lebih tinggi, penduduk bertambah secara semula jadi.', 'standard', array['pertambahan semula jadi', 'kadar kelahiran', 'kadar kematian']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (12, 'Pertumbuhan Penduduk', 'Piramid penduduk yang mempunyai tapak lebar dan puncak runcing menunjukkan negara yang mempunyai ______.', 'mcq', array['kadar kelahiran rendah dan jangka hayat panjang', 'kadar kelahiran tinggi dan kadar kematian tinggi', 'kadar kelahiran rendah dan kadar kematian rendah', 'penduduk tua yang ramai'], 'kadar kelahiran tinggi dan kadar kematian tinggi', 'Piramid penduduk bertapak lebar menunjukkan ramai penduduk muda (kadar kelahiran tinggi) dan puncak runcing menunjukkan sedikit penduduk tua (kadar kematian tinggi atau jangka hayat pendek). Ini tipikal negara sedang membangun.', 'standard', array['piramid penduduk', 'negara membangun']);

-- Bab 13: Migrasi (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (13, 'Migrasi', 'Yang manakah merupakan faktor penolak migrasi?', 'mcq', array['Peluang pekerjaan yang banyak', 'Kemudahan pendidikan yang lengkap', 'Bencana alam', 'Upah yang tinggi'], 'Bencana alam', 'Faktor penolak (push factor) ialah keadaan negatif yang menyebabkan penduduk berpindah dari sesuatu tempat, seperti bencana alam, kemiskinan, dan konflik.', 'easy', array['migrasi', 'faktor penolak']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (13, 'Migrasi', 'Benar atau Salah: Migrasi dalaman berlaku apabila penduduk berpindah dari satu negara ke negara lain.', 'true_false', null, 'Salah', 'Migrasi dalaman (internal migration) berlaku dalam sempadan sebuah negara sahaja, contohnya dari luar bandar ke bandar. Perpindahan ke negara lain ialah migrasi antarabangsa.', 'easy', array['migrasi dalaman', 'migrasi antarabangsa']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (13, 'Migrasi', 'Perpindahan penduduk luar bandar ke kawasan bandar di Malaysia membawa kesan positif dan negatif. Nyatakan satu kesan negatif kepada kawasan luar bandar.', 'fill_blank', null, 'Kekurangan tenaga kerja muda di kawasan luar bandar', 'Apabila penduduk muda berpindah ke bandar untuk mencari pekerjaan, kawasan luar bandar mengalami kekurangan tenaga kerja produktif. Ini menyebabkan sektor pertanian terbiar dan pembangunan terbantut.', 'kbat', array['migrasi luar bandar ke bandar', 'kesan negatif']);

-- Bab 14: Petempatan (2 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (14, 'Petempatan', 'Pola petempatan memanjang biasanya terbentuk di sepanjang ______.', 'mcq', array['puncak bukit', 'jalan raya atau sungai', 'kawasan pedalaman', 'kawasan perindustrian'], 'jalan raya atau sungai', 'Petempatan memanjang (linear) terbentuk apabila rumah dibina berturutan di sepanjang laluan pengangkutan seperti jalan raya atau tebing sungai.', 'easy', array['pola petempatan', 'memanjang']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (14, 'Petempatan', 'Apakah perbezaan antara pola petempatan berpusat dan berselerak?', 'fill_blank', null, 'Berpusat - rumah berkelompok di sekitar satu pusat; Berselerak - rumah tersebar jauh antara satu sama lain', 'Petempatan berpusat (nucleated) mempunyai rumah yang berkumpul rapat di sekitar satu titik pusat seperti pekan atau simpang jalan. Petempatan berselerak (dispersed) mempunyai rumah yang tersebar jauh antara satu sama lain, biasanya di kawasan pertanian atau pedalaman.', 'standard', array['petempatan berpusat', 'petempatan berselerak']);

-- Bab 15: Urbanisasi (3 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (15, 'Urbanisasi', 'Yang manakah antara berikut BUKAN masalah urbanisasi?', 'mcq', array['Kesesakan lalu lintas', 'Pencemaran udara', 'Peningkatan hasil pertanian', 'Kawasan setinggan'], 'Peningkatan hasil pertanian', 'Peningkatan hasil pertanian bukan masalah urbanisasi. Masalah urbanisasi termasuk kesesakan lalu lintas, pencemaran, pertumbuhan kawasan setinggan, dan kekurangan perumahan.', 'easy', array['urbanisasi', 'masalah bandar']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (15, 'Urbanisasi', 'Apakah maksud pembangunan lestari dalam konteks urbanisasi?', 'mcq', array['Pembangunan pesat tanpa had', 'Pembangunan yang memenuhi keperluan semasa tanpa menjejaskan generasi masa hadapan', 'Pembangunan di kawasan luar bandar sahaja', 'Pembangunan industri berat'], 'Pembangunan yang memenuhi keperluan semasa tanpa menjejaskan generasi masa hadapan', 'Pembangunan lestari (sustainable development) bermaksud membangunkan kawasan bandar dengan cara yang memenuhi keperluan semasa tanpa menjejaskan keupayaan generasi akan datang memenuhi keperluan mereka.', 'standard', array['pembangunan lestari', 'urbanisasi']);

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (15, 'Urbanisasi', 'Cadangkan dua langkah untuk mengurangkan masalah kesesakan lalu lintas di bandar raya.', 'fill_blank', null, 'Menambah baik pengangkutan awam dan menggalakkan perkongsian kenderaan', 'Langkah lain termasuk membina lebuh raya baharu, melaksanakan sistem MRT/LRT, mengenakan caj kesesakan, dan menggalakkan bekerja dari rumah untuk mengurangkan bilangan kenderaan di jalan raya.', 'kbat', array['urbanisasi', 'kesesakan lalu lintas', 'penyelesaian']);

-- Bab 16: Kerja Lapangan (1 soalan)

insert into geografi_questions (chapter, chapter_title, question_text, question_type, options, correct_answer, explanation, difficulty, tags)
values (16, 'Kerja Lapangan', 'Susunkan langkah kerja lapangan yang betul.', 'mcq', array['Pengumpulan data - Perancangan - Analisis - Rumusan', 'Perancangan - Pengumpulan data - Analisis - Rumusan', 'Analisis - Perancangan - Pengumpulan data - Rumusan', 'Rumusan - Analisis - Pengumpulan data - Perancangan'], 'Perancangan - Pengumpulan data - Analisis - Rumusan', 'Langkah kerja lapangan yang betul bermula dengan perancangan (menentukan tajuk, objektif, kawasan kajian), diikuti pengumpulan data di lapangan, analisis data yang diperoleh, dan akhirnya membuat rumusan.', 'standard', array['kerja lapangan', 'langkah kajian']);
