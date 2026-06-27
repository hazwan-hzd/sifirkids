import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/* Geografi module - Supabase client functions                         */
/* ------------------------------------------------------------------ */

export interface GeografiQuestion {
  id: string;
  chapter: number;
  chapter_title: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "fill_blank";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  difficulty: "easy" | "standard" | "kbat";
  tags: string[] | null;
}

export interface GeografiVocabGap {
  id: string;
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
  reviewed: boolean;
  created_at: string;
}

export interface GeografiQuizResult {
  id: string;
  child_id: string;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number | null;
  points_earned: number | null;
  vocab_gaps_logged: number;
  created_at: string;
}

/** Chapter metadata derived from questions in DB. */
export interface ChapterInfo {
  chapter: number;
  chapter_title: string;
  questionCount: number;
}

export type QuizMode = "quick" | "full";
const QUICK_QUIZ_COUNT = 10;

/* ----------------------------- Queries ----------------------------- */

/** Fisher-Yates shuffle helper. Mutates in place & returns the array. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Get IDs of questions already answered by this child for a chapter. */
export async function fetchSeenQuestionIds(
  childId: string,
  chapter: number,
): Promise<Set<string>> {
  if (!supabase) return new Set();
  // Join answer_log -> quiz_results to filter by child + chapter
  const { data, error } = await supabase
    .from("geografi_answer_log")
    .select("question_id, result_id!inner(child_id, chapter)")
    .eq("result_id.child_id", childId)
    .eq("result_id.chapter", chapter);
  if (error) {
    console.error("Error fetching seen questions:", error);
    return new Set();
  }
  return new Set((data ?? []).map((r: { question_id: string }) => r.question_id));
}

/**
 * Fetch questions for a chapter with smart randomization.
 * - Prioritizes unseen questions (ones the child hasn't answered before)
 * - In "quick" mode: returns QUICK_QUIZ_COUNT questions
 * - In "full" mode: returns all questions
 */
export async function fetchQuestions(
  chapter: number,
  mode: QuizMode = "quick",
  childId?: string,
): Promise<GeografiQuestion[]> {
  let allQuestions: GeografiQuestion[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("geografi_questions")
        .select("*")
        .eq("chapter", chapter)
        .order("created_at");
      if (error) {
        console.error("Error fetching geografi questions from Supabase:", error);
      } else if (data && data.length > 0) {
        allQuestions = data as GeografiQuestion[];
      }
    } catch (err) {
      console.error("Failed to query Supabase geografi questions:", err);
    }
  }

  // Fallback to local array if Supabase query failed, was empty, or offline
  if (allQuestions.length === 0) {
    allQuestions = GEOGRAFI_FALLBACK_QUESTIONS.filter((q) => q.chapter === chapter);
  }

  // Get previously seen IDs for smart prioritization
  const seenIds = childId
    ? await fetchSeenQuestionIds(childId, chapter)
    : new Set<string>();

  // Split into unseen and seen
  const unseen = allQuestions.filter((q) => !seenIds.has(q.id));
  const seen = allQuestions.filter((q) => seenIds.has(q.id));

  // Shuffle both pools independently
  shuffle(unseen);
  shuffle(seen);

  // Prioritize unseen, then fill with seen
  const prioritized = [...unseen, ...seen];

  if (mode === "full") {
    return prioritized;
  }
  // Quick mode: take QUICK_QUIZ_COUNT
  return prioritized.slice(0, QUICK_QUIZ_COUNT);
}

/** Fetch chapter list with question counts. */
export async function fetchChapters(): Promise<ChapterInfo[]> {
  let rows: Array<{ chapter: number; chapter_title: string }> = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("geografi_questions")
        .select("chapter, chapter_title");
      if (error) {
        console.error("Error fetching chapters from Supabase:", error);
      } else if (data && data.length > 0) {
        rows = data as Array<{ chapter: number; chapter_title: string }>;
      }
    } catch (err) {
      console.error("Failed to query Supabase chapters:", err);
    }
  }

  // Fallback to local array if Supabase query failed, was empty, or offline
  if (rows.length === 0) {
    rows = GEOGRAFI_FALLBACK_QUESTIONS.map((q) => ({
      chapter: q.chapter,
      chapter_title: q.chapter_title,
    }));
  }

  const map = new Map<number, { title: string; count: number }>();
  for (const r of rows) {
    const existing = map.get(r.chapter);
    if (existing) {
      existing.count++;
    } else {
      map.set(r.chapter, { title: r.chapter_title, count: 1 });
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([ch, { title, count }]) => ({
      chapter: ch,
      chapter_title: title,
      questionCount: count,
    }));
}

