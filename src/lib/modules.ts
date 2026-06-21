import { supabase } from "./supabase";
import { shuffle } from "./utils";
import type { ColorKey, Grade, ModuleId } from "./types";

/* ------------------------------------------------------------------ */
/* Generic subject-quiz engine.                                       */
/*                                                                    */
/* Sains and the other KSSR/KSSM subjects all share ONE content       */
/* schema (`module_questions` / `module_results` / `module_answer_log`*/
/* tables) keyed by (module, grade). A child only ever sees content   */
/* tagged for their own grade — see CHILD_GRADE in data.ts.           */
/*                                                                    */
/* This keeps every new subject a thin config entry + route instead   */
/* of a bespoke 700-line page like the older Sejarah/Peribahasa ones. */
/* ------------------------------------------------------------------ */

/** Module keys handled by the generic engine (subset of ModuleId). */
export type SubjectKey =
  | "sains"
  | "matematik"
  | "english"
  | "bahasamelayu"
  | "pendidikanislam"
  | "sivik"
  | "geografi";

export interface SubjectDef {
  key: SubjectKey;
  /** display title (BM) */
  title: string;
  /** one-line description shown on the hub card */
  subtitle: string;
  emoji: string;
  color: ColorKey;
  /** grades this subject is offered for */
  grades: Grade[];
}

/**
 * The seven subjects, level-tailored. A subject's card only appears for a
 * child whose grade is listed in `grades`.
 */
export const SUBJECTS: SubjectDef[] = [
  {
    key: "sains",
    title: "Sains",
    subtitle: "Eksperimen, alam & badan kita",
    emoji: "🔬",
    color: "teal",
    grades: ["std1", "std4", "form3"],
  },
  {
    key: "matematik",
    title: "Matematik",
    subtitle: "Nombor, bentuk & ukuran",
    emoji: "➗",
    color: "sky",
    grades: ["std1", "std4", "form3"],
  },
  {
    key: "english",
    title: "Bahasa Inggeris",
    subtitle: "Vocabulary, grammar & reading",
    emoji: "🔤",
    color: "grape",
    grades: ["std1", "std4", "form3"],
  },
  {
    key: "bahasamelayu",
    title: "Bahasa Melayu",
    subtitle: "Tatabahasa & kefahaman",
    emoji: "📚",
    color: "coral",
    grades: ["std1", "std4", "form3"],
  },
  {
    key: "pendidikanislam",
    title: "Pendidikan Islam",
    subtitle: "Akidah, ibadah & akhlak",
    emoji: "🕌",
    color: "sunny",
    grades: ["std1", "std4", "form3"],
  },
  {
    key: "sivik",
    title: "Pendidikan Sivik",
    subtitle: "Nilai, hak & tanggungjawab",
    emoji: "🤝",
    color: "grape",
    grades: ["std4", "form3"],
  },
  {
    key: "geografi",
    title: "Geografi",
    subtitle: "Bumi, cuaca & peta",
    emoji: "🌍",
    color: "sky",
    grades: ["form3"],
  },
];

export function getSubject(key: string): SubjectDef | undefined {
  return SUBJECTS.find((s) => s.key === key);
}

/** Subjects available to a given grade, in display order. */
export function subjectsForGrade(grade: Grade): SubjectDef[] {
  return SUBJECTS.filter((s) => s.grades.includes(grade));
}

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface ModuleQuestion {
  id: string;
  module: string;
  grade: Grade;
  chapter: number;
  chapter_title: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "fill_blank";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: "easy" | "standard" | "kbat";
}

export interface ModuleQuizResult {
  id: string;
  child_id: string;
  module: string;
  grade: Grade;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number | null;
  points_earned: number | null;
  created_at: string;
}

/** Chapter metadata derived from the question bank. */
export interface ChapterInfo {
  chapter: number;
  chapter_title: string;
  questionCount: number;
}

export type QuizMode = "quick" | "full";
const QUICK_QUIZ_COUNT = 10;

/* ------------------------------------------------------------------ */
/* Queries                                                            */
/* ------------------------------------------------------------------ */

