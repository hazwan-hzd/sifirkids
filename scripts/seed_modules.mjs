import { createClient } from "@supabase/supabase-js";

// Seeds the generic `module_questions` table for Sains + the other six
// subjects, across the grades each subject is offered for.
// Run `scripts/schema_modules.sql` in the Supabase SQL editor first.
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/seed_modules.mjs

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const LETTERS = ["A", "B", "C", "D", "E"];
const Q = [];

/** Multiple choice. `correct` is the 0-based index of the right option. */
function mcq(module, grade, chapter, title, text, opts, correct, explanation, difficulty = "standard") {
  Q.push({
    module,
    grade,
    chapter,
    chapter_title: title,
    question_type: "mcq",
    question_text: text,
    options: opts.map((o, i) => `${LETTERS[i]}) ${o}`),
    correct_answer: LETTERS[correct],
    explanation,
    difficulty,
  });
}

/** True / false. `answer` is true for "Betul". */
function tf(module, grade, chapter, title, text, answer, explanation, difficulty = "easy") {
  Q.push({
    module,
    grade,
    chapter,
    chapter_title: title,
    question_type: "true_false",
    question_text: text,
    options: null,
    correct_answer: answer ? "Betul" : "Salah",
    explanation,
    difficulty,
  });
}

/** Fill in the blank. */
function fb(module, grade, chapter, title, text, answer, explanation, difficulty = "standard") {
  Q.push({
    module,
    grade,
    chapter,
    chapter_title: title,
    question_type: "fill_blank",
    question_text: text,
    options: null,
    correct_answer: answer,
    explanation,
    difficulty,
  });
}

/* ================================ SAINS ================================ */
// Darjah 1
mcq("sains", "std1", 1, "Deria Kita", "Berapakah bilangan deria manusia?", ["3", "4", "5", "6"], 2, "Lima deria: penglihatan, pendengaran, bau, rasa dan sentuhan.", "easy");
mcq("sains", "std1", 1, "Deria Kita", "Kita melihat menggunakan organ apa?", ["Telinga", "Mata", "Hidung", "Lidah"], 1, "Mata ialah organ deria penglihatan.", "easy");
mcq("sains", "std1", 1, "Deria Kita", "Lidah digunakan untuk deria apa?", ["Bau", "Rasa", "Dengar", "Sentuh"], 1, "Lidah mengesan rasa manis, masin, masam dan pahit.", "easy");
tf("sains", "std1", 1, "Deria Kita", "Kita menghidu bau menggunakan hidung.", true, "Betul, hidung ialah organ deria bau.");
mcq("sains", "std1", 2, "Benda Hidup & Bukan Hidup", "Antara berikut yang manakah benda hidup?", ["Batu", "Kerusi", "Pokok", "Cawan"], 2, "Pokok membesar, bernafas dan membiak, jadi ia benda hidup.", "easy");
mcq("sains", "std1", 2, "Benda Hidup & Bukan Hidup", "Manakah benda bukan hidup?", ["Kucing", "Buku", "Burung", "Ikan"], 1, "Buku tidak membesar atau bernafas.", "easy");
tf("sains", "std1", 2, "Benda Hidup & Bukan Hidup", "Kereta ialah benda hidup.", false, "Kereta benda bukan hidup kerana ia tidak membesar atau membiak.");

