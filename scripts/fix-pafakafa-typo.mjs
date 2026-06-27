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

async function fixTypo() {
  console.log("=== FIXING PAFA KAFA TYPO IN DB ===");
  try {
    const { data: before, error: getError } = await supabase
      .from("pafakafa_questions")
      .select("*")
      .eq("id", "56dcfc8f-7770-4e85-9731-770eb8fb3e67")
      .single();

    if (getError) {
      console.error("Error retrieving question:", getError.message);
      return;
    }

    console.log("Before update:", before.correct_answer);

    const correctVal = "Memujuk Huda, menegur kawan-kawan yang mengejek, dan melaporkan kepada guru";
    const { data: after, error: updateError } = await supabase
      .from("pafakafa_questions")
      .update({ correct_answer: correctVal })
      .eq("id", "56dcfc8f-7770-4e85-9731-770eb8fb3e67")
      .select()
      .single();

    if (updateError) {
      console.error("Error updating question:", updateError.message);
    } else {
      console.log("Success! Updated correct_answer:", after.correct_answer);
    }

  } catch (err) {
    console.error("Fix failed:", err);
  }
}

fixTypo();