/** Fetch past quiz results for a child. */
export async function fetchQuizResults(
  childId: string,
  chapter?: number,
): Promise<GeografiQuizResult[]> {
  if (!supabase) return [];
  let query = supabase
    .from("geografi_quiz_results")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (chapter !== undefined) {
    query = query.eq("chapter", chapter);
  }
  const { data, error } = await query;
  if (error) {
    console.error("Error fetching quiz results:", error);
    return [];
  }
  return (data ?? []) as GeografiQuizResult[];
}

/* ----------------------------- Mutations ----------------------------- */

/** Log a completed quiz result directly. Throws on failure. */
export async function logGeografiResultDirect(result: {
  child_id: string;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
  vocab_gaps_logged: number;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { data, error } = await supabase
    .from("geografi_quiz_results")
    .insert(result)
    .select("id")
    .single();
  if (error || !data) {
    throw error || new Error("Failed to log geografi result");
  }
  return data.id;
}

/** Log individual answers directly. Throws on failure. */
export async function logGeografiAnswersDirect(
  resultId: string,
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");
  if (answers.length === 0) return;
  const rows = answers.map((a) => ({ ...a, result_id: resultId }));
  const { error } = await supabase.from("geografi_answer_log").insert(rows);
  if (error) {
    throw error;
  }
}

/** Log a completed quiz result and answers directly. Throws on failure. */
export async function logGeografiQuizDirect(
  result: {
    child_id: string;
    chapter: number;
    total_questions: number;
    correct_answers: number;
    duration_sec: number;
    points_earned: number;
    vocab_gaps_logged: number;
  },
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  const resultId = await logGeografiResultDirect(result);
  await logGeografiAnswersDirect(resultId, answers);
}

/**
 * Log a completed geografi quiz. If offline or write fails, queues the result in localStorage.
 */
export async function logGeografiQuiz(
  result: {
    child_id: string;
    chapter: number;
    total_questions: number;
    correct_answers: number;
    duration_sec: number;
    points_earned: number;
    vocab_gaps_logged: number;
  },
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  try {
    await logGeografiQuizDirect(result, answers);
  } catch (err) {
    console.error("Geografi logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "geografi",
        payload: { result, answers },
      });
    } catch (queueErr) {
      console.error("Failed to queue geografi sync item:", queueErr);
    }
  }
}

/** Save a vocabulary gap entry directly. Throws on failure. */
export async function logVocabGapDirect(entry: {
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  if (!supabase) throw new Error("Supabase client not initialized");
  const { error } = await supabase.from("geografi_vocab_gaps").insert(entry);
  if (error) {
    throw error;
  }
}

/** Save a vocabulary gap entry. Queues offline on failure. */
export async function logVocabGap(entry: {
  child_id: string;
  question_id: string | null;
  word: string;
  chapter: number | null;
  context: string | null;
}): Promise<void> {
  try {
    await logVocabGapDirect(entry);
  } catch (err) {
    console.error("Vocab gap logging failed, queueing offline:", err);
    try {
      const { enqueueSyncItem } = await import("./sync-queue");
      enqueueSyncItem({
        type: "vocab_gap",
        payload: entry,
      });
    } catch (queueErr) {
      console.error("Failed to queue vocab gap sync item:", queueErr);
    }
  }
}

/** Fetch all vocab gaps for a child. */
export async function fetchVocabGaps(childId: string): Promise<GeografiVocabGap[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("geografi_vocab_gaps")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching vocab gaps:", error);
    return [];
  }
  return (data ?? []) as GeografiVocabGap[];
}

/** Toggle reviewed status on a vocab gap. */
export async function toggleVocabReviewed(
  gapId: string,
  reviewed: boolean,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("geografi_vocab_gaps")
    .update({ reviewed })
    .eq("id", gapId);
  if (error) {
    console.error("Error toggling vocab reviewed:", error);
  }
}