// Darjah 4
mcq("sains", "std4", 1, "Proses Hidup", "Organ pernafasan manusia ialah?", ["Jantung", "Paru-paru", "Hati", "Buah pinggang"], 1, "Paru-paru mengambil oksigen dan membebaskan karbon dioksida.");
mcq("sains", "std4", 1, "Proses Hidup", "Gas yang kita sedut semasa bernafas ialah?", ["Karbon dioksida", "Oksigen", "Nitrogen", "Hidrogen"], 1, "Kita menyedut oksigen dan menghembus karbon dioksida.");
mcq("sains", "std4", 1, "Proses Hidup", "Haiwan yang bernafas menggunakan insang ialah?", ["Ayam", "Ikan", "Kucing", "Burung"], 1, "Ikan menggunakan insang untuk bernafas dalam air.");
mcq("sains", "std4", 2, "Magnet & Tenaga", "Bahan yang boleh ditarik oleh magnet ialah?", ["Kayu", "Besi", "Plastik", "Kaca"], 1, "Besi ialah bahan magnetik.");
tf("sains", "std4", 2, "Magnet & Tenaga", "Kutub magnet yang sama akan menolak antara satu sama lain.", true, "Kutub sama menolak, kutub berlainan menarik.");
mcq("sains", "std4", 2, "Magnet & Tenaga", "Sumber tenaga utama bagi Bumi ialah?", ["Bulan", "Matahari", "Bintang", "Angin"], 1, "Matahari membekalkan haba dan cahaya kepada Bumi.");
mcq("sains", "std4", 3, "Sistem Suria", "Berapakah bilangan planet dalam sistem suria?", ["7", "8", "9", "10"], 1, "Terdapat 8 planet selepas Pluto dikelaskan sebagai planet kerdil.");
mcq("sains", "std4", 3, "Sistem Suria", "Planet tempat kita tinggal ialah?", ["Marikh", "Bumi", "Zuhrah", "Musytari"], 1, "Kita tinggal di planet Bumi.", "easy");

// Tingkatan 3
mcq("sains", "form3", 1, "Genetik & Pewarisan", "Apakah unit asas pewarisan baka?", ["Sel", "Gen", "Tisu", "Organ"], 1, "Gen ialah unit pewarisan yang terletak pada kromosom.");
mcq("sains", "form3", 1, "Genetik & Pewarisan", "DNA terkandung di dalam bahagian sel yang manakah?", ["Sitoplasma", "Nukleus", "Membran sel", "Ribosom"], 1, "DNA tersimpan di dalam nukleus sebagai kromosom.");
mcq("sains", "form3", 1, "Genetik & Pewarisan", "Sindrom yang disebabkan oleh kromosom 21 tambahan ialah?", ["Albino", "Sindrom Down", "Hemofilia", "Buta warna"], 1, "Sindrom Down berlaku akibat tiga salinan kromosom 21.", "kbat");
tf("sains", "form3", 1, "Genetik & Pewarisan", "Manusia mempunyai 23 pasang kromosom.", true, "Manusia mempunyai 46 kromosom iaitu 23 pasang.");
mcq("sains", "form3", 2, "Keelektrikan", "Unit bagi arus elektrik ialah?", ["Volt", "Ampere", "Ohm", "Watt"], 1, "Arus elektrik diukur dalam ampere (A).");
mcq("sains", "form3", 2, "Keelektrikan", "Mengikut Hukum Ohm, V bersamaan dengan?", ["I/R", "IR", "R/I", "I + R"], 1, "V = IR, iaitu voltan sama dengan arus didarab rintangan.", "kbat");
mcq("sains", "form3", 2, "Keelektrikan", "Alat untuk mengukur arus elektrik ialah?", ["Voltmeter", "Ammeter", "Termometer", "Ohmmeter"], 1, "Ammeter disambung secara bersiri untuk mengukur arus.");
mcq("sains", "form3", 3, "Tindak Balas Kimia", "Tindak balas asid dengan bes (alkali) menghasilkan?", ["Garam dan air", "Gas hidrogen", "Logam", "Oksida"], 0, "Tindak balas peneutralan menghasilkan garam dan air.");
mcq("sains", "form3", 3, "Tindak Balas Kimia", "Nilai pH bagi bahan neutral ialah?", ["0", "7", "14", "1"], 1, "pH 7 ialah neutral; bawah 7 berasid, atas 7 beralkali.");
fb("sains", "form3", 3, "Tindak Balas Kimia", "Gas yang dibebaskan apabila logam bertindak balas dengan asid ialah gas ___.", "Hidrogen", "Logam + asid menghasilkan garam dan gas hidrogen.");

