import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// 104 NEW questions: 13 per chapter, focusing on gaps identified in audit
const NEW_QUESTIONS = [
  // ============================================================
  // BAB 1: KEDATANGAN KUASA BARAT (13 new questions)
  // ============================================================
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah faktor utama yang mendorong kuasa Barat untuk menguasai negara kita pada abad ke-19 dan ke-20?",
    options: ["A) Penyebaran budaya", "B) Perkembangan Revolusi Perindustrian", "C) Keperluan tenaga buruh", "D) Persaingan politik dalaman"],
    correct_answer: "B",
    explanation: "Revolusi Perindustrian yang bermula di Britain memerlukan bahan mentah dan pasaran baharu, mendorong kuasa Barat mencari tanah jajahan.",
    tags: ["1.2", "revolusi-perindustrian"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Antara berikut, yang manakah hasil bumi yang sangat diperlukan oleh negara Barat bagi industri mengetin makanan?",
    options: ["A) Emas", "B) Bijih timah", "C) Getah", "D) Perak"],
    correct_answer: "B",
    explanation: "Bijih timah digunakan dalam industri mengetin makanan di Eropah. Getah pula digunakan untuk membuat tayar.",
    tags: ["1.2", "bijih-timah"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Perkembangan industri kereta di Eropah telah menyebabkan peningkatan permintaan terhadap getah asli. Mengapakah getah diperlukan?",
    options: ["A) Untuk membuat badan kereta", "B) Untuk menghasilkan tayar", "C) Untuk bahan bakar enjin", "D) Untuk sistem brek kenderaan"],
    correct_answer: "B",
    explanation: "Getah diperlukan untuk menghasilkan tayar kenderaan dan juga sebagai penebat elektrik.",
    tags: ["1.2", "getah"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah kepentingan pembukaan Terusan Suez kepada kuasa-kuasa Barat?",
    options: ["A) Mempercepatkan urusan perdagangan antara Barat dan Timur", "B) Menjadi pusat perlindungan kapal-kapal perang", "C) Memudahkan penyebaran agama Kristian", "D) Menghubungkan pelabuhan-pelabuhan di Tanah Melayu"],
    correct_answer: "A",
    explanation: "Pembukaan Terusan Suez memendekkan laluan perdagangan antara Eropah dan Asia Tenggara.",
    tags: ["1.2", "terusan-suez"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Mengapakah kuasa Barat memerlukan pelabuhan persinggahan di Alam Melayu?",
    options: ["A) Mendapatkan bekalan air dan makanan", "B) Menyebarkan agama Kristian", "C) Meluaskan empayar perdagangan", "D) Membina pangkalan tentera"],
    correct_answer: "A",
    explanation: "Pelayaran jauh memerlukan pelabuhan persinggahan untuk mendapatkan bekalan air, makanan, dan membaiki kapal.",
    tags: ["1.1", "pelabuhan"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah kesan utama Revolusi Perindustrian terhadap dasar kuasa-kuasa Barat di Alam Melayu?",
    options: ["A) Membantu ekonomi penduduk tempatan", "B) Menjadikan Alam Melayu sebagai pusat penyebaran agama", "C) Mendorong mereka mencari tanah jajahan untuk mendapatkan bahan mentah", "D) Menggalakkan pertukaran budaya antara Barat dan Timur"],
    correct_answer: "C",
    explanation: "Revolusi Perindustrian meningkatkan keperluan bahan mentah, mendorong kuasa Barat mencari tanah jajahan.",
    tags: ["1.2", "revolusi-perindustrian"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Bagaimanakah usaha generasi muda masa kini dalam mengekalkan kedaulatan tanah air daripada diganggu gugat oleh kuasa asing?",
    options: ["A) Mengamalkan budaya Barat sepenuhnya", "B) Menguasai ilmu pengetahuan dan meningkatkan kemahiran sains dan teknologi", "C) Bergantung sepenuhnya kepada bantuan negara lain", "D) Mengasingkan diri daripada hubungan antarabangsa"],
    correct_answer: "B",
    explanation: "Generasi muda perlu menguasai ilmu dan teknologi untuk memastikan kedaulatan negara terpelihara.",
    tags: ["1.4", "kbat"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "true_false", difficulty: "easy",
    question_text: "Revolusi Perindustrian bermula di Perancis pada abad ke-17.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Revolusi Perindustrian bermula di Britain (England), bukan Perancis.",
    tags: ["1.2", "revolusi-perindustrian"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "true_false", difficulty: "standard",
    question_text: "Bijih timah diperlukan oleh industri Eropah untuk menghasilkan tayar kenderaan.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Bijih timah digunakan untuk industri mengetin makanan. GETAH yang digunakan untuk menghasilkan tayar.",
    tags: ["1.2", "common-trap"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "Pembukaan ________ telah memendekkan laluan perdagangan antara Eropah dan Asia.",
    options: [],
    correct_answer: "Terusan Suez",
    explanation: "Terusan Suez dibuka untuk memendekkan laluan dari Eropah ke Asia tanpa perlu mengelilingi Afrika.",
    tags: ["1.2", "terusan-suez"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "Ciptaan ________ dan telegraf pada abad ke-19 telah memudahkan komunikasi dan pengangkutan kuasa Barat.",
    options: [],
    correct_answer: "kapal wap",
    explanation: "Kapal wap dan telegraf merupakan hasil Revolusi Perindustrian yang memudahkan kuasa Barat meluaskan pengaruh.",
    tags: ["1.2", "teknologi"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Slogan 'Beban Orang Putih' (White Man's Burden) merujuk kepada kepercayaan kuasa Barat bahawa mereka:",
    options: ["A) Perlu membayar cukai kepada raja tempatan", "B) Bertanggungjawab membawa tamadun kepada bangsa lain", "C) Perlu melarikan diri dari Eropah", "D) Bertanggungjawab menjaga alam sekitar"],
    correct_answer: "B",
    explanation: "White Man's Burden ialah slogan yang menunjukkan kepercayaan kuasa Barat bahawa mereka perlu 'membantu' bangsa lain yang dianggap tidak bertamadun.",
    tags: ["1.2", "ideologi"]
  },
  {
    chapter: 1, chapter_title: "Kedatangan Kuasa Barat",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Mengapakah permintaan terhadap bijih timah meningkat secara mendadak di Eropah pada abad ke-19?",
    options: ["A) Kegunaan dalam industri kereta", "B) Kegunaan dalam industri mengetin makanan", "C) Kegunaan untuk membuat barangan perhiasan", "D) Kegunaan sebagai bahan api utama"],
    correct_answer: "B",
    explanation: "Industri mengetin makanan berkembang pesat di Eropah, meningkatkan permintaan terhadap bijih timah sebagai bahan utama tin.",
    tags: ["1.2", "bijih-timah"]
  },

  // ============================================================
  // BAB 2: PENTADBIRAN NNS (13 new questions)
  // ============================================================
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah taktik yang digunakan oleh Francis Light untuk menduduki Pulau Pinang pada tahun 1786?",
    options: ["A) Pakatan dengan Belanda", "B) Manipulasi politik", "C) Tipu helah", "D) Kekerasan tentera"],
    correct_answer: "C",
    explanation: "Francis Light menggunakan tipu helah - berjanji membantu Sultan Kedah menghadapi ancaman Siam dan Bugis tetapi tidak menunaikan janji tersebut.",
    tags: ["2.1", "francis-light", "common-trap"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Mengapakah Sultan Kedah membenarkan Francis Light menduduki Pulau Pinang?",
    options: ["A) Ingin menjadikan Pulau Pinang sebagai pelabuhan bebas", "B) Memerlukan bantuan tentera SHTI untuk menghadapi ancaman Siam dan Bugis", "C) Ingin menjalin hubungan persahabatan dengan British", "D) Mendapat tekanan daripada pedagang luar"],
    correct_answer: "B",
    explanation: "Sultan Abdullah memerlukan bantuan ketenteraan British melalui SHTI untuk menghadapi ancaman dari Siam dan Bugis.",
    tags: ["2.1", "pulau-pinang"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah strategi yang digunakan oleh Stamford Raffles untuk menguasai Singapura pada tahun 1819?",
    options: ["A) Memanipulasi krisis pewarisan takhta Kesultanan Johor Riau", "B) Menandatangani perjanjian dengan Belanda", "C) Membeli Singapura daripada Temenggung Abdul Rahman", "D) Menyerang Singapura secara terbuka"],
    correct_answer: "A",
    explanation: "Raffles menggunakan manipulasi politik - memanfaatkan krisis pewarisan takhta Kesultanan Johor-Riau untuk mendapatkan Singapura.",
    tags: ["2.1", "raffles", "common-trap"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah kesan utama Perjanjian London 1824 terhadap Alam Melayu?",
    options: ["A) Penyatuan pentadbiran Tanah Melayu", "B) Perpecahan empayar Kesultanan Johor-Riau", "C) Kejatuhan pengaruh Belanda di Indonesia", "D) Pembubaran Negeri-Negeri Selat"],
    correct_answer: "B",
    explanation: "Perjanjian London 1824 memecahkan Alam Melayu kepada dua zon pengaruh - British (utara) dan Belanda (selatan).",
    tags: ["2.2", "perjanjian-london"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Mengapakah British membentuk Negeri-Negeri Selat (NNS) pada tahun 1826?",
    options: ["A) Untuk memajukan ekonomi penduduk tempatan", "B) Untuk menamatkan persaingan dengan Siam", "C) Untuk menjimatkan perbelanjaan dan menyeragamkan pentadbiran", "D) Untuk menghalang kemasukan buruh luar"],
    correct_answer: "C",
    explanation: "NNS dibentuk untuk menjimatkan kos pentadbiran dan menyeragamkan sistem pentadbiran tiga wilayah British.",
    tags: ["2.3", "nns"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Mengapakah pusat pentadbiran Negeri-Negeri Selat dipindahkan dari Pulau Pinang ke Singapura pada tahun 1832?",
    options: ["A) Singapura lebih dekat dengan London", "B) Singapura mempunyai kedudukan strategik dan ekonomi yang lebih maju", "C) Pulau Pinang diserang oleh Siam", "D) Gabenor NNS berasal dari Singapura"],
    correct_answer: "B",
    explanation: "Singapura mempunyai kedudukan yang lebih strategik untuk perdagangan dan ekonomi yang berkembang lebih pesat.",
    tags: ["2.3", "singapura"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Apakah perbezaan strategi antara Francis Light dan Stamford Raffles dalam mendapatkan wilayah di Alam Melayu?",
    options: ["A) Light menggunakan kekerasan, Raffles menggunakan diplomasi", "B) Light menggunakan tipu helah, Raffles menggunakan manipulasi politik", "C) Light menggunakan perjanjian sah, Raffles menggunakan penaklukan", "D) Kedua-dua menggunakan perjanjian perdagangan"],
    correct_answer: "B",
    explanation: "Francis Light menggunakan tipu helah (janji palsu bantu Sultan Kedah), manakala Raffles menggunakan manipulasi politik (krisis takhta Johor-Riau).",
    tags: ["2.1", "common-trap", "kbat"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Berdasarkan Perjanjian London 1824, Belanda menyerahkan wilayah manakah kepada British?",
    options: ["A) Singapura", "B) Melaka", "C) Pulau Pinang", "D) Jawa"],
    correct_answer: "B",
    explanation: "Belanda menyerahkan Melaka kepada British, manakala British menyerahkan Bangkahulu (Bencoolen) kepada Belanda.",
    tags: ["2.2", "perjanjian-london"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "true_false", difficulty: "standard",
    question_text: "Sebelum menjadi Crown Colony pada tahun 1867, Negeri-Negeri Selat ditadbir oleh Pejabat Tanah Jajahan London.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Sebelum 1867, NNS ditadbir oleh Syarikat Hindia Timur British (SHTI) yang berpusat di Calcutta, India.",
    tags: ["2.4", "pentadbiran"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "true_false", difficulty: "easy",
    question_text: "Perjanjian London 1824 ditandatangani pada 17 Mac 1824 di London.",
    options: ["Betul", "Salah"],
    correct_answer: "Betul",
    explanation: "Perjanjian Inggeris-Belanda (Perjanjian London) ditandatangani pada 17 Mac 1824 di London.",
    tags: ["2.2", "tarikh"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "Stamford Raffles mendapatkan Singapura dengan memanfaatkan krisis pewarisan takhta Kesultanan ________.",
    options: [],
    correct_answer: "Johor-Riau",
    explanation: "Raffles memanipulasi krisis pewarisan takhta Kesultanan Johor-Riau untuk mendapatkan Singapura pada 1819.",
    tags: ["2.1", "raffles"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "Pusat pentadbiran NNS dipindahkan dari Pulau Pinang ke ________ pada tahun 1832.",
    options: [],
    correct_answer: "Singapura",
    explanation: "Singapura menjadi pusat pentadbiran NNS kerana kedudukannya yang lebih strategik.",
    tags: ["2.3", "singapura"]
  },
  {
    chapter: 2, chapter_title: "Pentadbiran Negeri-negeri Selat",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Mengapakah pedagang-pedagang Eropah di Negeri-Negeri Selat mendesak agar NNS dijadikan Crown Colony pada tahun 1867?",
    options: ["A) Mereka ingin menghalang kemasukan pedagang Asia", "B) Mereka tidak berpuas hati dengan pentadbiran SHTI yang lambat dan tidak efisien", "C) Mereka ingin merdeka dari British", "D) Mereka ingin bersatu dengan Belanda"],
    correct_answer: "B",
    explanation: "Pedagang Eropah tidak berpuas hati kerana SHTI di India lambat membuat keputusan dan tidak memahami keperluan perdagangan tempatan.",
    tags: ["2.4", "crown-colony", "kbat"]
  },

  // ============================================================
  // BAB 3: PENTADBIRAN NNMB (13 new questions)
  // ============================================================
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Siapakah tokoh British yang mengemukakan idea penubuhan NNMB pada tahun 1892?",
    options: ["A) Sir Cecil Smith", "B) Frank Swettenham", "C) Sir Charles Mitchell", "D) Sir Hugh Low"],
    correct_answer: "B",
    explanation: "Frank Swettenham mencadangkan pembentukan NNMB dan kemudian menjadi Residen Jeneral yang pertama.",
    tags: ["3.3", "frank-swettenham"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "easy",
    question_text: "Apakah jawatan yang disandang oleh Frank Swettenham selepas pembentukan NNMB pada 1 Julai 1896?",
    options: ["A) Gabenor Negeri-Negeri Selat", "B) Residen British di Perak", "C) Residen Jeneral yang pertama", "D) Pesuruhjaya Tinggi British"],
    correct_answer: "C",
    explanation: "Frank Swettenham dilantik sebagai Residen Jeneral NNMB yang pertama (1896-1901).",
    tags: ["3.3", "frank-swettenham"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Mengapakah British menubuhkan Durbar pada tahun 1897?",
    options: ["A) Untuk menggubal undang-undang persekutuan", "B) Untuk menamatkan sistem Residen", "C) Untuk mendapat sokongan Raja-Raja Melayu terhadap NNMB", "D) Untuk melantik Residen Jeneral yang baru"],
    correct_answer: "C",
    explanation: "Durbar ditubuhkan sebagai platform British untuk mendapatkan sokongan dan kerjasama Raja-Raja Melayu.",
    tags: ["3.4", "durbar"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Siapakah yang mempengerusikan persidangan Durbar?",
    options: ["A) Residen Jeneral", "B) Sultan Perak", "C) Pesuruhjaya Tinggi British", "D) Setiausaha Persekutuan"],
    correct_answer: "C",
    explanation: "Durbar dipengerusikan oleh Pesuruhjaya Tinggi British, BUKAN Residen Jeneral.",
    tags: ["3.4", "durbar", "common-trap"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "easy",
    question_text: "Di manakah persidangan Durbar pertama diadakan pada tahun 1897?",
    options: ["A) Kuala Lumpur", "B) Taiping", "C) Kuala Kangsar", "D) Seremban"],
    correct_answer: "C",
    explanation: "Durbar pertama diadakan di Kuala Kangsar, Perak pada tahun 1897.",
    tags: ["3.4", "durbar"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Selepas pembentukan NNMB, kuasa perundangan Majlis Mesyuarat Negeri telah terhakis kerana diambil alih oleh:",
    options: ["A) Residen Jeneral", "B) Pembesar tempatan", "C) Pesuruhjaya Tinggi", "D) Raja-Raja Melayu"],
    correct_answer: "A",
    explanation: "Residen Jeneral mengambil alih banyak kuasa yang sebelumnya dipegang oleh Majlis Mesyuarat Negeri.",
    tags: ["3.4", "residen-jeneral"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "easy",
    question_text: "Mengapakah pembesar Melayu tidak berpuas hati dengan Sistem Residen?",
    options: ["A) British menghapuskan sistem beraja", "B) Pembesar kehilangan hak memungut cukai", "C) British tidak membina jalan raya", "D) Residen gagal memajukan ekonomi negeri"],
    correct_answer: "B",
    explanation: "Pembesar Melayu kehilangan hak memungut cukai dan pendapatan yang selama ini menjadi sumber ekonomi mereka.",
    tags: ["3.2", "ketidakpuasan"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "easy",
    question_text: "Apakah kepentingan bijih timah dan getah kepada ekonomi negeri-negeri Melayu pada abad ke-19?",
    options: ["A) Menjadi bahan makanan utama rakyat", "B) Menarik minat British untuk campur tangan", "C) Digunakan untuk membina istana raja", "D) Dieksport ke negara-negara Asia sahaja"],
    correct_answer: "B",
    explanation: "Kekayaan hasil bumi terutama bijih timah dan getah menarik minat British untuk campur tangan di negeri-negeri Melayu.",
    tags: ["3.1", "hasil-bumi"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Apakah perkara yang TIDAK tertakluk di bawah nasihat Residen dalam pentadbiran NNMB?",
    options: ["A) Kewangan negeri", "B) Agama Islam dan adat istiadat Melayu", "C) Perundangan tanah", "D) Pentadbiran jabatan kerajaan"],
    correct_answer: "B",
    explanation: "Residen boleh menasihat dalam semua hal KECUALI agama Islam dan adat istiadat Melayu.",
    tags: ["3.4", "sistem-residen"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "true_false", difficulty: "standard",
    question_text: "Durbar dipengerusikan oleh Residen Jeneral NNMB.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Durbar dipengerusikan oleh PESURUHJAYA TINGGI British, bukan Residen Jeneral.",
    tags: ["3.4", "durbar", "common-trap"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "true_false", difficulty: "easy",
    question_text: "NNMB ditubuhkan pada tahun 1896 dan terdiri daripada Perak, Selangor, Negeri Sembilan, dan Pahang.",
    options: ["Betul", "Salah"],
    correct_answer: "Betul",
    explanation: "NNMB (1 Julai 1896) menggabungkan empat negeri Melayu yang telah menerima Residen British.",
    tags: ["3.3", "nnmb"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "________ ialah Residen Jeneral pertama NNMB yang dilantik pada tahun 1896.",
    options: [],
    correct_answer: "Frank Swettenham",
    explanation: "Frank Swettenham mencadangkan pembentukan NNMB dan menjadi Residen Jeneral pertamanya.",
    tags: ["3.3", "frank-swettenham"]
  },
  {
    chapter: 3, chapter_title: "Pentadbiran Negeri-negeri Melayu Bersekutu",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "Persidangan Durbar pertama diadakan di ________ pada tahun 1897.",
    options: [],
    correct_answer: "Kuala Kangsar",
    explanation: "Kuala Kangsar, Perak menjadi lokasi Durbar pertama yang melibatkan Raja-Raja Melayu NNMB.",
    tags: ["3.4", "durbar"]
  },

  // ============================================================
  // BAB 4: PENTADBIRAN NNMTB (13 new questions)
  // ============================================================
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Siapakah Penasihat British pertama yang dilantik di Kelantan selepas Perjanjian Bangkok 1909?",
    options: ["A) Meadowe Frost", "B) W.A. Graham", "C) H.E. Duke", "D) Douglas Graham Campbell"],
    correct_answer: "B",
    explanation: "W.A. Graham dilantik sebagai Penasihat British pertama di Kelantan.",
    tags: ["4.2", "penasihat"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Bilakah Johor menerima Penasihat Am British?",
    options: ["A) 1909", "B) 1914", "C) 1895", "D) 1902"],
    correct_answer: "B",
    explanation: "Johor menerima Penasihat Am British pada tahun 1914, menjadi negeri TERAKHIR dalam kalangan NNMTB.",
    tags: ["4.3", "johor"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Mengapakah Sultan Abu Bakar berjaya mengekalkan kemerdekaan Johor lebih lama daripada negeri-negeri Melayu lain?",
    options: ["A) Johor mempunyai tentera yang kuat", "B) Sultan Abu Bakar menggunakan diplomasi dan memodenkan pentadbiran", "C) British tidak berminat dengan Johor", "D) Johor dilindungi oleh Siam"],
    correct_answer: "B",
    explanation: "Sultan Abu Bakar bijak menggunakan diplomasi dan memodenkan pentadbiran Johor sehingga British tidak mempunyai alasan untuk campur tangan.",
    tags: ["4.3", "sultan-abu-bakar", "kbat"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "easy",
    question_text: "Perjanjian Bangkok 1909 ditandatangani antara British dengan kuasa manakah?",
    options: ["A) Belanda", "B) Perancis", "C) Siam", "D) Jepun"],
    correct_answer: "C",
    explanation: "Perjanjian Bangkok 1909 ditandatangani antara British dan Siam (Thailand).",
    tags: ["4.2", "perjanjian-bangkok"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah perbezaan utama antara jawatan 'Penasihat' di NNMTB dengan jawatan 'Residen' di NNMB?",
    options: ["A) Penasihat mempunyai kuasa lebih besar", "B) Penasihat hanya memberi nasihat, Sultan masih mempunyai kuasa lebih besar", "C) Residen dilantik oleh Sultan, Penasihat dilantik oleh rakyat", "D) Tiada perbezaan ketara"],
    correct_answer: "B",
    explanation: "Di NNMTB, Penasihat hanya memberi nasihat dan Sultan masih mengekalkan kuasa yang lebih besar.",
    tags: ["4.4", "perbezaan", "common-trap"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "easy",
    question_text: "Negeri manakah yang BUKAN merupakan negeri yang diserahkan oleh Siam kepada British melalui Perjanjian Bangkok 1909?",
    options: ["A) Kedah", "B) Johor", "C) Kelantan", "D) Terengganu"],
    correct_answer: "B",
    explanation: "Johor BUKAN negeri yang diserahkan oleh Siam. Empat negeri yang diserahkan ialah Kedah, Perlis, Kelantan, dan Terengganu.",
    tags: ["4.2", "perjanjian-bangkok", "common-trap"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "standard",
    question_text: "Siapakah Sultan Johor yang akhirnya menerima Penasihat Am British pada tahun 1914?",
    options: ["A) Sultan Abu Bakar", "B) Sultan Ibrahim", "C) Sultan Iskandar", "D) Sultan Mahmud"],
    correct_answer: "B",
    explanation: "Sultan Ibrahim (anak Sultan Abu Bakar) akhirnya menerima Penasihat Am British pada 1914.",
    tags: ["4.3", "johor"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Perjanjian Bangkok 1909 telah dibuat TANPA rundingan dengan pemerintah tempatan. Apakah kesan tindakan ini?",
    options: ["A) Rakyat menyambut baik kedatangan British", "B) Pemerintah tempatan menunjukkan rasa tidak puas hati terhadap British", "C) Siam terus mentadbir empat negeri tersebut", "D) British berundur dari negeri-negeri utara"],
    correct_answer: "B",
    explanation: "Pemerintah tempatan kecewa kerana negeri mereka diserahkan tanpa rundingan.",
    tags: ["4.2", "perjanjian-bangkok", "kbat"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "true_false", difficulty: "standard",
    question_text: "Sultan Abu Bakar menolak Residen British di Johor pada tahun 1879 kerana baginda sudah memodenkan pentadbiran negeri.",
    options: ["Betul", "Salah"],
    correct_answer: "Betul",
    explanation: "Sultan Abu Bakar berjaya menolak Residen kerana Johor sudah mempunyai pentadbiran moden.",
    tags: ["4.3", "sultan-abu-bakar"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "true_false", difficulty: "easy",
    question_text: "Johor diserahkan oleh Siam kepada British melalui Perjanjian Bangkok 1909.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Johor BUKAN negeri yang diserahkan oleh Siam. Hanya Kedah, Perlis, Kelantan, dan Terengganu.",
    tags: ["4.2", "common-trap"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "Meadowe Frost dilantik sebagai Penasihat British pertama di negeri ________.",
    options: [],
    correct_answer: "Kedah",
    explanation: "Meadowe Frost menjadi Penasihat British pertama di Kedah selepas Perjanjian Bangkok 1909.",
    tags: ["4.2", "penasihat"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "Johor merupakan negeri ________ dalam NNMTB yang menerima Penasihat Am British.",
    options: [],
    correct_answer: "terakhir",
    explanation: "Johor menerima Penasihat Am British pada 1914, menjadikannya negeri terakhir.",
    tags: ["4.3", "johor"]
  },
  {
    chapter: 4, chapter_title: "Pentadbiran Negeri-negeri Melayu Tidak Bersekutu",
    question_type: "mcq", difficulty: "easy",
    question_text: "Siapakah Penasihat British pertama yang dilantik di Perlis?",
    options: ["A) W.A. Graham", "B) Meadowe Frost", "C) H.E. Duke", "D) Frank Swettenham"],
    correct_answer: "C",
    explanation: "H.E. Duke dilantik sebagai Penasihat British pertama di Perlis.",
    tags: ["4.2", "penasihat"]
  },

  // ============================================================
  // BAB 5: PENTADBIRAN BARAT SARAWAK/SABAH (13 new questions)
  // ============================================================
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "easy",
    question_text: "Siapakah Gabenor pertama Syarikat Berpiagam Borneo Utara British (SBUB) di Sabah?",
    options: ["A) James Brooke", "B) Baron Gustavus von Overbeck", "C) William Hood Treacher", "D) Alfred Dent"],
    correct_answer: "C",
    explanation: "William Hood Treacher dilantik sebagai Gabenor pertama SBUB.",
    tags: ["5.3", "treacher", "common-trap"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah matlamat utama pentadbiran Barat (Dinasti Brooke dan SBUB) di Sarawak dan Sabah?",
    options: ["A) Menyebarkan agama Kristian", "B) Mengaut keuntungan daripada sumber hasil", "C) Memberikan pendidikan kepada penduduk tempatan", "D) Memodenkan sistem pemerintahan tradisional"],
    correct_answer: "B",
    explanation: "Matlamat utama Brooke dan SBUB ialah mengaut keuntungan daripada sumber kekayaan Sarawak dan Sabah.",
    tags: ["5.2", "matlamat"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "standard",
    question_text: "Dinasti Brooke mengamalkan dasar pecah dan perintah di Sarawak. Kaum manakah yang dipertanggungjawabkan dalam bidang keselamatan?",
    options: ["A) Melayu", "B) Cina", "C) Iban", "D) Bidayuh"],
    correct_answer: "C",
    explanation: "Dalam dasar pecah dan perintah Brooke: Melayu = pentadbiran, Iban = keselamatan, Cina = ekonomi.",
    tags: ["5.4", "pecah-perintah"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "easy",
    question_text: "Dalam dasar pecah dan perintah Brooke, golongan manakah yang diberikan peranan dalam bidang ekonomi?",
    options: ["A) Melayu", "B) Cina", "C) Iban", "D) Kayan"],
    correct_answer: "B",
    explanation: "Kaum Cina diberikan peranan dalam bidang ekonomi dan perniagaan.",
    tags: ["5.4", "pecah-perintah"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah syarat utama yang perlu dipatuhi oleh SBUB selepas menerima Piagam Diraja?",
    options: ["A) Menjadikan Sabah sebagai tanah jajahan British sepenuhnya", "B) Menerima Penasihat British dan mentadbir dengan adil", "C) Menghapuskan semua adat resam penduduk tempatan", "D) Membenarkan syarikat asing lain beroperasi di Sabah"],
    correct_answer: "B",
    explanation: "SBUB perlu menerima Penasihat British, memelihara adat resam dan agama penduduk tempatan.",
    tags: ["5.3", "piagam-diraja"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "standard",
    question_text: "Mengapakah Dinasti Brooke dan SBUB mengekalkan golongan elit tempatan dalam sistem pentadbiran?",
    options: ["A) Kekurangan pegawai Eropah yang berpengalaman", "B) Desakan daripada kerajaan British", "C) Ingin menghapuskan sistem beraja", "D) Untuk membolehkan pembesar mengutip cukai sendiri"],
    correct_answer: "A",
    explanation: "Bilangan pegawai Eropah yang terhad menyebabkan Brooke dan SBUB mengekalkan golongan elit tempatan.",
    tags: ["5.4", "pentadbiran"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "easy",
    question_text: "Siapakah dua tokoh yang bertanggungjawab mendapatkan hak wilayah Sabah sebelum penubuhan SBUB?",
    options: ["A) James Brooke dan Charles Brooke", "B) Baron von Overbeck dan Alfred Dent", "C) William Hood Treacher dan Francis Light", "D) Frank Swettenham dan Hugh Low"],
    correct_answer: "B",
    explanation: "Baron von Overbeck dan Alfred Dent memperoleh hak wilayah Sabah daripada Sultan Brunei dan Sultan Sulu.",
    tags: ["5.3", "overbeck-dent"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Apakah persamaan strategi Dinasti Brooke di Sarawak dan SBUB di Sabah untuk meluaskan pengaruh?",
    options: ["A) Kedua-dua menggunakan kekerasan tentera sepenuhnya", "B) Kedua-dua mendapat hak daripada Kesultanan Brunei melalui perjanjian", "C) Kedua-dua dipilih oleh penduduk tempatan", "D) Kedua-dua mendapat kuasa terus daripada London"],
    correct_answer: "B",
    explanation: "Kedua-dua mendapatkan hak wilayah daripada Kesultanan Brunei melalui perjanjian, pajakan, dan pembelian.",
    tags: ["5.2", "5.3", "kbat"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "true_false", difficulty: "easy",
    question_text: "Baron von Overbeck ialah Gabenor pertama SBUB di Sabah.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "William Hood Treacher yang dilantik sebagai Gabenor pertama SBUB, bukan Overbeck.",
    tags: ["5.3", "common-trap"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "true_false", difficulty: "standard",
    question_text: "Sarawak dibahagikan kepada 5 bahagian (division) di bawah Dinasti Brooke.",
    options: ["Betul", "Salah"],
    correct_answer: "Betul",
    explanation: "Dinasti Brooke membahagikan Sarawak kepada 5 bahagian (division) untuk tujuan pentadbiran.",
    tags: ["5.4", "sarawak"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "________ dilantik sebagai Gabenor pertama SBUB di Sabah.",
    options: [],
    correct_answer: "William Hood Treacher",
    explanation: "William Hood Treacher menjadi Gabenor pertama Syarikat Berpiagam Borneo Utara British.",
    tags: ["5.3", "treacher"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "Dalam dasar pecah dan perintah Brooke, kaum Melayu diberikan peranan dalam bidang ________.",
    options: [],
    correct_answer: "pentadbiran",
    explanation: "Melayu = pentadbiran, Iban = keselamatan, Cina = ekonomi.",
    tags: ["5.4", "pecah-perintah"]
  },
  {
    chapter: 5, chapter_title: "Pentadbiran Barat di Sarawak dan Sabah",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Bagaimanakah peluasan kuasa Dinasti Brooke memberi kesan kepada Kesultanan Brunei?",
    options: ["A) Brunei menjadi lebih kuat", "B) Wilayah Brunei semakin mengecil akibat penyerahan tanah", "C) Brunei berjaya menawan semula Sarawak", "D) Brunei dan Sarawak bergabung"],
    correct_answer: "B",
    explanation: "Peluasan Brooke secara berperingkat mengecilkan wilayah Kesultanan Brunei.",
    tags: ["5.2", "brunei", "kbat"]
  },

  // ============================================================
  // BAB 6: KESAN PENTADBIRAN BARAT (13 new questions)
  // ============================================================
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah teknik yang diperkenalkan oleh H.N. Ridley untuk memanjangkan hayat pokok getah semasa menoreh?",
    options: ["A) Sistem tanaman selingan", "B) Sistem torehan tulang ikan hering (ibedem)", "C) Sistem ladang berpusat", "D) Sistem pengairan titis"],
    correct_answer: "B",
    explanation: "H.N. Ridley memperkenalkan teknik torehan tulang ikan hering atau 'ibedem'.",
    tags: ["6.1", "ridley", "ibedem"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "easy",
    question_text: "Bandar manakah yang muncul sebagai pusat penemuan petroleum di Sarawak?",
    options: ["A) Kuching", "B) Sibu", "C) Miri", "D) Bintulu"],
    correct_answer: "C",
    explanation: "Miri menjadi pusat petroleum Sarawak.",
    tags: ["6.3", "miri"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "standard",
    question_text: "Antara berikut, yang manakah merupakan ciri ekonomi moden yang diperkenalkan oleh kuasa Barat?\n\nI. Modal besar dari luar negara\nII. Tanah luas untuk pertanian\nIII. Teknologi moden\nIV. Pengeluaran secara sara diri",
    options: ["A) I, II dan III", "B) I, II dan IV", "C) II, III dan IV", "D) I, III dan IV"],
    correct_answer: "A",
    explanation: "5 ciri ekonomi moden: modal besar, tanah luas, teknologi moden, buruh ramai, eksport. Bukan sara diri.",
    tags: ["6.1", "ekonomi-moden"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "standard",
    question_text: "Mengapakah British membawa masuk buruh dari luar ke Tanah Melayu pada awal abad ke-20?",
    options: ["A) Menggantikan penduduk tempatan", "B) Memenuhi keperluan tenaga kerja sektor ekonomi moden", "C) Menggalakkan integrasi kaum", "D) Memajukan sistem pendidikan vernakular"],
    correct_answer: "B",
    explanation: "Sektor ekonomi moden memerlukan tenaga kerja yang ramai.",
    tags: ["6.4", "imigresen"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "easy",
    question_text: "Apakah kesan utama pertambahan kemasukan buruh dari China dan India ke Tanah Melayu?",
    options: ["A) Kepupusan bahasa ibunda", "B) Kewujudan masyarakat berbilang kaum", "C) Kemerosotan ekonomi tradisional", "D) Pertambahan kuasa pembesar tempatan"],
    correct_answer: "B",
    explanation: "Kemasukan buruh dari luar mewujudkan masyarakat berbilang kaum (majmuk).",
    tags: ["6.4", "masyarakat-majmuk"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah sistem yang digunakan untuk membawa masuk buruh India ke ladang-ladang getah?",
    options: ["A) Sistem Tiket Kredit", "B) Sistem Kangani", "C) Sistem Kontrak", "D) Sistem Pajak"],
    correct_answer: "B",
    explanation: "Sistem Kangani digunakan untuk merekrut buruh India dari India Selatan.",
    tags: ["6.4", "kangani"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Mengapakah pembinaan landasan kereta api di Tanah Melayu BUKAN bertujuan membantu penduduk tempatan?",
    options: ["A) Kereta api hanya beroperasi pada waktu malam", "B) Landasan menghubungkan kawasan lombong/ladang dengan pelabuhan untuk tujuan eksport", "C) Harga tiket terlalu mahal", "D) Kereta api hanya mengangkut tentera"],
    correct_answer: "B",
    explanation: "Kereta api dibina untuk memudahkan pengangkutan bahan mentah ke pelabuhan untuk dieksport.",
    tags: ["6.3", "kereta-api", "kbat"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "easy",
    question_text: "Apakah gelaran yang diberikan kepada H.N. Ridley?",
    options: ["A) Bapa Kemerdekaan Tanah Melayu", "B) Bapa Getah Tanah Melayu", "C) Bapa Pemodenan Tanah Melayu", "D) Bapa Perladangan Tanah Melayu"],
    correct_answer: "B",
    explanation: "H.N. Ridley dikenali sebagai 'Bapa Getah Tanah Melayu'.",
    tags: ["6.1", "ridley"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "true_false", difficulty: "standard",
    question_text: "H.N. Ridley dan Hugh Low adalah orang yang sama.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "H.N. Ridley (Bapa Getah) dan Hugh Low (Residen British di Perak) adalah dua orang yang BERBEZA.",
    tags: ["6.1", "common-trap"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "true_false", difficulty: "easy",
    question_text: "Kaum India dibawa masuk ke Tanah Melayu untuk bekerja di sektor perlombongan bijih timah.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Kaum India bekerja di LADANG GETAH. Kaum Cina yang bekerja di perlombongan.",
    tags: ["6.4", "common-trap"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "H.N. Ridley memperkenalkan teknik torehan getah yang dikenali sebagai sistem ________.",
    options: [],
    correct_answer: "ibedem",
    explanation: "Sistem torehan ibedem (tulang ikan hering) diperkenalkan oleh H.N. Ridley pada 1897.",
    tags: ["6.1", "ibedem"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "Petroleum pertama ditemui di ________, Sarawak semasa pentadbiran Barat.",
    options: [],
    correct_answer: "Miri",
    explanation: "Miri menjadi pusat industri petroleum di Sarawak.",
    tags: ["6.3", "miri"]
  },
  {
    chapter: 6, chapter_title: "Kesan Pentadbiran Barat Terhadap Ekonomi dan Sosial",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Dasar pecah dan perintah British menyebabkan setiap kaum dipisahkan mengikut sektor ekonomi. Bagaimanakah dasar ini memberi kesan jangka panjang?",
    options: ["A) Memudahkan perpaduan kaum selepas merdeka", "B) Mewujudkan jurang antara kaum yang sukar dirapatkan", "C) Menjadikan semua kaum sama rata dalam ekonomi", "D) Menghapuskan perbezaan budaya"],
    correct_answer: "B",
    explanation: "Pengasingan kaum mengikut sektor ekonomi mewujudkan jurang sosial dan ekonomi antara kaum.",
    tags: ["6.4", "pecah-perintah", "kbat"]
  },

  // ============================================================
  // BAB 7: PENENTANGAN MASYARAKAT TEMPATAN (13 new questions)
  // ============================================================
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "standard",
    question_text: "Siapakah tokoh yang menentang pengambilan tanah oleh British di Terengganu?",
    options: ["A) Tok Janggut", "B) Haji Abdul Rahman Limbong", "C) Dato' Bahaman", "D) Dol Said"],
    correct_answer: "B",
    explanation: "Haji Abdul Rahman Limbong menentang pengambilan tanah di Terengganu. Tok Janggut menentang di Kelantan.",
    tags: ["7.3", "limbong", "common-trap"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "easy",
    question_text: "Tok Janggut menentang British di negeri manakah?",
    options: ["A) Terengganu", "B) Kelantan", "C) Pahang", "D) Kedah"],
    correct_answer: "B",
    explanation: "Tok Janggut menentang cukai tanah British di Pasir Puteh, Kelantan pada 1915.",
    tags: ["7.3", "tok-janggut"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah punca utama penentangan Tok Janggut di Kelantan pada tahun 1915?",
    options: ["A) British merampas tanah petani", "B) Sistem cukai tanah baharu membebankan rakyat", "C) British menghapuskan jawatan sultan", "D) British melarang adat istiadat Melayu"],
    correct_answer: "B",
    explanation: "Tok Janggut menentang sistem cukai tanah baharu yang membebankan petani.",
    tags: ["7.3", "tok-janggut"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah bentuk penentangan yang digunakan oleh masyarakat tempatan?\n\nI. Penentangan bersenjata\nII. Mencabar perjanjian\nIII. Menggunakan sistem perundangan\nIV. Mogok lapar",
    options: ["A) I, II dan III", "B) I, II dan IV", "C) II, III dan IV", "D) I, III dan IV"],
    correct_answer: "A",
    explanation: "Tiga bentuk penentangan: bersenjata, mencabar perjanjian, dan sistem perundangan.",
    tags: ["7.1", "bentuk-penentangan"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "easy",
    question_text: "Di manakah Rentap membina kubu pertahanan untuk menentang Dinasti Brooke?",
    options: ["A) Nanga Skrang", "B) Bukit Sadok", "C) Kanowit", "D) Simanggang"],
    correct_answer: "B",
    explanation: "Rentap membina kubu pertahanan di Bukit Sadok untuk menentang tentera Brooke.",
    tags: ["7.3", "rentap"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "standard",
    question_text: "Mat Salleh membina kubu pertahanan di Ranau, Sabah. Mengapakah beliau bangkit menentang SBUB?",
    options: ["A) SBUB tidak membina sekolah di Sabah", "B) SBUB mengenakan buruh paksa, cukai beras, dan campur tangan adat resam", "C) SBUB melarang agama Islam", "D) SBUB membawa masuk buruh asing"],
    correct_answer: "B",
    explanation: "Mat Salleh menentang peraturan SBUB yang membebankan: buruh paksa, cukai beras, campur tangan adat resam.",
    tags: ["7.3", "mat-salleh"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah peristiwa yang berlaku di Kanowit, Sarawak pada tahun 1859?",
    options: ["A) Pemberontakan Mat Salleh", "B) Serangan Syarif Masahor terhadap kubu Brooke", "C) Penubuhan SBUB", "D) Kedatangan James Brooke"],
    correct_answer: "B",
    explanation: "Syarif Masahor bersama Datu Patinggi Abdul Ghapur menyerang kubu Brooke di Kanowit pada 1859.",
    tags: ["7.3", "syarif-masahor"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Mengapakah penentangan masyarakat tempatan terhadap kuasa Barat akhirnya gagal?",
    options: ["A) Pemimpin tempatan tidak mempunyai semangat juang", "B) Kuasa Barat mempunyai senjata moden dan menggunakan strategi pecah dan perintah", "C) Rakyat tidak menyokong pemimpin mereka", "D) Penentangan berlaku terlalu lewat"],
    correct_answer: "B",
    explanation: "Kelebihan senjata moden dan strategi pecah dan perintah menyebabkan penentangan gagal.",
    tags: ["7.4", "faktor-kegagalan", "kbat"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Apakah nilai patriotisme yang boleh dicontohi daripada perjuangan tokoh-tokoh penentangan tempatan?",
    options: ["A) Mementingkan diri sendiri", "B) Keberanian, taat setia kepada raja dan negeri, sanggup berkorban", "C) Mengikut sahaja arahan kuasa Barat", "D) Melarikan diri ke negara lain"],
    correct_answer: "B",
    explanation: "Tokoh penentangan menunjukkan keberanian, kesetiaan, dan semangat berkorban.",
    tags: ["7.4", "kbat", "nilai"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "true_false", difficulty: "standard",
    question_text: "Haji Abdul Rahman Limbong menentang British di Kelantan kerana pengenalan cukai tanah baharu.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Haji Abdul Rahman Limbong menentang di TERENGGANU (bukan Kelantan) kerana isu pengambilan tanah.",
    tags: ["7.3", "common-trap"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "true_false", difficulty: "easy",
    question_text: "Mat Salleh terkorban pada Januari 1900 semasa menentang SBUB di Sabah.",
    options: ["Betul", "Salah"],
    correct_answer: "Betul",
    explanation: "Mat Salleh terkorban pada Januari 1900 di Tambunan.",
    tags: ["7.3", "mat-salleh"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "________ menentang pengambilan tanah oleh British di Terengganu.",
    options: [],
    correct_answer: "Haji Abdul Rahman Limbong",
    explanation: "Haji Abdul Rahman Limbong menentang pengambilan tanah oleh pihak British di Terengganu.",
    tags: ["7.3", "limbong"]
  },
  {
    chapter: 7, chapter_title: "Penentangan Masyarakat Tempatan",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "Mat Salleh membina kubu pertahanan di ________, Sabah untuk menentang SBUB.",
    options: [],
    correct_answer: "Ranau",
    explanation: "Mat Salleh membina kubu di Ranau pada 1897.",
    tags: ["7.3", "mat-salleh"]
  },

  // ============================================================
  // BAB 8: KEBIJAKSANAAN RAJA DAN PEMBESAR (13 new questions)
  // ============================================================
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Apakah tujuan utama Sultan Abu Bakar menggubal Undang-Undang Tubuh Kerajaan Johor 1895?",
    options: ["A) Menjadikan Johor sebagai jajahan British", "B) Memperkukuh kuasa pemerintahan dan menghalang kuasa asing", "C) Menggantikan sistem beraja kepada demokrasi", "D) Membina hubungan diplomatik dengan negara luar"],
    correct_answer: "B",
    explanation: "Undang-Undang Tubuh 1895 bertujuan menghalang campur tangan kuasa asing dan memperkukuh kedaulatan Johor.",
    tags: ["8.2", "uu-tubuh"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Apakah peruntukan penting dalam Undang-Undang Tubuh Kerajaan Johor 1895?",
    options: ["A) Sultan boleh menyerahkan negeri kepada kuasa asing", "B) Sultan dan Menteri DILARANG menyerahkan negeri kepada kuasa asing", "C) British dilantik sebagai pemerintah Johor", "D) Agama Kristian dijadikan agama rasmi"],
    correct_answer: "B",
    explanation: "Undang-Undang Tubuh Johor melarang penyerahan negeri kepada kuasa asing dan menetapkan Islam sebagai agama negeri.",
    tags: ["8.2", "uu-tubuh"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Sultan Abu Bakar menubuhkan Lembaga Penasihat Johor di London. Apakah tujuan tindakan ini?",
    options: ["A) Untuk belajar bahasa Inggeris", "B) Untuk mengekalkan hubungan diplomatik dan menghalang campur tangan British", "C) Untuk meminta bantuan ketenteraan", "D) Untuk menghantar pelajar Johor ke London"],
    correct_answer: "B",
    explanation: "Lembaga Penasihat di London berfungsi sebagai saluran diplomatik Johor.",
    tags: ["8.2", "diplomasi"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Bilakah Kompeni Percubaan Rejimen Askar Melayu (RAMD) ditubuhkan?",
    options: ["A) 1 Mac 1933", "B) 1 Januari 1935", "C) 15 Ogos 1930", "D) 1 September 1939"],
    correct_answer: "A",
    explanation: "Kompeni Percubaan RAMD ditubuhkan pada 1 Mac 1933 di Port Dickson dengan 25 orang rekrut pertama.",
    tags: ["8.2", "ramd"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Di manakah Kompeni Percubaan RAMD ditubuhkan?",
    options: ["A) Kuala Lumpur", "B) Port Dickson, Negeri Sembilan", "C) Taiping, Perak", "D) Johor Bahru"],
    correct_answer: "B",
    explanation: "RAMD ditubuhkan di Port Dickson, Negeri Sembilan pada 1 Mac 1933.",
    tags: ["8.2", "ramd"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Mengapakah pendekatan diplomasi Sultan Abu Bakar lebih berkesan daripada penentangan bersenjata?",
    options: ["A) Kerana British takut kepada tentera Johor", "B) Kerana diplomasi menunjukkan kematangan politik dan mengelakkan konflik yang merugikan", "C) Kerana Johor tidak mempunyai senjata", "D) Kerana Siam melindungi Johor"],
    correct_answer: "B",
    explanation: "Diplomasi mengelakkan konflik dan menunjukkan Johor mampu mentadbir sendiri.",
    tags: ["8.2", "kbat", "diplomasi"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "standard",
    question_text: "Dalam Durbar 1903, Sultan Idris Shah (Perak) mengkritik perkara berikut:",
    options: ["A) Kemasukan buruh asing", "B) Pemusatan kuasa oleh Residen Jeneral", "C) Kenaikan harga bahan makanan", "D) Pembinaan kereta api"],
    correct_answer: "B",
    explanation: "Sultan Idris Shah mengkritik pemusatan kuasa oleh Residen Jeneral dan mendesak pemulangan kuasa kepada institusi raja.",
    tags: ["8.2", "durbar"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "easy",
    question_text: "Undang-Undang Tubuh Kerajaan Johor dimasyhurkan pada tarikh:",
    options: ["A) 1 Julai 1896", "B) 14 April 1895", "C) 17 Mac 1824", "D) 20 Januari 1874"],
    correct_answer: "B",
    explanation: "Undang-Undang Tubuh Kerajaan Johor dimasyhurkan pada 14 April 1895.",
    tags: ["8.2", "uu-tubuh"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "true_false", difficulty: "standard",
    question_text: "Johor merupakan negeri Melayu pertama yang mengamalkan sistem Raja Berperlembagaan melalui Undang-Undang Tubuh 1895.",
    options: ["Betul", "Salah"],
    correct_answer: "Betul",
    explanation: "Undang-Undang Tubuh Johor 1895 menjadikan Johor negeri Melayu pertama dengan perlembagaan bertulis.",
    tags: ["8.2", "uu-tubuh"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "true_false", difficulty: "easy",
    question_text: "Durbar merupakan perjanjian antara British dengan Raja-Raja Melayu.",
    options: ["Betul", "Salah"],
    correct_answer: "Salah",
    explanation: "Durbar ialah PERSIDANGAN (bukan perjanjian) antara Raja-Raja Melayu dengan pihak British.",
    tags: ["8.2", "durbar", "common-trap"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "fill_blank", difficulty: "standard",
    question_text: "Kompeni Percubaan RAMD ditubuhkan dengan ________ orang rekrut pertama pada 1 Mac 1933.",
    options: [],
    correct_answer: "25",
    explanation: "25 orang rekrut pertama membentuk Kompeni Percubaan RAMD di Port Dickson.",
    tags: ["8.2", "ramd"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "fill_blank", difficulty: "easy",
    question_text: "Sultan Abu Bakar menubuhkan Lembaga Penasihat Johor di ________ untuk mengekalkan hubungan diplomatik.",
    options: [],
    correct_answer: "London",
    explanation: "Lembaga Penasihat Johor di London berfungsi sebagai saluran diplomatik Sultan Abu Bakar.",
    tags: ["8.2", "diplomasi"]
  },
  {
    chapter: 8, chapter_title: "Kebijaksanaan Raja dan Pembesar Melayu Menangani Cabaran Barat",
    question_type: "mcq", difficulty: "kbat",
    question_text: "Bagaimanakah kebijaksanaan pemimpin terdahulu dalam berdiplomasi dengan kuasa luar relevan untuk generasi hari ini?",
    options: ["A) Kita perlu menolak semua hubungan antarabangsa", "B) Kita perlu bijak berunding dan mengekalkan kedaulatan sambil menjalin hubungan baik", "C) Kita perlu menyerah kepada tekanan antarabangsa", "D) Diplomasi sudah tidak relevan di zaman moden"],
    correct_answer: "B",
    explanation: "Kebijaksanaan diplomasi Sultan Abu Bakar mengajar kita untuk menjalin hubungan antarabangsa sambil mempertahankan kedaulatan.",
    tags: ["8.4", "kbat", "iktibar"]
  },
];

async function main() {
  console.log(`Seeding ${NEW_QUESTIONS.length} new Sejarah questions...`);
  
  const batchSize = 20;
  let inserted = 0;
  
  for (let i = 0; i < NEW_QUESTIONS.length; i += batchSize) {
    const batch = NEW_QUESTIONS.slice(i, i + batchSize);
    const { error } = await supabase.from("sejarah_questions").insert(batch);
    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} inserted`);
    }
  }
  
  // Summary
  const chapters = {};
  for (const q of NEW_QUESTIONS) {
    chapters[q.chapter] = (chapters[q.chapter] || 0) + 1;
  }
  console.log("\\nPer chapter breakdown:");
  for (const [ch, count] of Object.entries(chapters)) {
    console.log(`  Bab ${ch}: +${count} questions`);
  }
  console.log(`\\nDone. ${inserted} total new questions seeded.`);
}

main();
