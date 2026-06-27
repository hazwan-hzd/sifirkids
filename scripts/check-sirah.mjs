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

async function checkSirah() {
  const { data, error } = await supabase
    .from("pafakafa_questions")
    .select("*")
    .eq("level", "t4")
    .eq("chapter", 10);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Sirah Nabawiyah questions in DB:", JSON.stringify(data, null, 2));
  }
}

checkSirah();
