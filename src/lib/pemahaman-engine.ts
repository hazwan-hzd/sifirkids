import type { BMQuestion, BMLevel } from "./bahasamelayu";

export type MatchingMode =
  | "contains_any"      // Correct if contains any of the target words
  | "match_any_group"    // Correct if all words in at least one group are present
  | "match_n_from_pool"  // Correct if at least N words from a pool are present
  | "exact_phrase"       // Correct if normalized input matches one of the exact phrases
  | "contains_all";      // Correct if all target words are present

export interface AnswerConfig {
  mode: MatchingMode;
  targets: string[] | string[][]; // string[] for flat list/pool, string[][] for groups
  minCount?: number;             // For match_n_from_pool
}

export interface PemahamanQuestionRaw {
  id: string;
  question_text: string;
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "standard" | "kbat";
  answer_config: AnswerConfig;
}

export interface PemahamanPassage {
  id: string;
  title: string;
  text: string;
  questions: PemahamanQuestionRaw[];
}

/**
 * Normalizes BM text by lowercasing, removing punctuation,
 * stripping extra spaces, and mapping common spelling variants/abbreviations.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  let normalized = text.toLowerCase();

  // Strip punctuation
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, " ");

  // Map common BM contractions and spelling variants
  const synonymMap: Record<string, string> = {
    "tak": "tidak",
    "sebab": "kerana",
    "dah": "sudah",
    "tu": "itu",
    "ni": "ini",
    "nak": "mahu",
    "je": "sahaja",
    "saje": "sahaja",
    "aja": "sahaja",
    "pi": "pergi",
    "amik": "ambil",
    "tau": "tahu",
    "dgn": "dengan",
    "yg": "yang",
    "kwn": "kawan",
    "tgh": "tengah",
    "skg": "sekarang",
    "skrg": "sekarang",
    "bkn": "bukan",
    "sbb": "kerana",
    "pastu": "selepas itu",
    "pasto": "selepas itu",
    "pastu_kemudian": "kemudian",
    "pasni": "selepas ini",
    "mak": "ibu",
    "emak": "ibu",
    "mama": "ibu",
    "bapak": "ayah",
    "papa": "ayah",
    "cikgu": "guru",
    "no": "nombor",
    "num": "nombor",
  };

  const words = normalized.split(/\s+/).filter(Boolean);
  const mappedWords = words.map(w => {
    // Strip common suffixes (nya, lah, kah, ku, mu)
    const stripped = w.replace(/(nya|lah|kah|ku|mu)$/, "");
    return synonymMap[stripped] || synonymMap[w] || stripped;
  });
  return mappedWords.join(" ");
}

/** Levenshtein distance helper to measure distance between two strings */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j, alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
}

/** Check if a word matches target with Levenshtein fuzzy tolerance */
export function isFuzzyMatch(word: string, target: string): boolean {
  const cleanWord = word.trim();
  const cleanTarget = target.trim();
  if (cleanWord === cleanTarget) return true;

  // For very short words (<= 3 chars), require exact match
  if (cleanTarget.length <= 3) {
    return cleanWord === cleanTarget;
  }
  // For medium words (4-6 chars), allow Levenshtein distance <= 1
  if (cleanTarget.length <= 6) {
    return getLevenshteinDistance(cleanWord, cleanTarget) <= 1;
  }
  // For longer words, allow Levenshtein distance <= 2
  return getLevenshteinDistance(cleanWord, cleanTarget) <= 2;
}