/* ============================== MATEMATIK ============================== */
// Darjah 1
mcq("matematik", "std1", 1, "Nombor & Operasi", "3 + 4 = ?", ["6", "7", "8", "5"], 1, "3 tambah 4 sama dengan 7.", "easy");
mcq("matematik", "std1", 1, "Nombor & Operasi", "9 - 2 = ?", ["6", "7", "8", "5"], 1, "9 tolak 2 sama dengan 7.", "easy");
mcq("matematik", "std1", 1, "Nombor & Operasi", "Nombor selepas 19 ialah?", ["18", "20", "21", "10"], 1, "Selepas 19 ialah 20.", "easy");
fb("matematik", "std1", 1, "Nombor & Operasi", "5 + 5 = ?", "10", "Lima tambah lima sama dengan sepuluh.", "easy");
mcq("matematik", "std1", 2, "Bentuk", "Bentuk yang mempunyai 3 sisi ialah?", ["Segi empat", "Segi tiga", "Bulatan", "Bujur"], 1, "Segi tiga mempunyai tiga sisi.", "easy");
mcq("matematik", "std1", 2, "Bentuk", "Berapakah bilangan sisi segi empat?", ["3", "4", "5", "6"], 1, "Segi empat mempunyai empat sisi.", "easy");
tf("matematik", "std1", 2, "Bentuk", "Bulatan mempunyai sudut.", false, "Bulatan tidak mempunyai sudut atau sisi lurus.");

// Darjah 4
mcq("matematik", "std4", 1, "Nombor Bulat", "256 + 348 = ?", ["504", "604", "594", "614"], 1, "256 + 348 = 604.");
mcq("matematik", "std4", 1, "Nombor Bulat", "12 × 8 = ?", ["86", "96", "104", "92"], 1, "12 didarab 8 sama dengan 96.");
mcq("matematik", "std4", 1, "Nombor Bulat", "Nilai digit 7 dalam nombor 4 765 ialah?", ["7", "70", "700", "7000"], 2, "Digit 7 berada di tempat ratus, jadi nilainya 700.");
fb("matematik", "std4", 1, "Nombor Bulat", "144 ÷ 12 = ?", "12", "144 dibahagi 12 sama dengan 12.");
mcq("matematik", "std4", 2, "Pecahan & Wang", "Pecahan yang setara dengan 1/2 ialah?", ["2/3", "2/4", "3/4", "1/3"], 1, "2/4 dipermudah menjadi 1/2.");
mcq("matematik", "std4", 2, "Pecahan & Wang", "RM5.00 - RM2.50 = ?", ["RM2.00", "RM2.50", "RM3.50", "RM3.00"], 1, "RM5.00 tolak RM2.50 ialah RM2.50.");
tf("matematik", "std4", 2, "Pecahan & Wang", "1/2 + 1/2 sama dengan 1.", true, "Dua bahagian setengah membentuk satu keseluruhan.");

// Tingkatan 3
mcq("matematik", "form3", 1, "Indeks & Bentuk Piawai", "2³ = ?", ["6", "8", "9", "16"], 1, "2 × 2 × 2 = 8.");
mcq("matematik", "form3", 1, "Indeks & Bentuk Piawai", "5⁰ = ?", ["0", "1", "5", "25"], 1, "Sebarang nombor kepada kuasa 0 ialah 1.");
mcq("matematik", "form3", 1, "Indeks & Bentuk Piawai", "3000 dalam bentuk piawai ialah?", ["3 × 10²", "3 × 10³", "30 × 10²", "0.3 × 10⁴"], 1, "Bentuk piawai A × 10ⁿ dengan 1 ≤ A < 10, jadi 3 × 10³.", "kbat");
mcq("matematik", "form3", 2, "Algebra & Pythagoras", "Selesaikan 2x + 6 = 14. Nilai x ialah?", ["2", "4", "6", "10"], 1, "2x = 8, maka x = 4.");
mcq("matematik", "form3", 2, "Algebra & Pythagoras", "Dalam segi tiga bersudut tegak, a² + b² bersamaan?", ["c", "2c", "c²", "c³"], 2, "Teorem Pythagoras: a² + b² = c².");
mcq("matematik", "form3", 2, "Algebra & Pythagoras", "Jika a = 3 dan b = 4, panjang hipotenus c ialah?", ["5", "7", "12", "25"], 0, "c = √(9 + 16) = √25 = 5.", "kbat");
fb("matematik", "form3", 2, "Algebra & Pythagoras", "(x + 2)(x + 3) = x² + ___x + 6. Isi tempat kosong.", "5", "Hasil darab: x² + 5x + 6.", "kbat");

