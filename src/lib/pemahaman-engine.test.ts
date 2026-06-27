import { checkAnswer, normalizeText, getLevenshteinDistance, isFuzzyMatch, PEMAHAMAN_PASSAGES } from "./pemahaman-engine";

interface TestCase {
  passageId: string;
  questionId: string;
  input: string;
  expectedCorrect: boolean;
  desc: string;
}

const testCases: TestCase[] = [
  // --- Passage 1: Aina Risau Peperiksaan ---
  {
    passageId: "p1",
    questionId: "p1_q1", // Mengapakah Aina berasa risau?
    input: "sebab peperiksaan semakin dekat",
    expectedCorrect: true,
    desc: "Passage 1 Q1: Exact group 1 match (peperiksaan dekat) with synonym 'sebab' -> 'kerana'"
  },
  {
    passageId: "p1",
    questionId: "p1_q1",
    input: "Dia takut tak dapat jawab exam",
    expectedCorrect: true,
    desc: "Passage 1 Q1: Exact group 2 match (takut jawab bahasa malaysia) with typo/synonym 'exam' and 'tak' -> 'tidak'"
  },
  {
    passageId: "p1",
    questionId: "p1_q1",
    input: "kerana peperiksaan dah dekat sangat",
    expectedCorrect: true,
    desc: "Passage 1 Q1: Group 1 match with extra words and abbreviation 'dah' -> 'sudah'"
  },
  {
    passageId: "p1",
    questionId: "p1_q1",
    input: "Aina risau sahaja",
    expectedCorrect: false,
    desc: "Passage 1 Q1: Wrong answer (no keywords matched)"
  },
  {
    passageId: "p1",
    questionId: "p1_q2", // Siapakah yang memberi semangat kepada Aina?
    input: "mak dia",
    expectedCorrect: true,
    desc: "Passage 1 Q2: Synonym 'mak' -> 'ibu'"
  },
  {
    passageId: "p1",
    questionId: "p1_q2",
    input: "mama Aina",
    expectedCorrect: true,
    desc: "Passage 1 Q2: Synonym 'mama' -> 'ibu'"
  },
  {
    passageId: "p1",
    questionId: "p1_q2",
    input: "kawan Aina",
    expectedCorrect: false,
    desc: "Passage 1 Q2: Incorrect person"
  },
  {
    passageId: "p1",
    questionId: "p1_q3", // Apakah nasihat ibu Aina? (rajin, berusaha, berjaya)
    input: "kita kena rajin berusaha supaya berjaya",
    expectedCorrect: true,
    desc: "Passage 1 Q3: Contains all keywords with extra framing words"
  },
  {
    passageId: "p1",
    questionId: "p1_q3",
    input: "rajin berusaha sahaja",
    expectedCorrect: false,
    desc: "Passage 1 Q3: Missing 'berjaya' (contains_all requirement)"
  },
  {
    passageId: "p1",
    questionId: "p1_q5", // Nyatakan dua perkataan perasaan
    input: "perasaan risau dan juga takut",
    expectedCorrect: true,
    desc: "Passage 1 Q5: Match 2 from pool (risau, takut)"
  },
  {
    passageId: "p1",
    questionId: "p1_q5",
    input: "dia berasa yakin",
    expectedCorrect: false,
    desc: "Passage 1 Q5: Match only 1 from pool (yakin) - needs 2"
  },

  // --- Passage 2: Hari Sukan Sekolah ---
  {
    passageId: "p2",
    questionId: "p2_q1", // Mengapakah Hafiz gembira?
    input: "sebab harini hari sukan sekolah",
    expectedCorrect: true,
    desc: "Passage 2 Q1: Match group 1"
  },
  {
    passageId: "p2",
    questionId: "p2_q2", // Apakah yang berlaku? (terjatuh)
    input: "dia telah terjatoh",
    expectedCorrect: true,
    desc: "Passage 2 Q2: Typo 'terjatoh' matched to 'terjatuh' via Levenshtein fuzzy match"
  },
  {
    passageId: "p2",
    questionId: "p2_q4", // Perasaan selepas terjatuh
    input: "dia rasa kecewa sangat",
    expectedCorrect: true,
    desc: "Passage 2 Q4: Kecewa"
  },

  // --- Passage 3: Siti Terlupa Buku Cerita ---
  {
    passageId: "p3",
    questionId: "p3_q1", // Di manakah Siti suka membaca?
    input: "dekat perpustakaan sekolah",
    expectedCorrect: true,
    desc: "Passage 3 Q1: Perpustakaan sekolah"
  },
  {
    passageId: "p3",
    questionId: "p3_q2", // Bilakah Siti meminjam buku?
    input: "setiap rabu",
    expectedCorrect: true,
    desc: "Passage 3 Q2: Rabu"
  },
  {
    passageId: "p3",
    questionId: "p3_q3", // Mengapakah Siti berasa bimbang?
    input: "dia lupa hantar buku itu balik",
    expectedCorrect: true,
    desc: "Passage 3 Q3: Match group 3 (lupa hantar buku)"
  },

  // --- Passage 4: Pelangi Cantik ---
  {
    passageId: "p4",
    questionId: "p4_q2", // Mengapakah berlari ke pondok?
    input: "kerana ujan turun lebat",
    expectedCorrect: true,
    desc: "Passage 4 Q2: Match group 1 with typo 'ujan' -> 'hujan'"
  },
  {
    passageId: "p4",
    questionId: "p4_q5", // Nyatakan tiga perkataan perasaan
    input: "terkejut, sedih, takut",
    expectedCorrect: true,
    desc: "Passage 4 Q5: Match 3 from pool"
  },
  {
    passageId: "p4",
    questionId: "p4_q5",
    input: "sedih dan takut sahaja",
    expectedCorrect: false,
    desc: "Passage 4 Q5: Only matches 2 from pool (needs 3)"
  },

  // --- Passage 5: Lukisan Danial ---
  {
    passageId: "p5",
    questionId: "p5_q2", // Mengapakah Danial melukis seekor kucing?
    input: "sebab dia bela kucing kat rumah",
    expectedCorrect: true,
    desc: "Passage 5 Q2: Match group 2 (bela kucing)"
  },
  {
    passageId: "p5",
    questionId: "p5_q4", // Apakah perasaan Danial apabila dipuji? (bangga, malu)
    input: "dia rasa bangga tapi ada malu sikit",
    expectedCorrect: true,
    desc: "Passage 5 Q4: Contains both bangga and malu"
  },
  {
    passageId: "p5",
    questionId: "p5_q4",
    input: "bangga sahaja",
    expectedCorrect: false,
    desc: "Passage 5 Q4: Missing 'malu' (contains_all)"
  },

  // --- Passage 6: Izzah Terlewat ---
  {
    passageId: "p6",
    questionId: "p6_q1", // Mengapakah terlambat?
    input: "loceng jam tak bunyi",
    expectedCorrect: true,
    desc: "Passage 6 Q1: Match group 2 (jam tak bunyi)"
  },
  {
    passageId: "p6",
    questionId: "p6_q3", // Apakah nasihat cikgu disiplin? (dua jam loceng)
    input: "sediakan dua jam loceng",
    expectedCorrect: true,
    desc: "Passage 6 Q3: Sediakan dua jam loceng"
  },

  // --- Passage 7: Istana Pasir Zara ---
  {
    passageId: "p7",
    questionId: "p7_q3", // Siapakah mengajar Zara berenang?
    input: "bapa dia",
    expectedCorrect: true,
    desc: "Passage 7 Q3: Synonym 'bapa' -> 'ayah'"
  },
  {
    passageId: "p7",
    questionId: "p7_q4", // Perasaan Zara belajar berenang
    input: "mula2 dia rasa gentar",
    expectedCorrect: true,
    desc: "Passage 7 Q4: Gentar"
  },

  // --- Passage 8: Comel yang Hilang ---
  {
    passageId: "p8",
    questionId: "p8_q2", // Mengapakah dinamakan Comel? (bulu, lembut, putih)
    input: "bulunya lembut dan sangat puteh",
    expectedCorrect: true,
    desc: "Passage 8 Q2: Contains all with typo 'puteh' -> 'putih'"
  },
  {
    passageId: "p8",
    questionId: "p8_q4", // Di manakah menjumpai Comel?
    input: "bawah pokok mangga jiran",
    expectedCorrect: true,
    desc: "Passage 8 Q4: Match group 1"
  },

  // --- Passage 9: Pertandingan Bercerita ---
  {
    passageId: "p9",
    questionId: "p9_q2", // Mengapakah gugup?
    input: "tak pernah cakap depan orang ramai",
    expectedCorrect: true,
    desc: "Passage 9 Q2: Match group 2"
  },
  {
    passageId: "p9",
    questionId: "p9_q4", // Tempat dimenangi
    input: "no dua",
    expectedCorrect: true,
    desc: "Passage 9 Q4: Synonym/Variant 'no dua' -> 'kedua' (exact match variant)"
  },

  // --- Passage 10: Hari Jadi Aisyah ---
  {
    passageId: "p10",
    questionId: "p10_q1", // Umur Aisyah
    input: "9 tahun",
    expectedCorrect: true,
    desc: "Passage 10 Q1: 9 tahun"
  },
  {
    passageId: "p10",
    questionId: "p10_q2", // Kek coklat dimasak oleh
    input: "mak aisyah",
    expectedCorrect: true,
    desc: "Passage 10 Q2: Synonym 'mak' -> 'ibu'"
  }
];

