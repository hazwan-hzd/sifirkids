import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const T2_PERIBAHASA = [
  { peribahasa: "Masuk kandang kambing mengembek, masuk kandang kerbau menguak", maksud: "Menyesuaikan diri dengan persekitaran", tema: "Kehidupan" },
  { peribahasa: "Bapa borek anak rintik", maksud: "Anak mengikut perangai ibu bapa", tema: "Keluarga" },
  { peribahasa: "Ke mana tumpahnya kuah, kalau tidak ke nasi", maksud: "Sifat anak serupa ibu bapanya", tema: "Keluarga" },
  { peribahasa: "Malang tidak berbau", maksud: "Malapetaka datang tanpa diduga", tema: "Nasihat" },
  { peribahasa: "Bulat air kerana pembetung, bulat manusia kerana muafakat", maksud: "Sepakat melalui perbincangan", tema: "Perpaduan" },
  { peribahasa: "Berat sama dipikul, ringan sama dijinjing", maksud: "Kerjasama dalam susah dan senang", tema: "Perpaduan" },
  { peribahasa: "Seperti katak bawah tempurung", maksud: "Kurang ilmu pengetahuan", tema: "Nasihat" },
  { peribahasa: "Ibarat cubit paha kanan, paha kiri terasa juga", maksud: "Pertalian erat sesama keluarga", tema: "Keluarga" },
  { peribahasa: "Ada ubi ada batas, ada hari boleh balas", maksud: "Jasa baik akan dibalas pada suatu hari nanti", tema: "Nasihat" },
  { peribahasa: "Tak kenal maka tak cinta", maksud: "Perlu mengenali sebelum menghargai", tema: "Hubungan" },
  { peribahasa: "Bagai langit dengan bumi", maksud: "Sangat jauh bezanya", tema: "Am" },
  { peribahasa: "Kalau tidak dipecahkan ruyung, manakan dapat sagunya", maksud: "Usaha diperlukan untuk mencapai kejayaan", tema: "Usaha" },
  { peribahasa: "Orang mengantuk disorongkan bantal", maksud: "Mendapat sesuatu tepat pada waktunya", tema: "Nasib" },
  { peribahasa: "Tepuk sebelah tangan takkan berbunyi", maksud: "Kerjasama memerlukan dua pihak", tema: "Perpaduan" },
  { peribahasa: "Indah khabar dari rupa", maksud: "Gambaran berlebihan dari keadaan sebenar", tema: "Nasihat" },
  { peribahasa: "Bersatu kita teguh, bercerai kita roboh", maksud: "Kekuatan terletak pada perpaduan", tema: "Perpaduan" },
  { peribahasa: "Harimau mati meninggalkan belang, manusia mati meninggalkan nama", maksud: "Nama baik atau buruk kekal selepas seseorang meninggal", tema: "Jati Diri" },
  { peribahasa: "Tepuk dada tanya selera", maksud: "Sesuaikan dengan kemampuan sendiri", tema: "Nasihat" },
  { peribahasa: "Bagai pungguk rindukan bulan", maksud: "Mengharapkan sesuatu yang mustahil dicapai", tema: "Am" },
  { peribahasa: "Tak lekang dek panas, tak lapuk dek hujan", maksud: "Adat atau hubungan yang tetap utuh sepanjang masa", tema: "Hubungan" },
  { peribahasa: "Rezeki jangan ditolak, maut jangan dicari", maksud: "Terima rezeki dan jangan cari bahaya", tema: "Nasihat" },
  { peribahasa: "Kata mesti dikota, janji mesti ditepati", maksud: "Jaga integriti kata-kata dan janji", tema: "Jati Diri" },
  { peribahasa: "Kalau takut dilambung ombak, jangan berumah di tepi pantai", maksud: "Berani menerima risiko dalam keputusan yang dibuat", tema: "Nasihat" },
  { peribahasa: "Datang seperti ribut, pergi seperti semut", maksud: "Datang banyak tetapi balik sedikit sahaja", tema: "Am" },
  { peribahasa: "Kecil tapak tangan, nyiru kami tadahkan", maksud: "Sanggup menerima apa sahaja yang diberikan", tema: "Rendah Diri" },
  { peribahasa: "Bagai enau dalam belukar, melepaskan pucuk masing-masing", maksud: "Tidak mempedulikan orang lain, pentingkan diri sendiri", tema: "Nasihat" },
  { peribahasa: "Rosak bawang ditimpa jambak", maksud: "Perkara kecil menjadi besar", tema: "Am" },
  { peribahasa: "Sebab budi boleh kedapatan", maksud: "Budi baik pasti akan dibalas dengan kebaikan", tema: "Hubungan" },
];