/* =========================== BAHASA INGGERIS =========================== */
// Darjah 1
mcq("english", "std1", 1, "Words Around Me", 'Which animal says "meow"?', ["Dog", "Cat", "Cow", "Duck"], 1, "A cat says meow.", "easy");
mcq("english", "std1", 1, "Words Around Me", 'The opposite of "big" is ___.', ["tall", "small", "long", "wide"], 1, '"Small" is the opposite of "big".', "easy");
mcq("english", "std1", 1, "Words Around Me", 'Choose the correct word: "I ___ a boy."', ["is", "am", "are", "be"], 1, 'We say "I am".', "easy");
mcq("english", "std1", 2, "Colours & Numbers", "How many letters are in the English alphabet?", ["24", "25", "26", "27"], 2, "The English alphabet has 26 letters.");
mcq("english", "std1", 2, "Colours & Numbers", "What colour is the sky on a sunny day?", ["Green", "Blue", "Red", "Brown"], 1, "The clear sky is blue.", "easy");
fb("english", "std1", 2, "Colours & Numbers", 'Fill in: "One, two, ___, four."', "three", "The number after two is three.", "easy");

// Darjah 4
mcq("english", "std4", 1, "Grammar Basics", 'Choose the correct plural of "child".', ["childs", "childes", "children", "childer"], 2, '"Child" becomes "children".');
mcq("english", "std4", 1, "Grammar Basics", '"She ___ to school every day."', ["go", "goes", "going", "gone"], 1, 'With "she" we add -s: "goes".');
mcq("english", "std4", 1, "Grammar Basics", "Which word is a noun?", ["run", "happy", "table", "quickly"], 2, "A noun names a thing; “table” is a noun.");
mcq("english", "std4", 1, "Grammar Basics", 'The past tense of "eat" is ___.', ["eated", "ate", "eaten", "eating"], 1, 'The simple past of "eat" is "ate".');
mcq("english", "std4", 2, "Vocabulary", 'The antonym of "ancient" is ___.', ["old", "modern", "historic", "past"], 1, '"Modern" is the opposite of "ancient".');
mcq("english", "std4", 2, "Vocabulary", "A doctor works in a ___.", ["school", "hospital", "farm", "factory"], 1, "Doctors work in a hospital.", "easy");
fb("english", "std4", 2, "Vocabulary", 'The opposite of "begin" is ___.', "end", '"End" is the opposite of "begin".');

// Tingkatan 3
mcq("english", "form3", 1, "Sentence Structure", '"The cake was ___ by Ali." (passive voice)', ["eat", "ate", "eaten", "eats"], 2, "The passive uses the past participle: “eaten”.", "kbat");
mcq("english", "form3", 1, "Sentence Structure", '"If I ___ rich, I would travel the world."', ["am", "was", "were", "be"], 2, 'The second conditional uses "were" for all subjects.', "kbat");
mcq("english", "form3", 1, "Sentence Structure", 'Identify the conjunction: "I stayed home because it rained."', ["stayed", "home", "because", "rained"], 2, '"Because" joins two clauses, so it is the conjunction.');
mcq("english", "form3", 2, "Vocabulary & Idioms", '"Once in a blue moon" means ___.', ["very often", "very rarely", "at night", "never"], 1, "The idiom means something that happens very rarely.");
mcq("english", "form3", 2, "Vocabulary & Idioms", 'A synonym of "diligent" is ___.', ["lazy", "hardworking", "clever", "honest"], 1, '"Diligent" means hardworking.');
mcq("english", "form3", 2, "Vocabulary & Idioms", '"Neither of the boys ___ here." Choose the correct verb.', ["are", "is", "were", "have"], 1, '"Neither" is singular, so we use "is".', "kbat");

