import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const T1_PERIBAHASA = [
  { peribahasa: "Bagai aur dengan tebing", maksud: "Saling membantu antara satu sama lain", tema: "Hubungan" },
  { peribahasa: "Bagai cincin dengan permata", maksud: "Pasangan yang sama cantik dan sepadan", tema: "Hubungan" },
  { peribahasa: "Bagai layang-layang putus tali", maksud: "Hilang arah tuju atau putus harapan", tema: "Nasihat" },
  { peribahasa: "Bagaimana acuan begitulah kuihnya", maksud: "Anak menurut baka atau perangai ibu bapa", tema: "Keluarga" },
  { peribahasa: "Bagai minyak dengan air", maksud: "Tidak sehaluan atau tidak bercampur", tema: "Hubungan" },
  { peribahasa: "Bagai menatang minyak yang penuh", maksud: "Memelihara dengan penuh kasih sayang", tema: "Keluarga" },
  { peribahasa: "Bagai cendawan tumbuh selepas hujan", maksud: "Terlalu banyak pada sesuatu masa", tema: "Am" },
  { peribahasa: "Seperti lipas kudung", maksud: "Bergerak dengan pantas dan cekap", tema: "Am" },
  { peribahasa: "Bagai murai dicabut ekor", maksud: "Suka bercakap banyak atau becok", tema: "Sifat" },
  { peribahasa: "Bagai pucuk dilancarkan", maksud: "Pergerakan sangat pantas", tema: "Am" },
  { peribahasa: "Tempat jatuh lagi dikenang, inikan pula tempat bermain", maksud: "Tempat asal sentiasa diingati", tema: "Jati Diri" },
  { peribahasa: "Tangan terbuka", maksud: "Menerima dengan senang hati", tema: "Sifat" },
  { peribahasa: "Besar hati", maksud: "Berasa bangga atau sombong", tema: "Sifat" },
  { peribahasa: "Buah tangan", maksud: "Hadiah ketika melawat", tema: "Am" },
  { peribahasa: "Bulat hati", maksud: "Azam bersungguh-sungguh", tema: "Sifat" },
  { peribahasa: "Ringan mulut", maksud: "Suka bercakap atau ramah mesra", tema: "Sifat" },
  { peribahasa: "Tajam akal", maksud: "Pintar atau cerdas", tema: "Sifat" },
  { peribahasa: "Ambil berat", maksud: "Memberikan perhatian serius", tema: "Sifat" },
  { peribahasa: "Sagu hati", maksud: "Hadiah tanda penghargaan", tema: "Am" },
  { peribahasa: "Putus asa", maksud: "Hilang harapan atau kecewa", tema: "Sifat" },
  { peribahasa: "Berpeluk tubuh", maksud: "Malas berusaha", tema: "Sifat" },
  { peribahasa: "Hancur hati", maksud: "Sangat sedih atau kecewa", tema: "Sifat" },
  { peribahasa: "Tali barut", maksud: "Suruhan pihak lain untuk dapatkan rahsia", tema: "Am" },
  { peribahasa: "Mencari akal", maksud: "Berusaha memikirkan cara menyelesaikan masalah", tema: "Sifat" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(peribahasaList) {
  const questions = [];

  for (const p of peribahasaList) {
    // Type 1: Situasi → Peribahasa (MCQ)
    const wrongOptions1 = shuffleArray(
      peribahasaList.filter((x) => x.peribahasa !== p.peribahasa)
    )
      .slice(0, 3)
      .map((x) => x.peribahasa);

    const allOptions1 = shuffleArray([p.peribahasa, ...wrongOptions1]);

    questions.push({
      tingkatan: 1,
      tema: p.tema,
      peribahasa: p.peribahasa,
      maksud: p.maksud,
      question_type: "situasi_to_peribahasa",
      question_text: `Apakah peribahasa yang bermaksud: "${p.maksud}"?`,
      options: JSON.stringify(allOptions1),
      correct_answer: p.peribahasa,
      explanation: `"${p.peribahasa}" bermaksud ${p.maksud.toLowerCase()}.`,
      difficulty: "standard",
    });

    // Type 2: Peribahasa → Maksud (MCQ)
    const wrongOptions2 = shuffleArray(
      peribahasaList.filter((x) => x.peribahasa !== p.peribahasa)
    )
      .slice(0, 3)
      .map((x) => x.maksud);

    const allOptions2 = shuffleArray([p.maksud, ...wrongOptions2]);

    questions.push({
      tingkatan: 1,
      tema: p.tema,
      peribahasa: p.peribahasa,
      maksud: p.maksud,
      question_type: "peribahasa_to_maksud",
      question_text: `Apakah maksud peribahasa "${p.peribahasa}"?`,
      options: JSON.stringify(allOptions2),
      correct_answer: p.maksud,
      explanation: `"${p.peribahasa}" bermaksud ${p.maksud.toLowerCase()}.`,
      difficulty: "easy",
    });
  }

  return questions;
}

async function main() {
  console.log("Generating Tingkatan 1 peribahasa questions...");
  const questions = generateQuestions(T1_PERIBAHASA);
  console.log(`Generated ${questions.length} questions.`);

  // Insert in batches
  const batchSize = 20;
  let inserted = 0;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    const { error } = await supabase.from("peribahasa_questions").insert(batch);
    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} questions`);
    }
  }
  console.log(`Done. ${inserted} questions inserted for Tingkatan 1.`);
}

main();