const T3_PERIBAHASA = [
  { peribahasa: "Air dicencang tidak akan putus", maksud: "Hubungan kekeluargaan tidak akan terputus walaupun bermasalah", tema: "Bermasyarakat" },
  { peribahasa: "Bagai beliung dengan asahan", maksud: "Dua perkara yang saling melengkapi", tema: "Bermasyarakat" },
  { peribahasa: "Biduk berlalu kiambang bertaut", maksud: "Sesuatu yang sudah berlalu akan dilupakan", tema: "Bermasyarakat" },
  { peribahasa: "Buang yang keruh, ambil yang jernih", maksud: "Tinggalkan yang buruk, ambil yang baik", tema: "Bermasyarakat" },
  { peribahasa: "Carik-carik bulu ayam, lama-lama bercantum juga", maksud: "Persengketaan dalam keluarga pasti akan berakhir dengan baik", tema: "Bermasyarakat" },
  { peribahasa: "Seperti isi dengan kuku", maksud: "Hubungan yang sangat rapat dan tidak boleh dipisahkan", tema: "Bermasyarakat" },
  { peribahasa: "Alah bisa, tegal biasa", maksud: "Perkara yang sukar menjadi mudah jika sudah biasa", tema: "Usaha" },
  { peribahasa: "Alang-alang menyeluk pekasam, biar sampai ke pangkal lengan", maksud: "Jika sudah mula berusaha, lakukanlah dengan sepenuhnya", tema: "Usaha" },
  { peribahasa: "Genggam bara api, biar sampai jadi arang", maksud: "Bersabar hingga sesuatu perkara selesai", tema: "Usaha" },
  { peribahasa: "Sambil menyelam minum air", maksud: "Melakukan dua perkara serentak untuk mendapat keuntungan", tema: "Usaha" },
  { peribahasa: "Sehari selembar benang, lama-lama menjadi kain", maksud: "Usaha yang sedikit-sedikit akhirnya membawa hasil", tema: "Usaha" },
  { peribahasa: "Ikut hati mati, ikut rasa binasa", maksud: "Jangan terlalu menurut perasaan dalam membuat keputusan", tema: "Nasihat" },
  { peribahasa: "Nasi sudah menjadi bubur", maksud: "Perkara yang sudah berlaku tidak boleh diubah lagi", tema: "Nasihat" },
  { peribahasa: "Sesal dahulu pendapatan, sesal kemudian tidak berguna", maksud: "Berfikir dahulu sebelum bertindak untuk mengelakkan penyesalan", tema: "Nasihat" },
  { peribahasa: "Sudah terhantuk baru tengadah", maksud: "Baru sedar kesalahan setelah mengalami akibatnya", tema: "Nasihat" },
  { peribahasa: "Ukur baju di badan sendiri", maksud: "Sesuaikan sesuatu dengan kemampuan diri sendiri", tema: "Nasihat" },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateQuestions(peribahasaList, tingkatan) {
  const questions = [];
  for (const p of peribahasaList) {
    const wrongOptions1 = shuffleArray(
      peribahasaList.filter((x) => x.peribahasa !== p.peribahasa)
    ).slice(0, 3).map((x) => x.peribahasa);
    const allOptions1 = shuffleArray([p.peribahasa, ...wrongOptions1]);
    questions.push({
      tingkatan, tema: p.tema, peribahasa: p.peribahasa, maksud: p.maksud,
      question_type: "situasi_to_peribahasa",
      question_text: `Apakah peribahasa yang bermaksud: "${p.maksud}"?`,
      options: JSON.stringify(allOptions1), correct_answer: p.peribahasa,
      explanation: `"${p.peribahasa}" bermaksud ${p.maksud.toLowerCase()}.`,
      difficulty: "standard",
    });
    const wrongOptions2 = shuffleArray(
      peribahasaList.filter((x) => x.peribahasa !== p.peribahasa)
    ).slice(0, 3).map((x) => x.maksud);
    const allOptions2 = shuffleArray([p.maksud, ...wrongOptions2]);
    questions.push({
      tingkatan, tema: p.tema, peribahasa: p.peribahasa, maksud: p.maksud,
      question_type: "peribahasa_to_maksud",
      question_text: `Apakah maksud peribahasa "${p.peribahasa}"?`,
      options: JSON.stringify(allOptions2), correct_answer: p.maksud,
      explanation: `"${p.peribahasa}" bermaksud ${p.maksud.toLowerCase()}.`,
      difficulty: "easy",
    });
  }
  return questions;
}

async function main() {
  console.log("Generating T2 questions...");
  const t2 = generateQuestions(T2_PERIBAHASA, 2);
  console.log(`T2: ${t2.length} questions`);

  console.log("Generating T3 questions...");
  const t3 = generateQuestions(T3_PERIBAHASA, 3);
  console.log(`T3: ${t3.length} questions`);

  const all = [...t2, ...t3];
  const batchSize = 20;
  let inserted = 0;
  for (let i = 0; i < all.length; i += batchSize) {
    const batch = all.slice(i, i + batchSize);
    const { error } = await supabase.from("peribahasa_questions").insert(batch);
    if (error) {
      console.error(`Batch error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} inserted`);
    }
  }
  console.log(`Done. ${inserted} total questions for T2+T3.`);
}

main();