/* ============================ BAHASA MELAYU ============================ */
// Darjah 1
mcq("bahasamelayu", "std1", 1, "Suku Kata", 'Berapakah bilangan suku kata dalam perkataan "buku"?', ["1", "2", "3", "4"], 1, '"bu-ku" mempunyai dua suku kata.', "easy");
mcq("bahasamelayu", "std1", 1, "Suku Kata", "Antara berikut, yang manakah haiwan?", ["Meja", "Kucing", "Baju", "Pokok"], 1, "Kucing ialah seekor haiwan.", "easy");
fb("bahasamelayu", "std1", 1, "Suku Kata", "Huruf vokal ialah a, e, i, o dan ___.", "u", "Lima huruf vokal: a, e, i, o, u.", "easy");
mcq("bahasamelayu", "std1", 2, "Ayat Mudah", 'Lengkapkan: "Saya ___ nasi."', ["makan", "meja", "merah", "besar"], 0, '"Makan" ialah kata kerja yang sesuai.', "easy");
mcq("bahasamelayu", "std1", 2, "Ayat Mudah", 'Lawan kata bagi "tinggi" ialah?', ["besar", "rendah", "panjang", "gemuk"], 1, '"Rendah" ialah lawan bagi "tinggi".', "easy");

// Darjah 4
mcq("bahasamelayu", "std4", 1, "Kata Nama & Kata Kerja", '"Kucing" tergolong dalam kata?', ["kerja", "nama", "adjektif", "sendi"], 1, "Kucing ialah kata nama (benda).");
mcq("bahasamelayu", "std4", 1, "Kata Nama & Kata Kerja", 'Kata kerja dalam ayat "Ali berlari di padang" ialah?', ["Ali", "berlari", "di", "padang"], 1, '"Berlari" ialah perbuatan, jadi ia kata kerja.');
mcq("bahasamelayu", "std4", 1, "Kata Nama & Kata Kerja", "Kata ganti nama diri pertama ialah?", ["dia", "saya", "kamu", "mereka"], 1, '"Saya" merujuk diri sendiri (orang pertama).');
mcq("bahasamelayu", "std4", 2, "Imbuhan & Sinonim", 'Imbuhan awalan "me" + "tulis" menjadi?', ["menulis", "bertulis", "tertulis", "ditulis"], 0, '"me" + "tulis" = "menulis".');
mcq("bahasamelayu", "std4", 2, "Imbuhan & Sinonim", 'Sinonim bagi "pandai" ialah?', ["bodoh", "cerdik", "malas", "lemah"], 1, '"Cerdik" sama maksud dengan "pandai".');
fb("bahasamelayu", "std4", 2, "Imbuhan & Sinonim", 'Antonim bagi "rajin" ialah ___.', "malas", '"Malas" ialah lawan bagi "rajin".');

// Tingkatan 3
mcq("bahasamelayu", "form3", 1, "Tatabahasa", 'Kata sendi nama dalam "Dia pergi ke sekolah" ialah?', ["Dia", "pergi", "ke", "sekolah"], 2, '"Ke" ialah kata sendi nama yang menunjuk arah/tempat.');
mcq("bahasamelayu", "form3", 1, "Tatabahasa", 'Ayat "Pergi dari sini!" ialah jenis ayat?', ["penyata", "tanya", "perintah", "seruan"], 2, "Ayat yang memberi arahan ialah ayat perintah.");
mcq("bahasamelayu", "form3", 1, "Tatabahasa", 'Penjodoh bilangan yang sesuai untuk "buku" ialah?', ["ekor", "naskhah", "biji", "batang"], 1, 'Penjodoh bilangan buku ialah "naskhah".', "kbat");
mcq("bahasamelayu", "form3", 2, "Peribahasa", '"Bagai aur dengan tebing" bermaksud?', ["bermusuhan", "saling membantu", "berbeza", "sombong"], 1, "Peribahasa ini bermaksud saling bantu-membantu.");
mcq("bahasamelayu", "form3", 2, "Peribahasa", 'Maksud "ringan tulang" ialah?', ["malas", "rajin bekerja", "lemah", "sakit"], 1, '"Ringan tulang" bermaksud rajin membuat kerja.');
fb("bahasamelayu", "form3", 2, "Peribahasa", 'Bentuk jamak (penggandaan) bagi "buku" ialah ___.', "buku-buku", "Penggandaan penuh menunjukkan jamak: buku-buku.");