/** Checks if a target phrase is present in the normalized input text (supports fuzzy matching) */
export function containsPhraseFuzzy(text: string, phrase: string): boolean {
  const textWords = text.split(/\s+/);
  const phraseWords = phrase.split(/\s+/);

  if (phraseWords.length === 0) return false;
  if (phraseWords.length === 1) {
    return textWords.some(w => isFuzzyMatch(w, phraseWords[0]));
  }

  // Multi-word phrase matching
  for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
    let match = true;
    for (let j = 0; j < phraseWords.length; j++) {
      if (!isFuzzyMatch(textWords[i + j], phraseWords[j])) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export interface CheckAnswerResult {
  correct: boolean;
  score: number; // 0 to 100
  matchedKeywords: string[];
  missingKeywords: string[];
}

/**
 * Validates a student's given answer against the question's AnswerConfig.
 */
export function checkAnswer(given: string, config: AnswerConfig): CheckAnswerResult {
  const normalizedGiven = normalizeText(given);
  if (!normalizedGiven) {
    return { correct: false, score: 0, matchedKeywords: [], missingKeywords: [] };
  }

  const { mode, targets, minCount } = config;

  switch (mode) {
    case "contains_any": {
      const list = targets as string[];
      const matched = list.filter(t => containsPhraseFuzzy(normalizedGiven, normalizeText(t)));
      const isCorrect = matched.length > 0;
      return {
        correct: isCorrect,
        score: isCorrect ? 100 : 0,
        matchedKeywords: matched,
        missingKeywords: isCorrect ? [] : list,
      };
    }

    case "contains_all": {
      const list = targets as string[];
      const matched = list.filter(t => containsPhraseFuzzy(normalizedGiven, normalizeText(t)));
      const missing = list.filter(t => !containsPhraseFuzzy(normalizedGiven, normalizeText(t)));
      const isCorrect = missing.length === 0;
      return {
        correct: isCorrect,
        score: isCorrect ? 100 : Math.round((matched.length / list.length) * 100),
        matchedKeywords: matched,
        missingKeywords: missing,
      };
    }

    case "match_any_group": {
      const groups = targets as string[][];
      let bestResult: CheckAnswerResult = {
        correct: false,
        score: 0,
        matchedKeywords: [],
        missingKeywords: [],
      };

      for (const group of groups) {
        const matched = group.filter(t => containsPhraseFuzzy(normalizedGiven, normalizeText(t)));
        const missing = group.filter(t => !containsPhraseFuzzy(normalizedGiven, normalizeText(t)));
        const isGroupCorrect = missing.length === 0;
        const score = isGroupCorrect ? 100 : Math.round((matched.length / group.length) * 100);

        if (isGroupCorrect) {
          return { correct: true, score: 100, matchedKeywords: matched, missingKeywords: [] };
        }

        if (score > bestResult.score) {
          bestResult = { correct: false, score, matchedKeywords: matched, missingKeywords: missing };
        }
      }

      // If no groups match completely, return the best partial group match details
      if (bestResult.score === 0 && groups.length > 0) {
        bestResult.missingKeywords = groups[0];
      }
      return bestResult;
    }

    case "match_n_from_pool": {
      const pool = targets as string[];
      const min = minCount || 1;
      const matched = pool.filter(t => containsPhraseFuzzy(normalizedGiven, normalizeText(t)));
      const isCorrect = matched.length >= min;
      const score = isCorrect ? 100 : Math.round((matched.length / min) * 100);
      const missing = pool.filter(t => !matched.includes(t));

      return {
        correct: isCorrect,
        score,
        matchedKeywords: matched,
        missingKeywords: isCorrect ? [] : missing,
      };
    }

    case "exact_phrase": {
      const phrases = targets as string[];
      const isCorrect = phrases.some(p => {
        const normalizedPhrase = normalizeText(p);
        return normalizedGiven === normalizedPhrase || getLevenshteinDistance(normalizedGiven, normalizedPhrase) <= 2;
      });
      return {
        correct: isCorrect,
        score: isCorrect ? 100 : 0,
        matchedKeywords: isCorrect ? [given] : [],
        missingKeywords: isCorrect ? [] : phrases,
      };
    }

    default:
      return { correct: false, score: 0, matchedKeywords: [], missingKeywords: [] };
  }
}

/** 10 Reading Comprehension Passages for Bahasa Malaysia Pemahaman Module */
export const PEMAHAMAN_PASSAGES: PemahamanPassage[] = [
  {
    id: "p1",
    title: "Hari 1: Aina Risau Peperiksaan",
    text: "Aina berasa risau kerana peperiksaan semakin dekat. Dia takut tidak dapat menjawab soalan Bahasa Malaysia dengan baik. Namun begitu, ibunya memberi semangat kepada Aina. Ibunya berkata, \"Jika kamu rajin berusaha, kamu pasti boleh berjaya.\" Selepas mendengar nasihat ibunya, Aina berasa lebih yakin dan tenang.",
    questions: [
      {
        id: "p1_q1",
        question_text: "Mengapakah Aina berasa risau?",
        correct_answer: "Aina berasa risau kerana peperiksaan semakin dekat dan dia takut tidak dapat menjawab soalan Bahasa Malaysia dengan baik.",
        explanation: "Nyatakan sebab Aina risau di awal petikan (peperiksaan semakin dekat).",
        difficulty: "easy",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["peperiksaan", "dekat"],
            ["takut", "jawab"],
            ["exam", "dekat"],
          ],
        },
      },
      {
        id: "p1_q2",
        question_text: "Siapakah yang memberi semangat kepada Aina?",
        correct_answer: "Ibu Aina yang memberi semangat kepadanya.",
        explanation: "Cari watak yang membantu Aina dalam petikan (ibunya).",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["ibu", "ibunya", "ibu aina", "mak", "mama", "emak"],
        },
      },
      {
        id: "p1_q3",
        question_text: "Apakah nasihat ibu Aina?",
        correct_answer: "Nasihat ibu Aina ialah \"Jika kamu rajin berusaha, kamu pasti boleh berjaya.\"",
        explanation: "Tulis semula kata-kata nasihat ibu di dalam petikan.",
        difficulty: "standard",
        answer_config: {
          mode: "contains_all",
          targets: ["rajin", "berusaha", "berjaya"],
        },
      },
      {
        id: "p1_q4",
        question_text: "Apakah perasaan Aina selepas mendengar nasihat ibunya?",
        correct_answer: "Aina berasa lebih yakin dan tenang selepas mendengar nasihat ibunya.",
        explanation: "Rujuk ayat terakhir dalam petikan untuk mencari perasaannya.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["yakin", "tenang", "yakin tenang"],
        },
      },
      {
        id: "p1_q5",
        question_text: "Nyatakan dua perkataan perasaan dalam petikan.",
        correct_answer: "Dua perkataan perasaan ialah risau dan tenang.",
        explanation: "Pilih mana-mana dua kata perasaan daripada: risau, takut, yakin, tenang.",
        difficulty: "standard",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["risau", "takut", "yakin", "tenang"],
          minCount: 2,
        },
      },
    ],
  },
  {
    id: "p2",
    title: "Hari 2: Hari Sukan Sekolah",
    text: "Hafiz sangat gembira kerana hari ini adalah hari sukan sekolah. Dia telah berlatih berlari setiap petang selama dua minggu. Apabila perlumbaan bermula, Hafiz berlari dengan pantas. Malangnya, dia terjatuh di pertengahan jalan. Hafiz berasa kecewa tetapi kawannya, Amir, membantu dia bangun. Hafiz berterima kasih kepada Amir dan mereka berjalan ke garisan penamat bersama-sama.",
    questions: [
      {
        id: "p2_q1",
        question_text: "Mengapakah Hafiz berasa gembira?",
        correct_answer: "Hafiz berasa gembira kerana hari ini adalah hari sukan sekolah.",
        explanation: "Hafiz gembira kerana hari sukan sekolah diadakan.",
        difficulty: "easy",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["hari sukan", "sekolah"],
            ["hari sukan"],
          ],
        },
      },
      {
        id: "p2_q2",
        question_text: "Apakah yang berlaku semasa perlumbaan?",
        correct_answer: "Hafiz terjatuh di pertengahan jalan semasa perlumbaan bermula.",
        explanation: "Hafiz mengalami kemalangan kecil (terjatuh).",
        difficulty: "standard",
        answer_config: {
          mode: "contains_all",
          targets: ["terjatuh"],
        },
      },
      {
        id: "p2_q3",
        question_text: "Siapakah yang membantu Hafiz?",
        correct_answer: "Kawannya, Amir, yang membantu Hafiz bangun.",
        explanation: "Watak yang menolong Hafiz ialah Amir.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["amir", "kawan", "kawannya amir"],
        },
      },
      {
        id: "p2_q4",
        question_text: "Apakah perasaan Hafiz selepas terjatuh?",
        correct_answer: "Hafiz berasa kecewa selepas terjatuh.",
        explanation: "Hafiz berasa kecewa kerana impian berlari pantas terganggu.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["kecewa"],
        },
      },
      {
        id: "p2_q5",
        question_text: "Nyatakan dua perkataan perasaan dalam petikan.",
        correct_answer: "Dua perkataan perasaan ialah gembira dan kecewa.",
        explanation: "Perkataan perasaan yang ada ialah gembira dan kecewa.",
        difficulty: "standard",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["gembira", "kecewa", "terima kasih"],
          minCount: 2,
        },
      },
    ],
  },
  {
    id: "p3",
    title: "Hari 3: Siti Terlupa Buku Cerita",
    text: "Siti suka membaca buku cerita di perpustakaan sekolah. Setiap hari Rabu, dia akan meminjam sebuah buku baharu. Pada suatu hari, Siti terlupa memulangkan buku yang dipinjamnya. Dia berasa bimbang kerana takut dimarahi oleh cikgu perpustakaan. Keesokan harinya, Siti memulangkan buku itu dan meminta maaf. Cikgu perpustakaan tersenyum dan memaafkan Siti.",
    questions: [
      {
        id: "p3_q1",
        question_text: "Di manakah Siti suka membaca buku cerita?",
        correct_answer: "Siti suka membaca buku cerita di perpustakaan sekolah.",
        explanation: "Lokasi Siti membaca buku dinyatakan di ayat pertama (perpustakaan sekolah).",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["perpustakaan", "perpustakaan sekolah", "library"],
        },
      },
      {
        id: "p3_q2",
        question_text: "Bilakah Siti meminjam buku baharu?",
        correct_answer: "Siti meminjam buku cerita baharu pada setiap hari Rabu.",
        explanation: "Hari peminjaman buku ialah hari Rabu.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["rabu", "hari rabu", "setiap rabu"],
        },
      },
      {
        id: "p3_q3",
        question_text: "Mengapakah Siti berasa bimbang?",
        correct_answer: "Siti berasa bimbang kerana terlupa memulangkan buku dan takut dimarahi cikgu perpustakaan.",
        explanation: "Siti risau sebab lupa pulangkan buku dan bimbang cikgu marah.",
        difficulty: "standard",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["terlupa", "memulangkan"],
            ["takut", "dimarahi", "cikgu"],
            ["lupa", "hantar", "buku"],
          ],
        },
      },
      {
        id: "p3_q4",
        question_text: "Apakah yang dilakukan Siti keesokan harinya?",
        correct_answer: "Siti memulangkan buku itu dan meminta maaf kepada cikgu perpustakaan.",
        explanation: "Tindakan Siti ialah memulangkan buku serta memohon maaf.",
        difficulty: "standard",
        answer_config: {
          mode: "contains_all",
          targets: ["memulangkan", "meminta maaf"],
        },
      },
      {
        id: "p3_q5",
        question_text: "Nyatakan dua perkataan perasaan dalam petikan.",
        correct_answer: "Dua perkataan perasaan dalam petikan ialah bimbang dan takut.",
        explanation: "Perkataan perasaan yang dinyatakan ialah bimbang dan takut.",
        difficulty: "easy",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["bimbang", "takut", "suka"],
          minCount: 2,
        },
      },
    ],
  },
  {
    id: "p4",
    title: "Hari 4: Pelangi Cantik",
    text: "Adam dan adiknya, Alya, sedang bermain di taman permainan. Tiba-tiba, hujan turun dengan lebat. Mereka berasa terkejut dan cepat-cepat berlari ke pondok yang berdekatan. Adam berasa sedih kerana tidak dapat bermain lagi. Alya pula berasa takut mendengar bunyi guruh. Selepas hujan berhenti, pelangi muncul di langit. Mereka berdua berasa kagum and gembira melihat pelangi yang cantik itu.",
    questions: [
      {
        id: "p4_q1",
        question_text: "Di manakah Adam dan Alya bermain?",
        correct_answer: "Adam dan Alya bermain di taman permainan.",
        explanation: "Tempat mereka bermain di taman permainan.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["taman", "taman permainan", "playground"],
        },
      },
      {
        id: "p4_q2",
        question_text: "Mengapakah mereka berlari ke pondok?",
        correct_answer: "Mereka berlari ke pondok kerana hujan turun dengan lebat secara tiba-tiba.",
        explanation: "Mereka berteduh kerana hujan lebat.",
        difficulty: "easy",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["hujan", "lebat"],
            ["hujan turun"],
          ],
        },
      },
      {
        id: "p4_q3",
        question_text: "Apakah perasaan Adam apabila tidak dapat bermain?",
        correct_answer: "Adam berasa sedih apabila tidak dapat bermain lagi.",
        explanation: "Perasaan Adam ialah sedih.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["sedih"],
        },
      },
      {
        id: "p4_q4",
        question_text: "Apakah yang muncul selepas hujan berhenti?",
        correct_answer: "Pelangi muncul di langit selepas hujan berhenti.",
        explanation: "Fenomena alam yang keluar ialah pelangi.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["pelangi"],
        },
      },
      {
        id: "p4_q5",
        question_text: "Nyatakan tiga perkataan perasaan dalam petikan.",
        correct_answer: "Tiga perkataan perasaan ialah terkejut, sedih, dan takut.",
        explanation: "Boleh pilih mana-mana tiga dari: terkejut, sedih, takut, kagum, gembira.",
        difficulty: "kbat",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["terkejut", "sedih", "takut", "kagum", "gembira"],
          minCount: 3,
        },
      },
    ],
  },
  {
    id: "p5",
    title: "Hari 5: Lukisan Danial",
    text: "Cikgu Mariam mengajar murid-muridnya melukis pada waktu Pendidikan Seni. Dia meminta setiap murid melukis haiwan kegemaran mereka. Danial melukis seekor kucing kerana dia memelihara kucing di rumah. Lukisan Danial sangat cantik dan kemas. Cikgu Mariam memuji Danial di hadapan kelas. Danial berasa bangga dan malu pada masa yang sama. Kawan-kawannya pula berasa kagum dengan lukisan Danial.",
    questions: [
      {
        id: "p5_q1",
        question_text: "Apakah mata pelajaran yang diajar oleh Cikgu Mariam?",
        correct_answer: "Cikgu Mariam mengajar mata pelajaran Pendidikan Seni.",
        explanation: "Mata pelajaran tersebut ialah Pendidikan Seni (seni lukis).",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["pendidikan seni", "seni", "psv", "art"],
        },
      },
      {
        id: "p5_q2",
        question_text: "Mengapakah Danial melukis seekor kucing?",
        correct_answer: "Danial melukis seekor kucing kerana dia memelihara kucing di rumahnya.",
        explanation: "Sebab Danial lukis kucing ialah kerana dia memelihara kucing di rumah.",
        difficulty: "standard",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["pelihara", "kucing"],
            ["bela", "kucing"],
            ["ada", "kucing", "rumah"],
          ],
        },
      },
      {
        id: "p5_q3",
        question_text: "Siapakah yang memuji lukisan Danial?",
        correct_answer: "Cikgu Mariam yang memuji lukisan Danial di hadapan kelas.",
        explanation: "Cikgu Mariam memuji lukisan Danial.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["cikgu mariam", "mariam", "cikgu", "guru"],
        },
      },
      {
        id: "p5_q4",
        question_text: "Apakah perasaan Danial apabila dipuji?",
        correct_answer: "Danial berasa bangga dan malu pada masa yang sama.",
        explanation: "Perasaan Danial bercampur-campur iaitu bangga dan malu.",
        difficulty: "standard",
        answer_config: {
          mode: "contains_all",
          targets: ["bangga", "malu"],
        },
      },
      {
        id: "p5_q5",
        question_text: "Nyatakan dua perkataan perasaan dalam petikan.",
        correct_answer: "Dua perkataan perasaan ialah bangga dan malu.",
        explanation: "Pilih dua dari: bangga, malu, kagum.",
        difficulty: "standard",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["bangga", "malu", "kagum"],
          minCount: 2,
        },
      },
    ],
  },
  {
    id: "p6",
    title: "Hari 6: Izzah Terlewat",
    text: "Pada suatu pagi, Izzah terlambat ke sekolah kerana jam locengnya tidak berbunyi. Dia berasa cemas dan berlari ke sekolah secepat mungkin. Apabila sampai di pintu pagar, dia ternampak cikgu disiplin sedang berdiri di situ. Izzah berasa takut dan menundukkan kepalanya. Cikgu disiplin berkata dengan lembut, \"Lain kali, sediakan dua jam loceng supaya kamu tidak terlambat lagi.\" Izzah berasa lega dan berjanji tidak akan mengulanginya.",
    questions: [
      {
        id: "p6_q1",
        question_text: "Mengapakah Izzah terlambat ke sekolah?",
        correct_answer: "Izzah terlambat ke sekolah kerana jam locengnya tidak berbunyi.",
        explanation: "Izzah terlambat kerana jam locengnya rosak/tidak berbunyi.",
        difficulty: "easy",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["jam loceng", "tidak berbunyi"],
            ["jam", "tak bunyi"],
            ["jam loceng", "tak berbunyi"],
          ],
        },
      },
      {
        id: "p6_q2",
        question_text: "Siapakah yang berdiri di pintu pagar sekolah?",
        correct_answer: "Cikgu disiplin yang sedang berdiri di pintu pagar sekolah.",
        explanation: "Yang berdiri di pagar ialah cikgu disiplin.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["cikgu disiplin", "guru disiplin", "cikgu"],
        },
      },
      {
        id: "p6_q3",
        question_text: "Apakah nasihat cikgu disiplin kepada Izzah?",
        correct_answer: "Nasihat cikgu disiplin ialah supaya Izzah menyediakan dua jam loceng agar tidak terlambat lagi.",
        explanation: "Cikgu nasihat suruh sediakan dua jam loceng.",
        difficulty: "standard",
        answer_config: {
          mode: "contains_all",
          targets: ["dua jam loceng"],
        },
      },
      {
        id: "p6_q4",
        question_text: "Apakah perasaan Izzah selepas mendengar kata-kata cikgu?",
        correct_answer: "Izzah berasa lega selepas mendengar kata-kata cikgu disiplin.",
        explanation: "Izzah berasa lega kerana tidak didenda.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["lega"],
        },
      },
      {
        id: "p6_q5",
        question_text: "Nyatakan tiga perkataan perasaan dalam petikan.",
        correct_answer: "Tiga perkataan perasaan ialah cemas, takut, dan lega.",
        explanation: "Kata perasaan yang ada: cemas, takut, lega.",
        difficulty: "kbat",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["cemas", "takut", "lega"],
          minCount: 3,
        },
      },
    ],
  },
  {
    id: "p7",
    title: "Hari 7: Istana Pasir Zara",
    text: "Keluarga Zara pergi ke pantai pada hujung minggu. Zara berasa teruja kerana sudah lama tidak pergi ke pantai. Dia bermain pasir dan membina istana pasir bersama abangnya. Ayahnya pula mengajar Zara berenang di laut yang cetek. Pada mulanya, Zara berasa gentar tetapi lama-kelamaan dia mula berani. Sebelum pulang, mereka makan ais krim bersama-sama. Zara berasa bahagia kerana dapat menghabiskan masa bersama keluarganya.",
    questions: [
      {
        id: "p7_q1",
        question_text: "Ke manakah keluarga Zara pergi pada hujung minggu?",
        correct_answer: "Keluarga Zara pergi ke pantai pada hujung minggu.",
        explanation: "Destinasi cuti hujung minggu keluarga Zara ialah pantai.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["pantai", "laut", "beach"],
        },
      },
      {
        id: "p7_q2",
        question_text: "Apakah yang dibina oleh Zara dan abangnya?",
        correct_answer: "Zara dan abangnya membina istana pasir.",
        explanation: "Zara dan abang buat istana pasir.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["istana pasir", "pasir"],
        },
      },
      {
        id: "p7_q3",
        question_text: "Siapakah yang mengajar Zara berenang?",
        correct_answer: "Ayahnya yang mengajar Zara berenang di laut yang cetek.",
        explanation: "Zara diajar berenang oleh ayahnya.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["ayah", "ayahnya", "bapa", "papa"],
        },
      },
      {
        id: "p7_q4",
        question_text: "Apakah perasaan Zara pada mulanya apabila belajar berenang?",
        correct_answer: "Pada mulanya, Zara berasa gentar apabila belajar berenang.",
        explanation: "Mula-mula Zara rasa gentar/takut.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["gentar", "takut"],
        },
      },
      {
        id: "p7_q5",
        question_text: "Nyatakan tiga perkataan perasaan dalam petikan.",
        correct_answer: "Tiga perkataan perasaan ialah teruja, gentar, dan bahagia.",
        explanation: "Pilih mana-mana tiga: teruja, gentar, berani, bahagia.",
        difficulty: "kbat",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["teruja", "gentar", "berani", "bahagia"],
          minCount: 3,
        },
      },
    ],
  },
  {
    id: "p8",
    title: "Hari 8: Comel yang Hilang",
    text: "Harith mendapat seekor anak kucing daripada jirannya. Dia menamakan kucing itu \"Comel\" kerana bulunya lembut dan putih. Harith menjaga Comel dengan penuh kasih sayang. Dia memberi makan dan memandikan Comel setiap hari. Pada suatu hari, Comel hilang dari rumah. Harith berasa sedih dan gelisah. Dia mencari Comel di seluruh kampung. Akhirnya, dia menjumpai Comel sedang tidur di bawah pokok mangga jiran. Harith berasa sangat gembira dan memeluk Comel dengan erat.",
    questions: [
      {
        id: "p8_q1",
        question_text: "Siapakah yang memberi anak kucing kepada Harith?",
        correct_answer: "Jiran Harith yang memberikan anak kucing kepadanya.",
        explanation: "Kucing diperoleh daripada jiran.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["jiran", "jirannya"],
        },
      },
      {
        id: "p8_q2",
        question_text: "Mengapakah Harith menamakan kucingnya \"Comel\"?",
        correct_answer: "Harith menamakan kucingnya \"Comel\" kerana bulunya lembut dan putih.",
        explanation: "Sebab nama Comel ialah bulu lembut dan putih.",
        difficulty: "standard",
        answer_config: {
          mode: "contains_all",
          targets: ["bulu", "lembut", "putih"],
        },
      },
      {
        id: "p8_q3",
        question_text: "Apakah yang dilakukan Harith setiap hari untuk menjaga Comel?",
        correct_answer: "Harith memberi makan dan memandikan Comel setiap hari.",
        explanation: "Routine Harith ialah memberi makan dan mandikan.",
        difficulty: "standard",
        answer_config: {
          mode: "contains_all",
          targets: ["makan", "memandikan"],
        },
      },
      {
        id: "p8_q4",
        question_text: "Di manakah Harith menjumpai Comel?",
        correct_answer: "Harith menjumpai Comel sedang tidur di bawah pokok mangga jiran.",
        explanation: "Tempat jumpa kucing ialah di bawah pokok mangga jiran.",
        difficulty: "standard",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["pokok mangga", "jiran"],
            ["pokok mangga"],
            ["pokok", "jiran"],
          ],
        },
      },
      {
        id: "p8_q5",
        question_text: "Nyatakan three perkataan perasaan dalam petikan.",
        correct_answer: "Tiga perkataan perasaan ialah sedih, gelisah, dan gembira.",
        explanation: "Pilih mana-mana tiga: sedih, gelisah, gembira, kasih sayang.",
        difficulty: "kbat",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["sedih", "gelisah", "gembira", "kasih sayang"],
          minCount: 3,
        },
      },
    ],
  },
  {
    id: "p9",
    title: "Hari 9: Pertandingan Bercerita Nurul",
    text: "Nurul ingin menyertai pertandingan bercerita di sekolah. Dia berasa gugup kerana belum pernah bercakap di hadapan ramai orang. Cikgu Bahasa Malaysia, Cikgu Farah, melatih Nurul setiap hari selepas sekolah. Cikgu Farah mengajar Nurul cara bercakap dengan suara yang lantang dan jelas. Pada hari pertandingan, Nurul berjaya bercerita dengan penuh keyakinan. Dia memenangi tempat kedua dan berasa sangat puas hati. Cikgu Farah berasa bangga dengan pencapaian Nurul.",
    questions: [
      {
        id: "p9_q1",
        question_text: "Apakah pertandingan yang ingin disertai oleh Nurul?",
        correct_answer: "Nurul ingin menyertai pertandingan bercerita di sekolah.",
        explanation: "Nurul mahu masuk pertandingan bercerita.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["bercerita", "pertandingan bercerita"],
        },
      },
      {
        id: "p9_q2",
        question_text: "Mengapakah Nurul berasa gugup?",
        correct_answer: "Nurul berasa gugup kerana dia belum pernah bercakap di hadapan ramai orang.",
        explanation: "Dia risau/gugup sebab tak pernah berucap depan khalayak ramai.",
        difficulty: "standard",
        answer_config: {
          mode: "match_any_group",
          targets: [
            ["belum pernah bercakap", "ramai orang"],
            ["tak pernah", "cakap", "ramai orang"],
            ["cakap depan orang ramai"],
          ],
        },
      },
      {
        id: "p9_q3",
        question_text: "Siapakah yang melatih Nurul?",
        correct_answer: "Cikgu Farah yang melatih Nurul setiap hari selepas sekolah.",
        explanation: "Guru yang bimbing Nurul ialah Cikgu Farah.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["cikgu farah", "farah", "cikgu bahasa malaysia"],
        },
      },
      {
        id: "p9_q4",
        question_text: "Apakah tempat yang dimenangi oleh Nurul?",
        correct_answer: "Nurul memenangi tempat kedua dalam pertandingan itu.",
        explanation: "Nurul dapat tempat kedua.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["kedua", "tempat kedua", "nombor dua"],
        },
      },
      {
        id: "p9_q5",
        question_text: "Nyatakan dua perkataan perasaan dalam petikan.",
        correct_answer: "Dua perkataan perasaan ialah gugup dan bangga.",
        explanation: "Pilih mana-mana dua: gugup, puas hati, bangga.",
        difficulty: "standard",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["gugup", "puas hati", "bangga"],
          minCount: 2,
        },
      },
    ],
  },
  {
    id: "p10",
    title: "Hari 10: Hari Jadi Aisyah",
    text: "Pada hari jadi Aisyah yang ke-9, ibu bapanya mengadakan majlis kecil di rumah. Aisyah berasa terharu apabila kawan-kawannya datang dengan membawa hadiah. Mereka bermain pelbagai permainan dan makan kek coklat yang dimasak oleh ibunya. Aisyah paling gembira apabila membuka hadiah daripada sahabat baiknya, Mia. Mia memberi Aisyah sebuah buku cerita yang sangat menarik. Aisyah memeluk Mia dan berkata, \"Terima kasih, Mia. Kamu memang sahabat yang terbaik!\"",
    questions: [
      {
        id: "p10_q1",
        question_text: "Berapakah umur Aisyah pada hari jadinya?",
        correct_answer: "Aisyah berumur 9 tahun pada hari jadinya.",
        explanation: "Umur Aisyah ialah 9 tahun.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["9", "sembilan", "sembilan tahun", "9 tahun"],
        },
      },
      {
        id: "p10_q2",
        question_text: "Siapakah yang memasak kek coklat itu?",
        correct_answer: "Kek coklat itu dimasak oleh ibu Aisyah.",
        explanation: "Kek coklat dimasak oleh ibunya.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["ibu", "ibunya", "mak", "emak"],
        },
      },
      {
        id: "p10_q3",
        question_text: "Apakah hadiah yang diberikan oleh Mia?",
        correct_answer: "Mia memberikan sebuah buku cerita yang sangat menarik kepada Aisyah.",
        explanation: "Mia memberi hadiah buku cerita.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["buku cerita", "buku"],
        },
      },
      {
        id: "p10_q4",
        question_text: "Apakah perasaan Aisyah apabila kawan-kawannya datang?",
        correct_answer: "Aisyah berasa terharu apabila kawan-kawannya datang memeriahkan majlis.",
        explanation: "Perasaan Aisyah ialah terharu.",
        difficulty: "easy",
        answer_config: {
          mode: "contains_any",
          targets: ["terharu"],
        },
      },
      {
        id: "p10_q5",
        question_text: "Nyatakan dua perkataan perasaan dalam petikan.",
        correct_answer: "Dua perkataan perasaan ialah terharu dan gembira.",
        explanation: "Perkataan perasaan ialah terharu dan gembira.",
        difficulty: "standard",
        answer_config: {
          mode: "match_n_from_pool",
          targets: ["terharu", "gembira"],
          minCount: 2,
        },
      },
    ],
  },
];

/**
 * Maps the 10 local passages to a flat array of BMQuestion format items.
 * Each passage produces 5 questions.
 */
export function getLocalPemahamanQuestions(level: BMLevel): BMQuestion[] {
  const result: BMQuestion[] = [];
  
  for (const passage of PEMAHAMAN_PASSAGES) {
    for (const q of passage.questions) {
      result.push({
        id: q.id,
        level: level,
        topic: 3,
        topic_title: "Pemahaman",
        question_text: `${passage.text}\n\nSoalan: ${q.question_text}`,
        question_type: "fill_blank", // Using fill_blank to render as text input
        options: null,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        image_url: null,
        difficulty: q.difficulty,
        tags: ["pemahaman", passage.id],
        // Attach raw config for the checker to pick up
        ...({
          answer_config: q.answer_config,
          passage_title: passage.title,
          passage_text: passage.text,
          raw_question_text: q.question_text
        } as any)
      });
    }
  }

  return result;
}
