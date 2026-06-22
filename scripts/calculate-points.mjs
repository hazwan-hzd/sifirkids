import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local from sifirkids project
const envPath = "./.env.local";
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Define tables to check
  const tables = [
    { name: "quiz_sessions" },
    { name: "sejarah_quiz_results" },
    { name: "peribahasa_quiz_results" }
  ];

  const allRecords = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table.name).select("*");
      if (error) continue;
      for (const row of data) {
        allRecords.push({
          child_id: row.child_id,
          points: row.points_earned || 0,
          created_at: row.created_at,
          source: table.name
        });
      }
    } catch (e) {}
  }

  // Group by kid and date
  const kidDaily = {};

  for (const rec of allRecords) {
    const kid = rec.child_id.toLowerCase();
    const dateStr = rec.created_at.substring(0, 10);
    
    if (!kidDaily[kid]) {
      kidDaily[kid] = {};
    }
    if (!kidDaily[kid][dateStr]) {
      kidDaily[kid][dateStr] = { points: 0, count: 0 };
    }
    kidDaily[kid][dateStr].points += rec.points;
    kidDaily[kid][dateStr].count += 1;
  }

  console.log("\n================ DAILY BREAKDOWN ================\n");
  for (const kid of ["hafeeza", "dhiya", "ilyas"]) {
    console.log(`Kid: ${kid.toUpperCase()}`);
    const days = kidDaily[kid] || {};
    const sortedDates = Object.keys(days).sort();
    let totalPoints = 0;
    
    for (const d of sortedDates) {
      console.log(`  - ${d}: ${days[d].points} points (${days[d].count} quizzes)`);
      totalPoints += days[d].points;
    }
    
    const activeDays = sortedDates.length;
    const avgPerDay = activeDays > 0 ? totalPoints / activeDays : 0;
    console.log(`  - Average points per active day: ${avgPerDay.toFixed(2)}`);
    console.log(`  - Extrapolated 30 days (100% active): ${(avgPerDay * 30).toFixed(0)}`);
    console.log(`  - Extrapolated 30 days (active 50% / 15 days): ${(avgPerDay * 15).toFixed(0)}`);
    console.log(`  - Extrapolated 30 days (active 33% / 10 days): ${(avgPerDay * 10).toFixed(0)}`);
    console.log("-----------------------------------------");
  }
}

run();