function runTests() {
  console.log("=== MEMULAKAN UJIAN PEMAHAMAN ENGINE ===");
  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const passage = PEMAHAMAN_PASSAGES.find(p => p.id === tc.passageId);
    if (!passage) {
      console.error(`ERROR: Passage ${tc.passageId} tidak ditemui.`);
      failedCount++;
      continue;
    }

    const question = passage.questions.find(q => q.id === tc.questionId);
    if (!question) {
      console.error(`ERROR: Question ${tc.questionId} tidak ditemui.`);
      failedCount++;
      continue;
    }

    const result = checkAnswer(tc.input, question.answer_config);
    const passed = result.correct === tc.expectedCorrect;

    if (passed) {
      passedCount++;
      console.log(`✅ [TEST ${i + 1}/${testCases.length}] PASSED: ${tc.desc}`);
    } else {
      failedCount++;
      console.log(`❌ [TEST ${i + 1}/${testCases.length}] FAILED: ${tc.desc}`);
      console.log(`   - Input: "${tc.input}"`);
      console.log(`   - Expected: ${tc.expectedCorrect ? "BETUL" : "SALAH"}`);
      console.log(`   - Got: ${result.correct ? "BETUL" : "SALAH"}`);
      console.log(`   - Matched: [${result.matchedKeywords.join(", ")}]`);
      console.log(`   - Missing/Expected: [${result.missingKeywords.join(", ")}]`);
    }
  }

  console.log("\n=== RINGKASAN UJIAN ===");
  console.log(`Jumlah Ujian: ${testCases.length}`);
  console.log(`Lulus       : ${passedCount}`);
  console.log(`Gagal       : ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("Semua ujian berjaya dilepasi! 🎉");
    process.exit(0);
  }
}

runTests();