/* =========================== PENDIDIKAN ISLAM =========================== */
// Darjah 1
mcq("pendidikanislam", "std1", 1, "Rukun Islam", "Berapakah bilangan rukun Islam?", ["3", "4", "5", "6"], 2, "Rukun Islam ada lima.", "easy");
mcq("pendidikanislam", "std1", 1, "Rukun Islam", "Rukun Islam yang pertama ialah?", ["Solat", "Puasa", "Mengucap dua kalimah syahadah", "Zakat"], 2, "Rukun pertama ialah mengucap dua kalimah syahadah.");
mcq("pendidikanislam", "std1", 1, "Rukun Islam", "Umat Islam menunaikan solat fardu berapa kali sehari?", ["3", "4", "5", "6"], 2, "Solat fardu lima waktu sehari semalam.", "easy");
mcq("pendidikanislam", "std1", 2, "Akhlak", "Sebelum makan kita digalakkan membaca?", ["Bismillah", "Alhamdulillah", "Subhanallah", "Allahuakbar"], 0, 'Kita membaca "Bismillah" sebelum makan.', "easy");
tf("pendidikanislam", "std1", 2, "Akhlak", "Kita perlu memberi salam apabila bertemu rakan.", true, "Memberi salam ialah amalan yang dituntut.");
mcq("pendidikanislam", "std1", 2, "Akhlak", "Bahasa al-Quran ialah bahasa?", ["Melayu", "Inggeris", "Arab", "Urdu"], 2, "Al-Quran diturunkan dalam bahasa Arab.", "easy");

// Darjah 4
mcq("pendidikanislam", "std4", 1, "Rukun Iman & Ibadah", "Berapakah bilangan rukun Iman?", ["5", "6", "4", "3"], 1, "Rukun Iman ada enam.");
mcq("pendidikanislam", "std4", 1, "Rukun Iman & Ibadah", "Solat yang mempunyai empat rakaat ialah?", ["Subuh", "Maghrib", "Zohor", "Witir"], 2, "Zohor, Asar dan Isyak mempunyai empat rakaat.");
mcq("pendidikanislam", "std4", 1, "Rukun Iman & Ibadah", "Kitab yang diturunkan kepada Nabi Muhammad SAW ialah?", ["Taurat", "Injil", "Zabur", "Al-Quran"], 3, "Al-Quran diturunkan kepada Nabi Muhammad SAW.");
mcq("pendidikanislam", "std4", 2, "Sirah", "Nabi Muhammad SAW dilahirkan di kota?", ["Madinah", "Mekah", "Taif", "Baghdad"], 1, "Baginda dilahirkan di Kota Mekah.");
fb("pendidikanislam", "std4", 2, "Sirah", "Umat Islam berpuasa pada bulan ___.", "Ramadan", "Puasa wajib dilakukan pada bulan Ramadan.");
mcq("pendidikanislam", "std4", 2, "Sirah", "Bilangan rakaat bagi solat Subuh ialah?", ["2", "3", "4", "5"], 0, "Solat Subuh dua rakaat.", "easy");