/** Chapters (with counts) available for a module + grade. */
export async function fetchChapters(
  module: SubjectKey,
  grade: Grade,
): Promise<ChapterInfo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("module_questions")
    .select("chapter, chapter_title")
    .eq("module", module)
    .eq("grade", grade);
  if (error) {
    console.error(`Error fetching ${module} chapters:`, error);
    return [];
  }
  const rows = (data ?? []) as Array<{ chapter: number; chapter_title: string }>;
  const map = new Map<number, { title: string; count: number }>();
  for (const r of rows) {
    const existing = map.get(r.chapter);
    if (existing) existing.count++;
    else map.set(r.chapter, { title: r.chapter_title, count: 1 });
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([chapter, { title, count }]) => ({
      chapter,
      chapter_title: title,
      questionCount: count,
    }));
}

/** IDs of questions this child has already answered for a module+chapter. */
async function fetchSeenQuestionIds(
  childId: string,
  module: SubjectKey,
  chapter: number,
): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data, error } = await supabase
    .from("module_answer_log")
    .select("question_id, result_id!inner(child_id, module, chapter)")
    .eq("result_id.child_id", childId)
    .eq("result_id.module", module)
    .eq("result_id.chapter", chapter);
  if (error) {
    // Non-fatal: just means we won't prioritize unseen questions.
    return new Set();
  }
  return new Set((data ?? []).map((r: { question_id: string }) => r.question_id));
}

/**
 * Questions for a chapter, with unseen-first smart ordering.
 * - "quick" mode returns up to QUICK_QUIZ_COUNT questions.
 * - "full" mode returns the whole chapter.
 */
export async function fetchQuestions(
  module: SubjectKey,
  grade: Grade,
  chapter: number,
  mode: QuizMode = "quick",
  childId?: string,
): Promise<ModuleQuestion[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("module_questions")
    .select("*")
    .eq("module", module)
    .eq("grade", grade)
    .eq("chapter", chapter)
    .order("created_at");
  if (error) {
    console.error(`Error fetching ${module} questions:`, error);
    return [];
  }
  const all = (data ?? []) as ModuleQuestion[];

  const seen = childId
    ? await fetchSeenQuestionIds(childId, module, chapter)
    : new Set<string>();
  const unseenPool = shuffle(all.filter((q) => !seen.has(q.id)));
  const seenPool = shuffle(all.filter((q) => seen.has(q.id)));
  const prioritized = [...unseenPool, ...seenPool];

  return mode === "full" ? prioritized : prioritized.slice(0, QUICK_QUIZ_COUNT);
}

/** Past results for a child + module (newest first). */
export async function fetchResults(
  childId: string,
  module: SubjectKey,
  grade: Grade,
): Promise<ModuleQuizResult[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("module_results")
    .select("*")
    .eq("child_id", childId)
    .eq("module", module)
    .eq("grade", grade)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error(`Error fetching ${module} results:`, error);
    return [];
  }
  return (data ?? []) as ModuleQuizResult[];
}

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export async function logResult(result: {
  child_id: string;
  module: SubjectKey;
  grade: Grade;
  chapter: number;
  total_questions: number;
  correct_answers: number;
  duration_sec: number;
  points_earned: number;
}): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("module_results")
    .insert(result)
    .select("id")
    .single();
  if (error) {
    console.error(`Error logging ${result.module} result:`, error);
    return null;
  }
  return data?.id ?? null;
}

export async function logAnswers(
  resultId: string,
  answers: Array<{
    question_id: string;
    given_answer: string;
    is_correct: boolean;
    response_time_ms: number;
  }>,
): Promise<void> {
  if (!supabase || answers.length === 0) return;
  const rows = answers.map((a) => ({ ...a, result_id: resultId }));
  const { error } = await supabase.from("module_answer_log").insert(rows);
  if (error) {
    console.error("Error logging module answers:", error);
  }
}

/** ModuleId guard so callers can pass a SubjectKey to recordQuiz safely. */
export function asModuleId(key: SubjectKey): ModuleId {
  return key;
}
