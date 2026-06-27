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

async function checkTF() {
  const { data, error } = await supabase
    .from("sejarah_questions")
    .select("*")
    .eq("question_type", "true_false");
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Sejarah True/False questions in DB:", data.map(q => ({ id: q.id, text: q.question_text, ans: q.correct_answer })));
  }
}

checkTF();
