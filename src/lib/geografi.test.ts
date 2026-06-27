// Clear Supabase Env Vars to force offline / null client
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";

import { fetchChapters, fetchQuestions } from "./geografi";
import { supabase } from "./supabase";

async function runTests() {
  console.log("=== GEOGRAFI OFFLINE FALLBACK TESTS ===");
  console.log("Supabase client is null:", supabase === null);
  
  let passed = true;
  
  // Test 1: fetchChapters
  try {
    const chapters = await fetchChapters();
    console.log(`fetchChapters() returned ${chapters.length} chapters.`);
    
    // Expecting 16 chapters
    if (chapters.length !== 16) {
      console.error(`❌ Test Failed: Expected 16 chapters, got ${chapters.length}`);
      passed = false;
    } else {
      console.log("✅ Chapter count is 16.");
    }
    
    // Verify specific chapters
    const expectedChapters = [
      { chapter: 1, title: 'Arah dan Kedudukan dalam Peta Topografi', count: 3 },
      { chapter: 2, title: 'Skala, Jarak dan Luas', count: 2 },
      { chapter: 3, title: 'Ketinggian dan Keratan Rentas', count: 2 },
      { chapter: 4, title: 'Pandang Darat', count: 2 },
      { chapter: 5, title: 'Pergerakan Plat Tektonik', count: 3 },
      { chapter: 6, title: 'Batuan', count: 3 },
      { chapter: 7, title: 'Luluhawa', count: 3 },
      { chapter: 8, title: 'Gerakan Jisim', count: 2 },
      { chapter: 9, title: 'Sungai', count: 3 },
      { chapter: 10, title: 'Ombak', count: 3 },
      { chapter: 11, title: 'Taburan Penduduk', count: 3 },
      { chapter: 12, title: 'Pertumbuhan Penduduk', count: 2 },
      { chapter: 13, title: 'Migrasi', count: 3 },
      { chapter: 14, title: 'Petempatan', count: 2 },
      { chapter: 15, title: 'Urbanisasi', count: 3 },
      { chapter: 16, title: 'Kerja Lapangan', count: 1 }
    ];
    
    for (const expected of expectedChapters) {
      const ch = chapters.find(c => c.chapter === expected.chapter);
      if (!ch) {
        console.error(`❌ Test Failed: Chapter ${expected.chapter} is missing`);
        passed = false;
      } else if (ch.chapter_title !== expected.title) {
        console.error(`❌ Test Failed: Chapter ${expected.chapter} title mismatch. Expected "${expected.title}", got "${ch.chapter_title}"`);
        passed = false;
      } else if (ch.questionCount !== expected.count) {
        console.error(`❌ Test Failed: Chapter ${expected.chapter} ("${expected.title}") question count mismatch. Expected ${expected.count}, got ${ch.questionCount}`);
        passed = false;
      } else {
        console.log(`✅ Chapter ${expected.chapter} ("${expected.title}") matches. Questions: ${ch.questionCount}`);
      }
    }
  } catch (err) {
    console.error("❌ Test Failed with error in fetchChapters:", err);
    passed = false;
  }
  
  // Test 2: fetchQuestions for all chapters (full mode)
  try {
    const chaptersToTest = Array.from({ length: 16 }, (_, i) => i + 1);
    const expectedCounts: Record<number, number> = {
      1: 3, 2: 2, 3: 2, 4: 2, 5: 3, 6: 3, 7: 3, 8: 2, 9: 3, 10: 3, 11: 3, 12: 2, 13: 3, 14: 2, 15: 3, 16: 1
    };
    
    for (const chNum of chaptersToTest) {
      const questions = await fetchQuestions(chNum, "full");
      const expectedCount = expectedCounts[chNum];
      
      if (questions.length !== expectedCount) {
        console.error(`❌ Test Failed: Chapter ${chNum} fetchQuestions("full") returned ${questions.length} questions, expected ${expectedCount}`);
        passed = false;
      } else {
        console.log(`✅ Chapter ${chNum} fetchQuestions("full") returned correct count: ${questions.length}`);
        
        // Assert question structures
        for (const q of questions) {
          if (q.chapter !== chNum) {
            console.error(`❌ Test Failed: Question ID ${q.id} has chapter ${q.chapter}, expected ${chNum}`);
            passed = false;
          }
          if (!q.id.startsWith("00000000-0000-0000-0000-")) {
            console.error(`❌ Test Failed: Question ID ${q.id} is not a valid fallback ID`);
            passed = false;
          }
          if (!q.question_text) {
            console.error(`❌ Test Failed: Question ID ${q.id} has empty question text`);
            passed = false;
          }
          if (q.question_type === "mcq" && (!q.options || q.options.length === 0)) {
            console.error(`❌ Test Failed: MCQ Question ID ${q.id} has no options`);
            passed = false;
          }
          if (!q.correct_answer) {
            console.error(`❌ Test Failed: Question ID ${q.id} has no correct answer`);
            passed = false;
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Test Failed with error in fetchQuestions:", err);
    passed = false;
  }

  // Test 3: fetchQuestions (quick mode) should slice at 10 (or less if not enough questions)
  try {
    const questions = await fetchQuestions(1, "quick");
    if (questions.length !== 3) {
      console.error(`❌ Test Failed: Chapter 1 fetchQuestions("quick") returned ${questions.length} questions, expected 3`);
      passed = false;
    } else {
      console.log(`✅ Chapter 1 fetchQuestions("quick") returned correct count: 3`);
    }
  } catch (err) {
    console.error("❌ Test Failed with error in fetchQuestions quick mode:", err);
    passed = false;
  }

  if (passed) {
    console.log("\n🎉 ALL GEOGRAFI OFFLINE FALLBACK TESTS PASSED!");
    process.exit(0);
  } else {
    console.log("\n❌ SOME GEOGRAFI OFFLINE FALLBACK TESTS FAILED!");
    process.exit(1);
  }
}

runTests();