// Tingkatan 3
mcq("pendidikanislam", "form3", 1, "Akidah & Ibadah", 'Sifat wajib bagi Allah yang bermaksud "berkuasa" ialah?', ["Wujud", "Qudrat", "Ilmu", "Hayat"], 1, "Qudrat bermaksud Allah Maha Berkuasa.");
mcq("pendidikanislam", "form3", 1, "Akidah & Ibadah", "Hukum menunaikan solat fardu lima waktu ialah?", ["sunat", "harus", "wajib", "makruh"], 2, "Solat fardu hukumnya wajib ke atas setiap mukalaf.");
mcq("pendidikanislam", "form3", 1, "Akidah & Ibadah", "Berpuasa pada bulan Ramadan ialah rukun Islam yang ke?", ["2", "3", "4", "5"], 2, "Puasa Ramadan ialah rukun Islam keempat.");
mcq("pendidikanislam", "form3", 2, "Sirah & Akhlak", "Nabi Muhammad SAW berhijrah dari Mekah ke?", ["Taif", "Madinah", "Habsyah", "Syam"], 1, "Hijrah baginda ialah dari Mekah ke Madinah.");
mcq("pendidikanislam", "form3", 2, "Sirah & Akhlak", "Khalifah Islam yang pertama ialah?", ["Umar al-Khattab", "Uthman bin Affan", "Abu Bakar as-Siddiq", "Ali bin Abi Talib"], 2, "Abu Bakar as-Siddiq ialah khalifah pertama.");
tf("pendidikanislam", "form3", 2, "Sirah & Akhlak", "Zakat fitrah wajib ditunaikan sebelum solat sunat Aidilfitri.", true, "Zakat fitrah wajib dibayar sebelum solat Aidilfitri.");

/* ============================= PENDIDIKAN SIVIK ======================== */
// Darjah 4
mcq("sivik", "std4", 1, "Nilai & Tanggungjawab", "Apakah yang patut kita lakukan dengan sampah?", ["Buang merata-rata", "Buang ke dalam tong sampah", "Bakar di mana-mana", "Biarkan sahaja"], 1, "Sampah perlu dibuang ke dalam tong sampah.", "easy");
mcq("sivik", "std4", 1, "Nilai & Tanggungjawab", "Apabila kita menolong rakan, kita mengamalkan nilai?", ["Sombong", "Tolong-menolong", "Tamak", "Malas"], 1, "Membantu rakan ialah nilai tolong-menolong.", "easy");
tf("sivik", "std4", 1, "Nilai & Tanggungjawab", "Kita perlu menghormati guru di sekolah.", true, "Menghormati guru ialah akhlak yang baik.");
mcq("sivik", "std4", 2, "Negaraku", "Bendera Malaysia dikenali sebagai?", ["Jalur Gemilang", "Bulan Bintang", "Sang Saka", "Negaraku"], 0, "Bendera Malaysia dipanggil Jalur Gemilang.");
mcq("sivik", "std4", 2, "Negaraku", "Lagu kebangsaan Malaysia ialah?", ["Jalur Gemilang", "Negaraku", "Keranamu Malaysia", "Tanggal 31"], 1, "Lagu kebangsaan kita ialah Negaraku.", "easy");
mcq("sivik", "std4", 2, "Negaraku", "Berapakah bilangan jalur pada bendera Malaysia?", ["11", "13", "14", "16"], 2, "Terdapat 14 jalur mewakili 13 negeri dan Kerajaan Persekutuan.");