const GEOGRAFI_FALLBACK_QUESTIONS: GeografiQuestion[] = [
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "chapter": 1,
    "chapter_title": "Arah dan Kedudukan dalam Peta Topografi",
    "question_text": "Berapakah bearing sudutan bagi arah Barat Daya?",
    "question_type": "mcq",
    "options": [
      "135°",
      "225°",
      "270°",
      "315°"
    ],
    "correct_answer": "225°",
    "explanation": "Bearing sudutan dikira mengikut arah jam dari Utara. Barat Daya berada pada 225°.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "bearing",
      "arah"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000002",
    "chapter": 1,
    "chapter_title": "Arah dan Kedudukan dalam Peta Topografi",
    "question_text": "Rujukan grid enam angka digunakan untuk menentukan ______ sesuatu tempat di atas peta.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "kedudukan tepat",
    "explanation": "Rujukan grid enam angka memberikan kedudukan tepat sesuatu ciri pada peta topografi, manakala rujukan grid empat angka hanya memberikan kedudukan umum.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "rujukan grid",
      "peta topografi"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000003",
    "chapter": 1,
    "chapter_title": "Arah dan Kedudukan dalam Peta Topografi",
    "question_text": "Sebuah menara terletak pada bearing 045° dari sekolah. Apakah arah menara dari sekolah?",
    "question_type": "mcq",
    "options": [
      "Timur Laut",
      "Tenggara",
      "Barat Laut",
      "Barat Daya"
    ],
    "correct_answer": "Timur Laut",
    "explanation": "Bearing 045° bermaksud 45° dari Utara mengikut arah jam, iaitu arah Timur Laut.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "bearing",
      "arah mata angin"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000004",
    "chapter": 2,
    "chapter_title": "Skala, Jarak dan Luas",
    "question_text": "Jika skala peta ialah 1:50 000, berapakah jarak sebenar bagi 4 cm di atas peta?",
    "question_type": "mcq",
    "options": [
      "1 km",
      "2 km",
      "4 km",
      "8 km"
    ],
    "correct_answer": "2 km",
    "explanation": "4 cm x 50 000 = 200 000 cm = 2 km. Setiap 1 cm pada peta mewakili 0.5 km jarak sebenar.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "skala",
      "jarak"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000005",
    "chapter": 2,
    "chapter_title": "Skala, Jarak dan Luas",
    "question_text": "Sebuah kawasan pada peta berskala 1:50 000 berukuran 2 cm x 3 cm. Berapakah luas sebenar kawasan tersebut dalam km persegi?",
    "question_type": "mcq",
    "options": [
      "1.5 km²",
      "3 km²",
      "6 km²",
      "15 km²"
    ],
    "correct_answer": "1.5 km²",
    "explanation": "Luas pada peta = 6 cm². Setiap 1 cm = 0.5 km, jadi 1 cm² = 0.25 km². Luas sebenar = 6 x 0.25 = 1.5 km².",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "skala",
      "luas"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000006",
    "chapter": 3,
    "chapter_title": "Ketinggian dan Keratan Rentas",
    "question_text": "Apakah ciri yang ditunjukkan apabila garis kontur rapat antara satu sama lain?",
    "question_type": "mcq",
    "options": [
      "Kawasan rata",
      "Cerun curam",
      "Lembah",
      "Puncak bukit"
    ],
    "correct_answer": "Cerun curam",
    "explanation": "Garis kontur yang rapat menunjukkan perubahan ketinggian yang besar dalam jarak mendatar yang pendek, iaitu cerun curam.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "garis kontur",
      "cerun"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000007",
    "chapter": 3,
    "chapter_title": "Ketinggian dan Keratan Rentas",
    "question_text": "Benar atau Salah: Keratan rentas dilukis untuk menunjukkan profil muka bumi dari satu titik ke titik yang lain.",
    "question_type": "true_false",
    "options": null,
    "correct_answer": "Benar",
    "explanation": "Keratan rentas menunjukkan rupa bentuk muka bumi secara profil dengan memindahkan maklumat ketinggian dari garis kontur ke atas kertas graf.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "keratan rentas",
      "profil"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000008",
    "chapter": 4,
    "chapter_title": "Pandang Darat",
    "question_text": "Yang manakah antara berikut merupakan pandang darat budaya?",
    "question_type": "mcq",
    "options": [
      "Sungai",
      "Sawah padi",
      "Gunung",
      "Hutan"
    ],
    "correct_answer": "Sawah padi",
    "explanation": "Pandang darat budaya ialah ciri landskap yang dihasilkan oleh aktiviti manusia seperti sawah padi, jalan raya, dan petempatan.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "pandang darat budaya",
      "peta topografi"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000009",
    "chapter": 4,
    "chapter_title": "Pandang Darat",
    "question_text": "Berdasarkan peta topografi, nyatakan dua ciri pandang darat fizikal dan dua ciri pandang darat budaya yang boleh dikenal pasti.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "Fizikal: sungai dan bukit; Budaya: jalan raya dan petempatan",
    "explanation": "Pandang darat fizikal merujuk kepada ciri semula jadi seperti sungai, bukit, lembah, dan hutan. Pandang darat budaya merujuk kepada ciri buatan manusia seperti jalan raya, petempatan, dan ladang.",
    "image_url": "/images/geografi/peta_topografi_placeholder.png",
    "difficulty": "kbat",
    "tags": [
      "pandang darat fizikal",
      "pandang darat budaya"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000010",
    "chapter": 5,
    "chapter_title": "Pergerakan Plat Tektonik",
    "question_text": "Apakah yang berlaku apabila dua plat tektonik bergerak menjauhi antara satu sama lain?",
    "question_type": "mcq",
    "options": [
      "Pertembungan",
      "Pencapahan",
      "Slipan",
      "Subduksi"
    ],
    "correct_answer": "Pencapahan",
    "explanation": "Pencapahan (divergent) berlaku apabila dua plat bergerak menjauhi antara satu sama lain, menyebabkan magma naik ke permukaan dan membentuk kerak lautan baharu.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "plat tektonik",
      "pencapahan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000011",
    "chapter": 5,
    "chapter_title": "Pergerakan Plat Tektonik",
    "question_text": "Lapisan SIAL terdiri daripada unsur utama ______ dan ______.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "silikon dan aluminium",
    "explanation": "SIAL ialah lapisan kerak bumi yang terdiri daripada unsur silikon (Si) dan aluminium (Al). Lapisan ini membentuk kerak benua yang kurang tumpat berbanding SIMA.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "SIAL",
      "kerak bumi"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000012",
    "chapter": 5,
    "chapter_title": "Pergerakan Plat Tektonik",
    "question_text": "Jelaskan mengapa kawasan Cincin Api Pasifik sering mengalami gempa bumi dan letusan gunung berapi.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "Kawasan ini terletak di sempadan plat tektonik yang aktif di mana pertembungan dan subduksi berlaku",
    "explanation": "Cincin Api Pasifik ialah zon di sekeliling Lautan Pasifik yang mempunyai banyak sempadan plat aktif. Pertembungan plat menyebabkan subduksi yang menghasilkan gempa bumi dan letusan gunung berapi.",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "Cincin Api Pasifik",
      "gempa bumi",
      "gunung berapi"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000013",
    "chapter": 6,
    "chapter_title": "Batuan",
    "question_text": "Granit ialah sejenis batuan igneus ______.",
    "question_type": "mcq",
    "options": [
      "letusan",
      "rejahan",
      "sedimen",
      "metamorfik"
    ],
    "correct_answer": "rejahan",
    "explanation": "Granit terbentuk apabila magma membeku secara perlahan di bawah permukaan bumi (rejahan/intrusive), menghasilkan hablur mineral yang besar.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "batuan igneus",
      "granit",
      "rejahan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000014",
    "chapter": 6,
    "chapter_title": "Batuan",
    "question_text": "Marmar terbentuk daripada proses metamorfisme ke atas batuan ______.",
    "question_type": "mcq",
    "options": [
      "granit",
      "basalt",
      "batu kapur",
      "batu pasir"
    ],
    "correct_answer": "batu kapur",
    "explanation": "Marmar ialah batuan metamorfik yang terbentuk apabila batu kapur (batuan sedimen) mengalami haba dan tekanan yang tinggi.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "batuan metamorfik",
      "marmar",
      "batu kapur"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000015",
    "chapter": 6,
    "chapter_title": "Batuan",
    "question_text": "Benar atau Salah: Kitaran batuan menunjukkan bahawa ketiga-tiga jenis batuan boleh bertukar antara satu sama lain melalui proses semula jadi.",
    "question_type": "true_false",
    "options": null,
    "correct_answer": "Benar",
    "explanation": "Kitaran batuan menunjukkan batuan igneus, sedimen, dan metamorfik saling bertukar melalui proses seperti luluhawa, hakisan, pemendapan, haba, tekanan, dan peleburan.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "kitaran batuan",
      "jenis batuan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000016",
    "chapter": 7,
    "chapter_title": "Luluhawa",
    "question_text": "Yang manakah merupakan contoh luluhawa mekanikal?",
    "question_type": "mcq",
    "options": [
      "Tindakan asid ke atas batu kapur",
      "Akar pokok memecahkan batuan",
      "Pembekuan dan pencairan air dalam rekahan",
      "Tindakan bakteria menguraikan batuan"
    ],
    "correct_answer": "Pembekuan dan pencairan air dalam rekahan",
    "explanation": "Luluhawa mekanikal (fizikal) melibatkan pemecahan batuan secara fizikal tanpa mengubah komposisi kimia. Pembekuan dan pencairan air dalam rekahan memecahkan batuan melalui pengembangan isi padu.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "luluhawa mekanikal",
      "pembekuan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000017",
    "chapter": 7,
    "chapter_title": "Luluhawa",
    "question_text": "Luluhawa kimia berlaku dengan lebih cepat di kawasan ______.",
    "question_type": "mcq",
    "options": [
      "beriklim sejuk dan kering",
      "beriklim panas dan lembap",
      "beriklim sederhana",
      "kutub"
    ],
    "correct_answer": "beriklim panas dan lembap",
    "explanation": "Iklim panas dan lembap mempercepatkan tindak balas kimia antara air, gas, dan mineral batuan. Suhu tinggi dan kelembapan yang banyak meningkatkan kadar luluhawa kimia.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "luluhawa kimia",
      "iklim"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000018",
    "chapter": 7,
    "chapter_title": "Luluhawa",
    "question_text": "Apakah jenis luluhawa yang berlaku apabila akar tumbuhan meresap ke dalam rekahan batuan dan memecahkannya?",
    "question_type": "mcq",
    "options": [
      "Luluhawa mekanikal",
      "Luluhawa kimia",
      "Luluhawa biologi",
      "Hakisan"
    ],
    "correct_answer": "Luluhawa biologi",
    "explanation": "Tindakan akar tumbuhan yang meresap ke dalam rekahan batuan dan memecahkannya ialah contoh luluhawa biologi kerana melibatkan organisma hidup.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "luluhawa biologi",
      "akar tumbuhan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000019",
    "chapter": 8,
    "chapter_title": "Gerakan Jisim",
    "question_text": "Yang manakah antara berikut merupakan jenis gerakan jisim yang paling cepat?",
    "question_type": "mcq",
    "options": [
      "Rayapan tanah",
      "Gelungsur tanah",
      "Aliran lumpur",
      "Runtuhan batu"
    ],
    "correct_answer": "Runtuhan batu",
    "explanation": "Runtuhan batu (rockfall) ialah gerakan jisim yang paling pantas kerana bahan batuan jatuh secara bebas dari tebing atau cerun curam akibat graviti.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "gerakan jisim",
      "runtuhan batu"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000020",
    "chapter": 8,
    "chapter_title": "Gerakan Jisim",
    "question_text": "Nyatakan dua faktor yang menyebabkan gelungsur tanah berlaku.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "Cerun curam dan hujan lebat",
    "explanation": "Gelungsur tanah berlaku apabila tanah yang tepu air di cerun curam bergerak ke bawah akibat graviti. Faktor lain termasuk penyahutanan, aktiviti pembinaan, dan gempa bumi.",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "gelungsur tanah",
      "faktor"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000021",
    "chapter": 9,
    "chapter_title": "Sungai",
    "question_text": "Apakah proses sungai yang membentuk air terjun?",
    "question_type": "mcq",
    "options": [
      "Pemendapan",
      "Hakisan menegak",
      "Pengangkutan",
      "Hakisan sisi"
    ],
    "correct_answer": "Hakisan menegak",
    "explanation": "Air terjun terbentuk apabila sungai menghakis batuan lembut secara menegak dengan lebih cepat daripada batuan keras, mewujudkan perbezaan aras yang curam.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "hakisan menegak",
      "air terjun"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000022",
    "chapter": 9,
    "chapter_title": "Sungai",
    "question_text": "Dataran banjir terbentuk melalui proses ______ di bahagian ______ sungai.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "pemendapan, hilir",
    "explanation": "Dataran banjir terbentuk apabila sungai melimpah dan mendapkan kelodak di kawasan rata di bahagian hilir. Proses ini berulang setiap kali banjir berlaku.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "dataran banjir",
      "pemendapan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000023",
    "chapter": 9,
    "chapter_title": "Sungai",
    "question_text": "Liku sungai (meander) terbentuk kerana gabungan proses hakisan sisi di bahagian ______ dan pemendapan di bahagian ______ sungai.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "luar, dalam",
    "explanation": "Di bahagian luar liku, halaju air lebih deras menyebabkan hakisan sisi. Di bahagian dalam, halaju air perlahan menyebabkan pemendapan. Gabungan ini membentuk liku sungai.",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "liku sungai",
      "hakisan sisi",
      "pemendapan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000024",
    "chapter": 10,
    "chapter_title": "Ombak",
    "question_text": "Yang manakah merupakan bentuk muka bumi hasil hakisan ombak?",
    "question_type": "mcq",
    "options": [
      "Tombolo",
      "Gua laut",
      "Tetanjung pasir",
      "Pantai berpasir"
    ],
    "correct_answer": "Gua laut",
    "explanation": "Gua laut terbentuk apabila ombak menghakis bahagian lemah tebing pantai secara berterusan. Hakisan membentuk lohong yang semakin besar menjadi gua.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "hakisan ombak",
      "gua laut"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000025",
    "chapter": 10,
    "chapter_title": "Ombak",
    "question_text": "Susunkan urutan pembentukan bentuk muka bumi hakisan ombak yang betul.",
    "question_type": "mcq",
    "options": [
      "Gua - Gerbang Laut - Tunggul Laut - Takuk Ombak",
      "Takuk Ombak - Gua - Gerbang Laut - Tunggul Laut",
      "Tunggul Laut - Gerbang Laut - Gua - Takuk Ombak",
      "Gerbang Laut - Gua - Takuk Ombak - Tunggul Laut"
    ],
    "correct_answer": "Takuk Ombak - Gua - Gerbang Laut - Tunggul Laut",
    "explanation": "Hakisan ombak bermula dengan membentuk takuk ombak di kaki tebing, kemudian berkembang menjadi gua. Gua yang menembusi tebing membentuk gerbang laut. Apabila gerbang runtuh, tunggul laut terbentuk.",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "hakisan ombak",
      "urutan pembentukan"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000026",
    "chapter": 10,
    "chapter_title": "Ombak",
    "question_text": "Benar atau Salah: Tombolo terbentuk apabila bahan endapan menghubungkan daratan dengan sebuah pulau.",
    "question_type": "true_false",
    "options": null,
    "correct_answer": "Benar",
    "explanation": "Tombolo ialah bentuk muka bumi pemendapan ombak yang terbentuk apabila bahan endapan seperti pasir terkumpul dan menghubungkan daratan utama dengan sebuah pulau berdekatan.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "tombolo",
      "pemendapan ombak"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000027",
    "chapter": 11,
    "chapter_title": "Taburan Penduduk",
    "question_text": "Kawasan tanah pamah lembangan sungai biasanya mempunyai taburan penduduk yang ______.",
    "question_type": "mcq",
    "options": [
      "jarang",
      "padat",
      "tiada penduduk",
      "sama rata"
    ],
    "correct_answer": "padat",
    "explanation": "Kawasan tanah pamah lembangan sungai mempunyai tanah subur, sumber air yang mencukupi, dan mudah dihubungi, menjadikannya kawasan yang padat penduduknya.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "taburan penduduk",
      "tanah pamah"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000028",
    "chapter": 11,
    "chapter_title": "Taburan Penduduk",
    "question_text": "Yang manakah merupakan faktor manusia yang mempengaruhi taburan penduduk?",
    "question_type": "mcq",
    "options": [
      "Bentuk muka bumi",
      "Peluang pekerjaan",
      "Iklim",
      "Jenis tanah"
    ],
    "correct_answer": "Peluang pekerjaan",
    "explanation": "Faktor manusia termasuk peluang pekerjaan, kemudahan pengangkutan, dan dasar kerajaan. Bentuk muka bumi, iklim, dan jenis tanah ialah faktor fizikal.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "taburan penduduk",
      "faktor manusia"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000029",
    "chapter": 11,
    "chapter_title": "Taburan Penduduk",
    "question_text": "Jelaskan mengapa kawasan pedalaman Sarawak mempunyai taburan penduduk yang jarang.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "Bentuk muka bumi bergunung-ganang, hutan tebal, dan kurang kemudahan asas",
    "explanation": "Kawasan pedalaman Sarawak mempunyai bentuk muka bumi yang bergunung-ganang dan diliputi hutan tebal. Kekurangan kemudahan asas, jalan raya, dan peluang pekerjaan menyebabkan penduduk kurang tertarik untuk menetap.",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "taburan penduduk",
      "Sarawak",
      "kawasan jarang"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000030",
    "chapter": 12,
    "chapter_title": "Pertumbuhan Penduduk",
    "question_text": "Pertambahan semula jadi penduduk dikira dengan formula ______.",
    "question_type": "mcq",
    "options": [
      "Kadar kelahiran + Kadar kematian",
      "Kadar kelahiran - Kadar kematian",
      "Kadar imigrasi - Kadar emigrasi",
      "Jumlah penduduk / Luas kawasan"
    ],
    "correct_answer": "Kadar kelahiran - Kadar kematian",
    "explanation": "Pertambahan semula jadi ialah perbezaan antara kadar kelahiran dan kadar kematian dalam sesebuah negara. Jika kadar kelahiran lebih tinggi, penduduk bertambah secara semula jadi.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "pertambahan semula jadi",
      "kadar kelahiran",
      "kadar kematian"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000031",
    "chapter": 12,
    "chapter_title": "Pertumbuhan Penduduk",
    "question_text": "Piramid penduduk yang mempunyai tapak lebar dan puncak runcing menunjukkan negara yang mempunyai ______.",
    "question_type": "mcq",
    "options": [
      "kadar kelahiran rendah dan jangka hayat panjang",
      "kadar kelahiran tinggi dan kadar kematian tinggi",
      "kadar kelahiran rendah dan kadar kematian rendah",
      "penduduk tua yang ramai"
    ],
    "correct_answer": "kadar kelahiran tinggi dan kadar kematian tinggi",
    "explanation": "Piramid penduduk bertapak lebar menunjukkan ramai penduduk muda (kadar kelahiran tinggi) dan puncak runcing menunjukkan sedikit penduduk tua (kadar kematian tinggi atau jangka hayat pendek). Ini tipikal negara sedang membangun.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "piramid penduduk",
      "negara membangun"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000032",
    "chapter": 13,
    "chapter_title": "Migrasi",
    "question_text": "Yang manakah merupakan faktor penolak migrasi?",
    "question_type": "mcq",
    "options": [
      "Peluang pekerjaan yang banyak",
      "Kemudahan pendidikan yang lengkap",
      "Bencana alam",
      "Upah yang tinggi"
    ],
    "correct_answer": "Bencana alam",
    "explanation": "Faktor penolak (push factor) ialah keadaan negatif yang menyebabkan penduduk berpindah dari sesuatu tempat, seperti bencana alam, kemiskinan, dan konflik.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "migrasi",
      "faktor penolak"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000033",
    "chapter": 13,
    "chapter_title": "Migrasi",
    "question_text": "Benar atau Salah: Migrasi dalaman berlaku apabila penduduk berpindah dari satu negara ke negara lain.",
    "question_type": "true_false",
    "options": null,
    "correct_answer": "Salah",
    "explanation": "Migrasi dalaman (internal migration) berlaku dalam sempadan sebuah negara sahaja, contohnya dari luar bandar ke bandar. Perpindahan ke negara lain ialah migrasi antarabangsa.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "migrasi dalaman",
      "migrasi antarabangsa"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000034",
    "chapter": 13,
    "chapter_title": "Migrasi",
    "question_text": "Perpindahan penduduk luar bandar ke kawasan bandar di Malaysia membawa kesan positif dan negatif. Nyatakan satu kesan negatif kepada kawasan luar bandar.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "Kekurangan tenaga kerja muda di kawasan luar bandar",
    "explanation": "Apabila penduduk muda berpindah ke bandar untuk mencari pekerjaan, kawasan luar bandar mengalami kekurangan tenaga kerja produktif. Ini menyebabkan sektor pertanian terbiar dan pembangunan terbantut.",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "migrasi luar bandar ke bandar",
      "kesan negatif"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000035",
    "chapter": 14,
    "chapter_title": "Petempatan",
    "question_text": "Pola petempatan memanjang biasanya terbentuk di sepanjang ______.",
    "question_type": "mcq",
    "options": [
      "puncak bukit",
      "jalan raya atau sungai",
      "kawasan pedalaman",
      "kawasan perindustrian"
    ],
    "correct_answer": "jalan raya atau sungai",
    "explanation": "Petempatan memanjang (linear) terbentuk apabila rumah dibina berturutan di sepanjang laluan pengangkutan seperti jalan raya atau tebing sungai.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "pola petempatan",
      "memanjang"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000036",
    "chapter": 14,
    "chapter_title": "Petempatan",
    "question_text": "Apakah perbezaan antara pola petempatan berpusat dan berselerak?",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "Berpusat - rumah berkelompok di sekitar satu pusat; Berselerak - rumah tersebar jauh antara satu sama lain",
    "explanation": "Petempatan berpusat (nucleated) mempunyai rumah yang berkumpul rapat di sekitar satu titik pusat seperti pekan atau simpang jalan. Petempatan berselerak (dispersed) mempunyai rumah yang tersebar jauh antara satu sama lain, biasanya di kawasan pertanian atau pedalaman.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "petempatan berpusat",
      "petempatan berselerak"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000037",
    "chapter": 15,
    "chapter_title": "Urbanisasi",
    "question_text": "Yang manakah antara berikut BUKAN masalah urbanisasi?",
    "question_type": "mcq",
    "options": [
      "Kesesakan lalu lintas",
      "Pencemaran udara",
      "Peningkatan hasil pertanian",
      "Kawasan setinggan"
    ],
    "correct_answer": "Peningkatan hasil pertanian",
    "explanation": "Peningkatan hasil pertanian bukan masalah urbanisasi. Masalah urbanisasi termasuk kesesakan lalu lintas, pencemaran, pertumbuhan kawasan setinggan, dan kekurangan perumahan.",
    "image_url": null,
    "difficulty": "easy",
    "tags": [
      "urbanisasi",
      "masalah bandar"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000038",
    "chapter": 15,
    "chapter_title": "Urbanisasi",
    "question_text": "Apakah maksud pembangunan lestari dalam konteks urbanisasi?",
    "question_type": "mcq",
    "options": [
      "Pembangunan pesat tanpa had",
      "Pembangunan yang memenuhi keperluan semasa tanpa menjejaskan generasi masa hadapan",
      "Pembangunan di kawasan luar bandar sahaja",
      "Pembangunan industri berat"
    ],
    "correct_answer": "Pembangunan yang memenuhi keperluan semasa tanpa menjejaskan generasi masa hadapan",
    "explanation": "Pembangunan lestari (sustainable development) bermaksud membangunkan kawasan bandar dengan cara yang memenuhi keperluan semasa tanpa menjejaskan keupayaan generasi akan datang memenuhi keperluan mereka.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "pembangunan lestari",
      "urbanisasi"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000039",
    "chapter": 15,
    "chapter_title": "Urbanisasi",
    "question_text": "Cadangkan dua langkah untuk mengurangkan masalah kesesakan lalu lintas di bandar raya.",
    "question_type": "fill_blank",
    "options": null,
    "correct_answer": "Menambah baik pengangkutan awam dan menggalakkan perkongsian kenderaan",
    "explanation": "Langkah lain termasuk membina lebuh raya baharu, melaksanakan sistem MRT/LRT, mengenakan caj kesesakan, dan menggalakkan bekerja dari rumah untuk mengurangkan bilangan kenderaan di jalan raya.",
    "image_url": null,
    "difficulty": "kbat",
    "tags": [
      "urbanisasi",
      "kesesakan lalu lintas",
      "penyelesaian"
    ]
  },
  {
    "id": "00000000-0000-0000-0000-000000000040",
    "chapter": 16,
    "chapter_title": "Kerja Lapangan",
    "question_text": "Susunkan langkah kerja lapangan yang betul.",
    "question_type": "mcq",
    "options": [
      "Pengumpulan data - Perancangan - Analisis - Rumusan",
      "Perancangan - Pengumpulan data - Analisis - Rumusan",
      "Analisis - Perancangan - Pengumpulan data - Rumusan",
      "Rumusan - Analisis - Pengumpulan data - Perancangan"
    ],
    "correct_answer": "Perancangan - Pengumpulan data - Analisis - Rumusan",
    "explanation": "Langkah kerja lapangan yang betul bermula dengan perancangan (menentukan tajuk, objektif, kawasan kajian), diikuti pengumpulan data di lapangan, analisis data yang diperoleh, dan akhirnya membuat rumusan.",
    "image_url": null,
    "difficulty": "standard",
    "tags": [
      "kerja lapangan",
      "langkah kajian"
    ]
  }
];
