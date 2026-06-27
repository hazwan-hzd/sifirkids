import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read env variables
const envContent = fs.readFileSync("/Users/hazwans./dev/sifirkids/.env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || "").replace(/^"(.*)"$/, "$1");
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable(tableName) {
  console.log(`\n=== DB AUDIT: ${tableName.toUpperCase()} ===`);
  try {
    const { data: questions, error } = await supabase
      .from(tableName)
      .select("*");
    
    if (error) {
      console.error(`Error reading ${tableName}:`, error.message);
      return;
    }

    console.log(`Total questions in ${tableName}: ${questions.length}`);
    let errors = 0;
    questions.forEach(q => {
      if (q.question_type === "mcq") {
        if (!q.options || q.options.length === 0) {
          console.error(`[${tableName}] MCQ ID ${q.id} has no options!`);
          errors++;
        } else {
          const hasMatch = q.options.includes(q.correct_answer);
          if (!hasMatch) {
            console.error(`[${tableName}] MCQ ID ${q.id} option mismatch: correct_answer is "${q.correct_answer}", options:`, q.options);
            errors++;
          }
        }
      } else if (q.question_type === "true_false") {
        const correct = q.correct_answer?.toLowerCase();
        if (correct !== "benar" && correct !== "salah" && correct !== "true" && correct !== "false" && correct !== "betul") {
          console.error(`[${tableName}] T/F ID ${q.id} has invalid correct_answer: "${q.correct_answer}"`);
          errors++;
        }
      }
    });
    console.log(`${tableName} errors found: ${errors}`);
  } catch (err) {
    console.error(`Audit of ${tableName} failed:`, err);
  }
}

async function runAll() {
  await checkTable("pafakafa_questions");
  await checkTable("geografi_questions");
  await checkTable("sejarah_questions");
  await checkTable("peribahasa_questions");
  await checkTable("bm_questions");
}

runAll();