// Tingkatan 3
mcq("sivik", "form3", 1, "Hak & Tanggungjawab", "Antara hak setiap kanak-kanak ialah hak untuk?", ["bekerja", "pendidikan", "mengundi", "memandu"], 1, "Setiap kanak-kanak berhak mendapat pendidikan.");
mcq("sivik", "form3", 1, "Hak & Tanggungjawab", "Tanggungjawab seorang warganegara termasuk?", ["mengelak cukai", "mematuhi undang-undang", "membuang sampah merata", "ponteng kerja"], 1, "Mematuhi undang-undang ialah tanggungjawab warganegara.");
tf("sivik", "form3", 1, "Hak & Tanggungjawab", "Perpaduan kaum penting untuk keamanan dan kemakmuran negara.", true, "Perpaduan menjamin keharmonian negara berbilang kaum.");
mcq("sivik", "form3", 2, "Kewarganegaraan", "Berapakah umur layak mengundi di Malaysia?", ["18", "21", "25", "17"], 0, "Selepas pindaan Undi18, umur mengundi ialah 18 tahun.");
mcq("sivik", "form3", 2, "Kewarganegaraan", "Prinsip pertama Rukun Negara ialah?", ["Kedaulatan Undang-undang", "Kepercayaan kepada Tuhan", "Kesopanan dan Kesusilaan", "Keluhuran Perlembagaan"], 1, "Prinsip pertama ialah Kepercayaan kepada Tuhan.");
mcq("sivik", "form3", 2, "Kewarganegaraan", "Berapakah bilangan prinsip Rukun Negara?", ["3", "4", "5", "6"], 2, "Rukun Negara mempunyai lima prinsip.");

/* =============================== GEOGRAFI ============================== */
// Tingkatan 3 only
mcq("geografi", "form3", 1, "Bumi & Peta", "Garisan khayalan yang membahagi Bumi kepada utara dan selatan ialah?", ["Garisan Tropika", "Garisan Khatulistiwa", "Meridian Greenwich", "Garisan Tarikh"], 1, "Garisan Khatulistiwa (0°) membahagi Bumi kepada hemisfera utara dan selatan.");
mcq("geografi", "form3", 1, "Bumi & Peta", "Alat yang digunakan untuk menentukan arah ialah?", ["Jangka sudut", "Kompas", "Pembaris", "Termometer"], 1, "Kompas menunjukkan arah berdasarkan kemagnetan Bumi.", "easy");
mcq("geografi", "form3", 1, "Bumi & Peta", "Matahari terbit dari arah?", ["Utara", "Selatan", "Timur", "Barat"], 2, "Matahari sentiasa terbit di sebelah timur.", "easy");
tf("geografi", "form3", 1, "Bumi & Peta", "Skala peta menunjukkan hubungan jarak pada peta dengan jarak sebenar di atas bumi.", true, "Skala membolehkan kita mengira jarak sebenar daripada peta.");
mcq("geografi", "form3", 2, "Cuaca & Iklim", "Alat yang digunakan untuk mengukur suhu ialah?", ["Barometer", "Termometer", "Higrometer", "Anemometer"], 1, "Termometer mengukur suhu udara.", "easy");
mcq("geografi", "form3", 2, "Cuaca & Iklim", "Alat untuk mengukur kelajuan angin ialah?", ["Termometer", "Anemometer", "Tolok hujan", "Barometer"], 1, "Anemometer mengukur kelajuan angin.");
mcq("geografi", "form3", 2, "Cuaca & Iklim", "Malaysia mengalami jenis iklim?", ["Gurun", "Khatulistiwa", "Mediterranean", "Tundra"], 1, "Malaysia beriklim Khatulistiwa: panas dan lembap sepanjang tahun.");
mcq("geografi", "form3", 2, "Cuaca & Iklim", "Angin monsun yang membawa hujan lebat ke Pantai Timur Semenanjung ialah?", ["Monsun Barat Daya", "Monsun Timur Laut", "Angin darat", "Angin laut"], 1, "Monsun Timur Laut (Nov–Mac) membawa hujan lebat ke Pantai Timur.", "kbat");

/* ================================ INSERT ================================ */
async function main() {
  console.log(`Prepared ${Q.length} questions across ${new Set(Q.map((q) => q.module)).size} subjects.`);

  const batchSize = 25;
  let inserted = 0;
  for (let i = 0; i < Q.length; i += batchSize) {
    const batch = Q.slice(i, i + batchSize);
    const { error } = await supabase.from("module_questions").insert(batch);
    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length}`);
    }
  }
  console.log(`Done. ${inserted}/${Q.length} questions inserted.`);
}

main();
