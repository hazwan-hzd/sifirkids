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

async function fixTaim() {
  console.log("=== FIXING TAIM TYPO IN DB ===");
  try {
    const { data: before, error: getError } = await supabase
      .from("pafakafa_questions")
      .select("*")
      .eq("id", "c8074d30-6b71-4fbe-981a-989a91c58178")
      .single();

    if (getError) {
      console.error("Error retrieving question:", getError.message);
      return;
    }

    console.log("Before update options:", before.options);

    const updatedOptions = ["Tahun ke-4 Hijrah", "Tahun ke-6 Hijrah", "Tahun ke-8 Hijrah", "Tahun ke-10 Hijrah"];
    const { data: after, error: updateError } = await supabase
      .from("pafakafa_questions")
      .update({ options: updatedOptions })
      .eq("id", "c8074d30-6b71-4fbe-981a-989a91c58178")
      .select()
      .single();

    if (updateError) {
      console.error("Error updating question:", updateError.message);
    } else {
      console.log("Success! Updated options:", after.options);
    }

  } catch (err) {
    console.error("Fix failed:", err);
  }
}

fixTaim();
