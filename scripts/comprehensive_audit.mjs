import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load env variables from the project .env.local
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

const PACK_COSTS = {
  "pack-starter": 1000,
  "pack-monsters": 3000,
  "pack-crews": 3000,
  "pack-my-hero": 5000,
  "pack-legendary": 8000,
  "pack-squishy": 2000,
  "pack-wc": 4000
};

// Points economy constants
const POINTS = {
  perCorrect: 10,
  perfectBonusPerQuestion: 5,
  streakBonus: 20,
  streakBonusAt: 5,
  dailyStreakBonus: 15
};

function computePoints(correct, total, bestStreak, moduleName) {
  const perfect = total > 0 && correct === total;
  let pts = correct * POINTS.perCorrect;
  if (perfect) pts += total * POINTS.perfectBonusPerQuestion;
  if (bestStreak >= POINTS.streakBonusAt) pts += POINTS.streakBonus;
  
  if (moduleName === "bahasa_melayu") {
    pts *= 2;
  }
  return pts;
}

let logContent = "";
function log(msg) {
  console.log(msg);
  logContent += msg + "\n";
}

async function run() {
  log("=== STARTING COMPREHENSIVE POINTS & STATE AUDIT ===");

  // 1. Fetch child profiles
  const { data: profiles, error: pError } = await supabase.from("child_profiles").select("*");
  if (pError) {
    log("Failed to fetch child profiles: " + pError.message);
    return;
  }
  log(`Fetched ${profiles.length} profiles.`);

  // 2. Fetch quiz_sessions
  const { data: quizSessions, error: qsError } = await supabase.from("quiz_sessions").select("*").order("created_at", { ascending: true });
  if (qsError) {
    log("Failed to fetch quiz sessions: " + qsError.message);
    return;
  }
  log(`Fetched ${quizSessions.length} general quiz sessions.`);

  // 3. Fetch module-specific tables
  const { data: sejarahResults } = await supabase.from("sejarah_quiz_results").select("*");
  const { data: peribahasaResults } = await supabase.from("peribahasa_quiz_results").select("*");
  const { data: bmResults } = await supabase.from("bm_quiz_results").select("*");
  const { data: pafakafaResults } = await supabase.from("pafakafa_quiz_results").select("*");

  // 4. Fetch TCG pull logs
  const { data: pullLogs } = await supabase.from("tcg_pull_log").select("*");
  log(`Fetched ${pullLogs.length} card pull log entries.`);

  // Analyze each child
  const children = ["hafeeza", "ilyas", "papa", "dhiya"];

  for (const cid of children) {
    log(`\n==================================================`);
    log(`AUDITING CHILD: ${cid.toUpperCase()}`);
    log(`==================================================`);

    const profile = profiles.find(p => p.id === cid);
    const dbTcg = profile?.tcg || {};
    log("DB Profile TCG State:");
    log(`  - Opened Packs Count: ${dbTcg.openedPacksCount || 0}`);
    log(`  - Spent Points in Profile: ${dbTcg.spentPoints || 0}`);

    // TCG pull logs analysis
    const kidPulls = pullLogs.filter(p => p.child_id === cid);
    // Group pulls by run_id/pulled_at/pack_type to identify distinct packs
    const packTypeCounts = {};
    for (const pull of kidPulls) {
      packTypeCounts[pull.pack_type] = (packTypeCounts[pull.pack_type] || 0) + 1;
    }
    
    log("TCG Pull Log Cards Count:");
    let calculatedSpentPoints = 0;
    let totalPacksCountFromPulls = 0;
    for (const [ptype, cardsCount] of Object.entries(packTypeCounts)) {
      const packs = cardsCount / 5;
      const cost = PACK_COSTS[ptype] || 0;
      const packCostTotal = packs * cost;
      calculatedSpentPoints += packCostTotal;
      totalPacksCountFromPulls += packs;
      log(`  - ${ptype}: ${cardsCount} cards (~${packs} packs, cost/pack: ${cost}, total: ${packCostTotal} pts)`);
    }
    log(`Calculated TCG Stats:`);
    log(`  - Calculated Packs Count: ${totalPacksCountFromPulls}`);
    log(`  - Calculated Spent Points: ${calculatedSpentPoints}`);
    
    if (dbTcg.spentPoints !== calculatedSpentPoints) {
      log(`  ⚠️ MISMATCH: spentPoints in DB is ${dbTcg.spentPoints} but calculated is ${calculatedSpentPoints}! Diff: ${calculatedSpentPoints - dbTcg.spentPoints}`);
    } else {
      log("  ✓ TCG Spent Points match pull logs.");
    }

    // Sessions audit
    const kidSessions = quizSessions.filter(s => s.child_id === cid);
    log(`Quiz Sessions Count (quiz_sessions): ${kidSessions.length}`);

    let totalPointsInDb = 0;
    let totalPointsRecalculated = 0;
    const dailySessions = {}; // date -> sessions list

    // To identify daily streak bonus, we track active days
    const activeDays = new Set();

    for (const s of kidSessions) {
      const dateKey = s.created_at.substring(0, 10);
      activeDays.add(dateKey);
      
      if (!dailySessions[dateKey]) {
        dailySessions[dateKey] = [];
      }
      dailySessions[dateKey].push(s);
      
      totalPointsInDb += s.points_earned;
    }

    // For points verification, sort daily sessions by time
    const sortedDays = Array.from(activeDays).sort();
    
    log("Verifying Points per Session:");
    let anomaliesCount = 0;
    
    for (const day of sortedDays) {
      const daySessions = dailySessions[day].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      for (let i = 0; i < daySessions.length; i++) {
        const s = daySessions[i];
        const isFirstSessionOfDay = (i === 0);
        
        // Recalculate
        const basePts = computePoints(s.correct_answers, s.total_questions, s.best_streak, s.module);
        const expectedPts = basePts + (isFirstSessionOfDay ? POINTS.dailyStreakBonus : 0);
        
        totalPointsRecalculated += expectedPts;
        
        const diff = s.points_earned - expectedPts;
        if (diff !== 0) {
          anomaliesCount++;
          log(`  ⚠️ ANOMALY on ${s.created_at} (${s.module} - ${s.topic}):`);
          log(`    DB Points: ${s.points_earned}`);
          log(`    Expected Points: ${expectedPts} (Base: ${basePts}, Daily Bonus: ${isFirstSessionOfDay ? POINTS.dailyStreakBonus : 0})`);
          log(`    Diff: ${diff}`);
          log(`    Stats: Correct: ${s.correct_answers}/${s.total_questions}, Streak: ${s.best_streak}`);
        }
      }
    }
    
    if (anomaliesCount === 0) {
      log("  ✓ All session points calculations are mathematically consistent.");
    } else {
      log(`  ⚠️ Total Anomalies found: ${anomaliesCount}`);
    }
    
    log(`Total Points in quiz_sessions: ${totalPointsInDb}`);
    log(`Total Points Recalculated: ${totalPointsRecalculated}`);

    // Check specific module table sums
    let moduleTablesSum = 0;
    if (cid === "dhiya") {
      const sejSum = sejarahResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      const periSum = peribahasaResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      const bmSum = bmResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      const pafaSum = pafakafaResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      moduleTablesSum = sejSum + periSum + bmSum + pafaSum;
      log(`Module tables sum: Sejarah: ${sejSum}, Peribahasa: ${periSum}, BM: ${bmSum}, PAFKAFA: ${pafaSum}. Total: ${moduleTablesSum}`);
    } else if (cid === "hafeeza") {
      const pafaSum = pafakafaResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      log(`Module tables sum: PAFKAFA: ${pafaSum}`);
    } else if (cid === "ilyas") {
      const periSum = peribahasaResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      const pafaSum = pafakafaResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      log(`Module tables sum: Peribahasa: ${periSum}, PAFKAFA: ${pafaSum}`);
    } else if (cid === "papa") {
      const pafaSum = pafakafaResults.filter(r => r.child_id === cid).reduce((sum, r) => sum + (r.points_earned || 0), 0);
      log(`Module tables sum: PAFKAFA: ${pafaSum}`);
    }
  }

  // Save log output
  fs.writeFileSync("/Users/hazwans./.gemini/antigravity/brain/1cf11d33-bf1d-4ceb-b5d3-cfafda0e68b8/scratch/audit_output.txt", logContent);
  log("\nWritten full log to /Users/hazwans./.gemini/antigravity/brain/1cf11d33-bf1d-4ceb-b5d3-cfafda0e68b8/scratch/audit_output.txt");
}

run();
