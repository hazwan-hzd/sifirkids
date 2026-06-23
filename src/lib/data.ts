import type { Card, ChildId, ColorKey, Profile } from "./types";

/** The three children. Order = display order on the home screen. */
export const PROFILES: Profile[] = [
  { id: "hafeeza", name: "Hafeeza", avatar: "🦋", color: "coral" },
  { id: "dhiya", name: "Dhiya", avatar: "🌟", color: "teal" },
  { id: "ilyas", name: "Ilyas", avatar: "🚀", color: "sky" },
];

export function getProfile(id: ChildId): Profile {
  const p = PROFILES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown child: ${id}`);
  return p;
}

export const CHILD_IDS: ChildId[] = PROFILES.map((p) => p.id);

/** Multiplication tables covered: 2x through 12x. */
export const TABLES: number[] = Array.from({ length: 11 }, (_, i) => i + 2); // 2..12

/* ------------------------------------------------------------------ */
/* Arabic Alif Ba Ta — 28 letters, grouped into learning sets         */
/* ------------------------------------------------------------------ */

export interface ArabicLetter {
  /** stable id used as the progress key */
  id: string;
  /** isolated-form glyph */
  glyph: string;
  /** common name */
  name: string;
  /** simple transliteration of the sound */
  sound: string;
  /** which learning set (1..4) */
  set: number;
}

export const ARABIC_LETTERS: ArabicLetter[] = [
  { id: "alif", glyph: "ا", name: "Alif", sound: "a", set: 1 },
  { id: "ba", glyph: "ب", name: "Ba", sound: "b", set: 1 },
  { id: "ta", glyph: "ت", name: "Ta", sound: "t", set: 1 },
  { id: "tha", glyph: "ث", name: "Tha", sound: "th", set: 1 },
  { id: "jim", glyph: "ج", name: "Jim", sound: "j", set: 1 },
  { id: "ha", glyph: "ح", name: "Ḥa", sound: "ḥ", set: 1 },
  { id: "kha", glyph: "خ", name: "Kha", sound: "kh", set: 1 },

  { id: "dal", glyph: "د", name: "Dal", sound: "d", set: 2 },
  { id: "dhal", glyph: "ذ", name: "Dhal", sound: "dh", set: 2 },
  { id: "ra", glyph: "ر", name: "Ra", sound: "r", set: 2 },
  { id: "zay", glyph: "ز", name: "Zay", sound: "z", set: 2 },
  { id: "sin", glyph: "س", name: "Sin", sound: "s", set: 2 },
  { id: "shin", glyph: "ش", name: "Shin", sound: "sh", set: 2 },
  { id: "sad", glyph: "ص", name: "Ṣad", sound: "ṣ", set: 2 },

  { id: "dad", glyph: "ض", name: "Ḍad", sound: "ḍ", set: 3 },
  { id: "tah", glyph: "ط", name: "Ṭa", sound: "ṭ", set: 3 },
  { id: "zah", glyph: "ظ", name: "Ẓa", sound: "ẓ", set: 3 },
  { id: "ain", glyph: "ع", name: "ʿAin", sound: "ʿa", set: 3 },
  { id: "ghain", glyph: "غ", name: "Ghain", sound: "gh", set: 3 },
  { id: "fa", glyph: "ف", name: "Fa", sound: "f", set: 3 },
  { id: "qaf", glyph: "ق", name: "Qaf", sound: "q", set: 3 },

  { id: "kaf", glyph: "ك", name: "Kaf", sound: "k", set: 4 },
  { id: "lam", glyph: "ل", name: "Lam", sound: "l", set: 4 },
  { id: "mim", glyph: "م", name: "Mim", sound: "m", set: 4 },
  { id: "nun", glyph: "ن", name: "Nun", sound: "n", set: 4 },
  { id: "hah", glyph: "ه", name: "Ha", sound: "h", set: 4 },
  { id: "waw", glyph: "و", name: "Waw", sound: "w", set: 4 },
  { id: "ya", glyph: "ي", name: "Ya", sound: "y", set: 4 },
];

export const ARABIC_SETS: number[] = [1, 2, 3, 4];

export function lettersInSet(set: number): ArabicLetter[] {
  return ARABIC_LETTERS.filter((l) => l.set === set);
}

export function getLetter(id: string): ArabicLetter | undefined {
  return ARABIC_LETTERS.find((l) => l.id === id);
}

/* ------------------------------------------------------------------ */
/* Points + mastery + rewards economy                                 */
/* ------------------------------------------------------------------ */

export const POINTS = {
  perCorrect: 10,
  /** added per question when the whole quiz is perfect */
  perfectBonusPerQuestion: 5,
  /** added once per quiz for keeping a long streak */
  streakBonus: 20,
  /** streak length that unlocks streakBonus */
  streakBonusAt: 5,
  /** bonus for keeping the daily streak alive */
  dailyStreakBonus: 15,
};

/** Mastery: at least this many attempts AND accuracy at/above threshold. */
export const MASTERY = {
  minAttempts: 10,
  accuracy: 0.9,
};

export const DEFAULT_DAILY_GOAL = 2; // quizzes per day

export interface Reward {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

/** Reward shop. Parent approves claims from the dashboard. */
export const REWARDS: Reward[] = [
  { id: "sticker", name: "Sticker", icon: "✨", cost: 5000 },
  { id: "icecream", name: "Ice Cream", icon: "🍦", cost: 15000 },
  { id: "screen30", name: "30 min Screen Time", icon: "📺", cost: 20000 },
  { id: "pickdinner", name: "Pick Dinner", icon: "🍕", cost: 30000 },
  { id: "movienight", name: "Movie Night", icon: "🎬", cost: 40000 },
  { id: "stayuplate", name: "Stay Up Late", icon: "🌙", cost: 50000 },
  { id: "toy", name: "New Toy", icon: "🧸", cost: 100000 },
  { id: "outing", name: "Day Outing", icon: "🎡", cost: 200000 },
];

export const CHILD_REWARDS: Record<ChildId, Reward[]> = {
  ilyas: [
    { id: "ilyas_roblox_sticker", name: "Roblox Avatar Sticker Pack", icon: "🎟️", cost: 5000 },
    { id: "ilyas_football_kickabout", name: "Extra Football Practice", icon: "⚽", cost: 15000 },
    { id: "ilyas_robux_starter", name: "Roblox Starter Pack (400 Robux)", icon: "🪙", cost: 40000 },
    { id: "ilyas_football_socks", name: "Pro Football Grip Socks", icon: "🧦", cost: 75000 },
    { id: "ilyas_robux_mega", name: "Roblox Mega Pack (800 Robux)", icon: "💎", cost: 100000 },
    { id: "ilyas_football_jersey", name: "Custom Football Jersey", icon: "👕", cost: 250000 },
  ],
  dhiya: [
    { id: "dhiya_kawaii_stickers", name: "Kawaii Pink Unicorn Sticker Sheet", icon: "🦄", cost: 5000 },
    { id: "dhiya_pink_hairclip", name: "Pink Unicorn Hair Clip", icon: "🎀", cost: 15000 },
    { id: "dhiya_mlp_mystery_mini", name: "My Little Pony Mystery Mini Figure", icon: "🐴", cost: 35000 },
    { id: "dhiya_kawaii_skirt", name: "Pink Kawaii Tulle Skirt", icon: "👗", cost: 80000 },
    { id: "dhiya_mlp_plushie", name: "Jumbo Pinkie Pie Unicorn Plushie", icon: "🧸", cost: 120000 },
    { id: "dhiya_kawaii_room_makeover", name: "Kawaii Pink Unicorn Bedroom Set", icon: "🛏️", cost: 220000 },
  ],
  hafeeza: [
    { id: "hafeeza_kpop_photocard", name: "K-Pop Mystery Photocard Pack", icon: "📸", cost: 6000 },
    { id: "hafeeza_anime_keychain", name: "Chibi Gojo Acrylic Keychain", icon: "🔑", cost: 18000 },
    { id: "hafeeza_bakugo_poster", name: "Bakugo Katsuki Wall Poster", icon: "🖼️", cost: 30000 },
    { id: "hafeeza_gojo_blindfold", name: "Gojo Satoru Sleep Eye Mask", icon: "👁️", cost: 60000 },
    { id: "hafeeza_kpop_album", name: "K-Pop Music Album of Choice", icon: "💿", cost: 120000 },
    { id: "hafeeza_bakugo_figure", name: "My Hero Academia Bakugo Figure", icon: "🦸", cost: 250000 },
  ],
};

export function getReward(id: string): Reward | undefined {
  const def = REWARDS.find((r) => r.id === id);
  if (def) return def;
  for (const list of Object.values(CHILD_REWARDS)) {
    const item = list.find((r) => r.id === id);
    if (item) return item;
  }
  return undefined;
}

/** Palette tokens per color family — used so components avoid hardcoding hex. */
export const COLOR_CLASSES: Record<
  ColorKey,
  { bg: string; bgSoft: string; text: string; ring: string; border: string; solid: string }
> = {
  coral: {
    bg: "bg-coral-500",
    bgSoft: "bg-coral-100",
    text: "text-coral-600",
    ring: "ring-coral-400",
    border: "border-coral-400",
    solid: "#ff5a47",
  },
  teal: {
    bg: "bg-teal-500",
    bgSoft: "bg-teal-100",
    text: "text-teal-600",
    ring: "ring-teal-400",
    border: "border-teal-400",
    solid: "#14c2a0",
  },
  sky: {
    bg: "bg-sky-500",
    bgSoft: "bg-sky-100",
    text: "text-sky-600",
    ring: "ring-sky-400",
    border: "border-sky-400",
    solid: "#1f9bff",
  },
  grape: {
    bg: "bg-grape-500",
    bgSoft: "bg-grape-100",
    text: "text-grape-600",
    ring: "ring-grape-400",
    border: "border-grape-400",
    solid: "#8b4dff",
  },
  sunny: {
    bg: "bg-sunny-500",
    bgSoft: "bg-sunny-100",
    text: "text-sunny-600",
    ring: "ring-sunny-400",
    border: "border-sunny-400",
    solid: "#ffba00",
  },
};

/* ------------------------------------------------------------------ */
/* SifirKids TCG: Cards & Packs Database                             */
/* ------------------------------------------------------------------ */

export const CARDS: Card[] = [
  // --- Starter Set ---
  {
    id: "starter-01",
    name: "Pikachu D. Luffy",
    emoji: "⚡👒",
    type: "lightning",
    rarity: "common",
    hp: 80,
    attackName: "Gum-Gum Thunderbolt",
    attackDmg: 30,
    description: "A sparky mouse with big dreams of becoming the Pirate King! Always hungry.",
    set: "starter",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-01.png",
  },
  {
    id: "starter-02",
    name: "Zoro-saur",
    emoji: "🍃⚔️",
    type: "grass",
    rarity: "common",
    hp: 90,
    attackName: "Three-Vine Leaf Slash",
    attackDmg: 35,
    description: "Carries three swords/vines in his mouth. Constantly getting lost.",
    set: "starter",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-02.png",
  },
  {
    id: "starter-03",
    name: "Nami Jigglypuff",
    emoji: "🫧🍊",
    type: "water",
    rarity: "common",
    hp: 70,
    attackName: "Climate Sing-Along",
    attackDmg: 20,
    description: "Predicts the weather, sings sweet lullabies, and hoards gold coins.",
    set: "starter",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-03.png",
  },
  {
    id: "starter-04",
    name: "Chopper Eevee",
    emoji: "🦌💊",
    type: "grass",
    rarity: "common",
    hp: 60,
    attackName: "Rumble Candy Chew",
    attackDmg: 15,
    description: "An adorable reindeer-fox that dreams of curing every disease.",
    set: "starter",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-04.png",
  },
  {
    id: "starter-05",
    name: "Marine Meowth",
    emoji: "🐱🪙",
    type: "marine",
    rarity: "common",
    hp: 60,
    attackName: "Justice Pay Day",
    attackDmg: 20,
    description: "Enforces absolute law while collecting shiny gold coins on patrol.",
    set: "starter",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-05.png",
  },
  {
    id: "starter-06",
    name: "Koby Squirtle",
    emoji: "🐢👓",
    type: "water",
    rarity: "common",
    hp: 75,
    attackName: "Honest Bubble",
    attackDmg: 25,
    description: "A very brave turtle working hard to become a Marine Admiral.",
    set: "starter",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-09.png",
  },

  // --- Monsters Set ---
  {
    id: "monsters-01",
    name: "Flame Luffy",
    emoji: "🔥👒",
    type: "fire",
    rarity: "uncommon",
    hp: 90,
    attackName: "Red Hawk Punch",
    attackDmg: 40,
    description: "Ignites his rubber fists with burning passion and determination.",
    set: "monsters",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-06.png",
  },
  {
    id: "monsters-02",
    name: "Flame Ace Charmander",
    emoji: "🔥🎩",
    type: "fire",
    rarity: "rare",
    hp: 100,
    attackName: "Fire Fist Blast",
    attackDmg: 50,
    description: "Luffy's sworn brother. His flame tail burns hotter than magma.",
    set: "monsters",
  },
  {
    id: "monsters-03",
    name: "Zoro Grovyle",
    emoji: "🐉⚔️",
    type: "grass",
    rarity: "uncommon",
    hp: 100,
    attackName: "Blade Leaf Tempest",
    attackDmg: 45,
    description: "Speeds through forests, cutting down obstacles with leaf blades.",
    set: "monsters",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-08.png",
  },
  {
    id: "monsters-04",
    name: "Sanji Combusken",
    emoji: "🐓🍳",
    type: "fire",
    rarity: "uncommon",
    hp: 95,
    attackName: "Diable Kick",
    attackDmg: 45,
    description: "A fiery kick specialist who refuses to use his hands in battle.",
    set: "monsters",
  },
  {
    id: "monsters-05",
    name: "Luffy Charizard",
    emoji: "🐉🔥",
    type: "fire",
    rarity: "ultra_rare",
    hp: 150,
    attackName: "Red Hawk Fireblast",
    attackDmg: 80,
    evolvesFrom: "monsters-01",
    description: "The ultimate fire dragon crew leader. Can melt solid steel.",
    set: "monsters",
  },
  {
    id: "monsters-06",
    name: "Zoro Sceptile",
    emoji: "🦕🎋",
    type: "grass",
    rarity: "ultra_rare",
    hp: 140,
    attackName: "Asura Leaf Slash",
    attackDmg: 75,
    evolvesFrom: "monsters-03",
    description: "A master of the forest and swords. Can summon spectral sword vines.",
    set: "monsters",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-12.png",
  },
  {
    id: "monsters-07",
    name: "Sanji Blaziken",
    emoji: "🦅🔥",
    type: "fire",
    rarity: "ultra_rare",
    hp: 140,
    attackName: "Diable Jambe Strike",
    attackDmg: 75,
    evolvesFrom: "monsters-04",
    description: "Spins at supersonic speed to ignite his legs in white-hot flames.",
    set: "monsters",
  },
  {
    id: "monsters-08",
    name: "Gear 5 Pikachu",
    emoji: "⚡☁️",
    type: "legendary",
    rarity: "secret_gold",
    hp: 180,
    attackName: "Bajrang Lightning",
    attackDmg: 100,
    evolvesFrom: "starter-01",
    description: "The Sun God Nika incarnate. Can turn anything into rubber and lightning!",
    set: "monsters",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/poke-15.png",
  },

  // --- Crews Set ---
  {
    id: "crews-01",
    name: "Captain Luffy",
    emoji: "🧑‍✈️🍖",
    type: "strawhat",
    rarity: "uncommon",
    hp: 100,
    attackName: "Gum-Gum Elephant Gun",
    attackDmg: 45,
    description: "Captain of the Straw Hats. Will do anything for food and friends.",
    set: "crews",
  },
  {
    id: "crews-02",
    name: "Pirate Hunter Zoro",
    emoji: "⚔️🟢",
    type: "strawhat",
    rarity: "uncommon",
    hp: 105,
    attackName: "1080 Pound Phoenix",
    attackDmg: 50,
    description: "First mate of the crew. His training knows no limits.",
    set: "crews",
  },
  {
    id: "crews-03",
    name: "Black-Leg Sanji",
    emoji: "🦵🚬",
    type: "strawhat",
    rarity: "uncommon",
    hp: 100,
    attackName: "Concasser Strike",
    attackDmg: 45,
    description: "Cook of the Straw Hats. Fights with passion and culinary pride.",
    set: "crews",
  },
  {
    id: "crews-04",
    name: "Fleet Admiral Akainu",
    emoji: "🌋🌋",
    type: "marine",
    rarity: "rare",
    hp: 130,
    attackName: "Magma Eruption",
    attackDmg: 65,
    description: "Leader of the Marines. Believes in absolute, unwavering justice.",
    set: "crews",
  },
  {
    id: "crews-05",
    name: "Admiral Aokiji Kuzan",
    emoji: "❄️🚲",
    type: "marine",
    rarity: "rare",
    hp: 120,
    attackName: "Ice Age Freeze",
    attackDmg: 60,
    description: "Loves riding his bicycle on frozen ocean waves. Chill personality.",
    set: "crews",
  },
  {
    id: "crews-06",
    name: "Admiral Kizaru Borsalino",
    emoji: "✨🕶️",
    type: "marine",
    rarity: "rare",
    hp: 120,
    attackName: "Yasakani Jewel",
    attackDmg: 60,
    description: "Can move at the speed of light. Speaks slowly and sarcastically.",
    set: "crews",
  },
  {
    id: "crews-07",
    name: "Kaido Gyarados",
    emoji: "🐉🌊",
    type: "legendary",
    rarity: "ultra_rare",
    hp: 170,
    attackName: "Bolo Breath Wave",
    attackDmg: 85,
    description: "The strongest creature alive. A massive sea dragon that commands lightning.",
    set: "crews",
  },
  {
    id: "crews-08",
    name: "Red-Haired Shanks",
    emoji: "👑🧣",
    type: "legendary",
    rarity: "secret_gold",
    hp: 160,
    attackName: "Divine Departure Haki",
    attackDmg: 95,
    description: "One of the Four Emperors. Inspires the next generation of pirates.",
    set: "crews",
  },

  // --- Promo / Mastery Set ---
  {
    id: "promo-math-01",
    name: "Sifir Seven Sparky",
    emoji: "✖️⚡",
    type: "lightning",
    rarity: "rare",
    hp: 95,
    attackName: "Table 7 Shockwave",
    attackDmg: 50,
    description: "A lightning beast unlocked by mastering the 7x Times Table.",
    set: "promo",
  },
  {
    id: "promo-math-02",
    name: "Multiplication Sage",
    emoji: "🧙‍♂️📖",
    type: "legendary",
    rarity: "ultra_rare",
    hp: 150,
    attackName: "Times Table Mastery",
    attackDmg: 80,
    description: "The ultimate math wizard. Uses multiplication arrays to shield allies.",
    set: "promo",
  },
  {
    id: "promo-arabic-01",
    name: "Alif Angel",
    emoji: "👼ا",
    type: "grass",
    rarity: "rare",
    hp: 80,
    attackName: "First Alphabet Beam",
    attackDmg: 40,
    description: "Stands straight like an Alif. Radiates clean energy and kindness.",
    set: "promo",
  },
  {
    id: "promo-arabic-02",
    name: "Ba Rebounder",
    emoji: "🐸ب",
    type: "water",
    rarity: "rare",
    hp: 90,
    attackName: "Letter Splash Kick",
    attackDmg: 45,
    description: "Bounces around like a frog. Unlocked by practicing Arabic letters.",
    set: "promo",
  },
  {
    id: "promo-arabic-03",
    name: "Tajweed Dragon",
    emoji: "🐉📖",
    type: "legendary",
    rarity: "secret_gold",
    hp: 170,
    attackName: "Holy Recitation Breath",
    attackDmg: 90,
    description: "A divine dragon protector of Quranic letters. Very wise and powerful.",
    set: "promo",
  },
  // --- Gojo Promotional Set ---
  {
    id: "promo-gojo-01",
    name: "Gojo-mander",
    emoji: "🔥🕶️",
    type: "fire",
    rarity: "rare",
    hp: 90,
    attackName: "Hollow Blue Flame",
    attackDmg: 45,
    description: "A cool Charmander wearing dark sunglasses. Blue flames erupt from its tail.",
    set: "promo",
  },
  {
    id: "promo-gojo-02",
    name: "Gojo-gar",
    emoji: "😈☁️",
    type: "shadow",
    rarity: "ultra_rare",
    hp: 130,
    attackName: "Infinite Void Smile",
    attackDmg: 70,
    description: "Gengar with spiky white hair. Smiles maniacally while trapping opponents in void.",
    set: "promo",
  },
  {
    id: "promo-gojo-03",
    name: "Gojo-two",
    emoji: "🧬🔴",
    type: "legendary",
    rarity: "secret_gold",
    hp: 180,
    attackName: "Hollow Purple Sphere",
    attackDmg: 100,
    description: "Mewtwo wielding the ultimate Hollow Purple. Possesses absolute psychic domain.",
    set: "promo",
  },

  // --- My Hero Set ---
  {
    id: "mha-01",
    name: "Izuku Midoriya",
    emoji: "🟢📓",
    type: "hero",
    rarity: "common",
    hp: 80,
    attackName: "Delaware Smash",
    attackDmg: 30,
    description: "A determined young hero who studies every move before leaping forward.",
    set: "mha",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/mha-01.png",
  },
  {
    id: "mha-02",
    name: "Ochaco Uraraka",
    emoji: "🪐✨",
    type: "hero",
    rarity: "common",
    hp: 65,
    attackName: "Zero Gravity Touch",
    attackDmg: 20,
    description: "A bright hero who can make heavy problems feel light.",
    set: "mha",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/mha-02.png",
  },
  {
    id: "mha-03",
    name: "Tenya Ida",
    emoji: "🏃👓",
    type: "hero",
    rarity: "uncommon",
    hp: 90,
    attackName: "Recipro Burst",
    attackDmg: 40,
    description: "A disciplined class representative who races ahead with engine-powered speed.",
    set: "mha",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/mha-03.png",
  },
  {
    id: "mha-04",
    name: "Shoto Todoroki",
    emoji: "❄️🔥",
    type: "hero",
    rarity: "rare",
    hp: 120,
    attackName: "Half-Cold Flame",
    attackDmg: 60,
    description: "A calm dual-element hero balancing ice control with blazing power.",
    set: "mha",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/mha-04.png",
  },
  {
    id: "mha-05",
    name: "All Might",
    emoji: "💪🌟",
    type: "hero",
    rarity: "ultra_rare",
    hp: 160,
    attackName: "Detroit Smash",
    attackDmg: 85,
    description: "The symbol of peace arrives with a heroic smile and overwhelming strength.",
    set: "mha",
  },
  {
    id: "mha-06",
    name: "Bakugo Katsuki",
    emoji: "💥🦸",
    type: "hero",
    rarity: "uncommon",
    hp: 95,
    attackName: "AP Shot",
    attackDmg: 50,
    description: "Explosive palms and an explosive personality. Hafeeza's favorite!",
    set: "mha",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/mha-06.png",
  },

  // --- Squishy Squad Set ---
  {
    id: "sq-01",
    name: "Boba Blob",
    emoji: "🧋🫧",
    type: "squishy",
    rarity: "common",
    hp: 65,
    attackName: "Tapioca Bounce",
    attackDmg: 20,
    description: "A jiggly boba tea squishy that bounces back no matter how hard you squeeze.",
    set: "squishy",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/sq-01.png",
  },
  {
    id: "sq-02",
    name: "Donut Dough",
    emoji: "🍩💗",
    type: "squishy",
    rarity: "common",
    hp: 70,
    attackName: "Sugar Glaze Slam",
    attackDmg: 25,
    description: "A pink frosted donut squishy with sprinkles that scatter on impact.",
    set: "squishy",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/sq-02.png",
  },
  {
    id: "sq-03",
    name: "Panda Puff",
    emoji: "🐼☁️",
    type: "squishy",
    rarity: "uncommon",
    hp: 85,
    attackName: "Bamboo Belly Flop",
    attackDmg: 40,
    description: "So fluffy it looks like a cloud. Rolls into enemies and absorbs all damage.",
    set: "squishy",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/sq-03.png",
  },
  {
    id: "sq-04",
    name: "Unicorn Squish",
    emoji: "🦄🌈",
    type: "squishy",
    rarity: "uncommon",
    hp: 90,
    attackName: "Rainbow Squeeze Beam",
    attackDmg: 45,
    description: "A sparkly pastel unicorn squishy with a glitter horn. Dhiya's favourite!",
    set: "squishy",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/sq-04.png",
  },
  {
    id: "sq-05",
    name: "Axolotl Mega Mallow",
    emoji: "🩷🦎",
    type: "squishy",
    rarity: "rare",
    hp: 115,
    attackName: "Squishmallow Tsunami",
    attackDmg: 60,
    evolvesFrom: "sq-01",
    description: "A giant pink axolotl squishy. So soft that attacks sink in and disappear.",
    set: "squishy",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/sq-05.png",
  },
  {
    id: "sq-06",
    name: "Golden Galaxy Squish",
    emoji: "✨🌌",
    type: "squishy",
    rarity: "ultra_rare",
    hp: 155,
    attackName: "Cosmic Compression",
    attackDmg: 80,
    evolvesFrom: "sq-05",
    description: "The legendary golden squishy with galaxy swirl patterns. Compresses matter itself.",
    set: "squishy",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/sq-06.png",
  },
  {
    id: "sq-07",
    name: "Bakugo Boom Squish",
    emoji: "💥🧸",
    type: "squishy",
    rarity: "ultra_rare",
    hp: 150,
    attackName: "Explosion Squeeze",
    attackDmg: 85,
    description: "A rage-filled squishy shaped like Bakugo. Squeeze it and it EXPLODES with foam sparks!",
    set: "squishy",
    imageUrl: "https://kwxieclufgfrqakzktmr.supabase.co/storage/v1/object/public/tcg-cards/sq-07.png",
  },
];

export interface PackConfig {
  id: string;
  name: string;
  cost: number;
  icon: string;
  cardCount: number;
  description: string;
  allowedSets: string[];
  rarityWeights: {
    common: number;
    uncommon: number;
    rare: number;
    ultra_rare: number;
    secret_gold: number;
  };
}

export const PACKS: PackConfig[] = [
  {
    id: "pack-starter",
    name: "Starter Pack",
    cost: 1000,
    icon: "🎒",
    cardCount: 5,
    description: "Contains basic Pokémon/One Piece hybrid cards to start your binder.",
    allowedSets: ["starter"],
    rarityWeights: {
      common: 77,
      uncommon: 20,
      rare: 2,
      ultra_rare: 0.8,
      secret_gold: 0.2,
    },
  },
  {
    id: "pack-monsters",
    name: "Monster Evolution Pack",
    cost: 3000,
    icon: "🔥",
    cardCount: 5,
    description: "High chance of Pokémon elementals and evolutionary stage cards.",
    allowedSets: ["starter", "monsters"],
    rarityWeights: {
      common: 49,
      uncommon: 30,
      rare: 15,
      ultra_rare: 5,
      secret_gold: 1,
    },
  },
  {
    id: "pack-crews",
    name: "Pirate Crew Booster",
    cost: 3000,
    icon: "🏴‍☠️",
    cardCount: 5,
    description: "High chance of Straw Hat crew and Marine officers.",
    allowedSets: ["starter", "crews"],
    rarityWeights: {
      common: 49,
      uncommon: 30,
      rare: 15,
      ultra_rare: 5,
      secret_gold: 1,
    },
  },
  {
    id: "pack-my-hero",
    name: "My Hero Booster",
    cost: 5000,
    icon: "🦸",
    cardCount: 5,
    description: "Better odds for My Hero Academia-inspired hero cards and premium pulls.",
    allowedSets: ["mha", "promo"],
    rarityWeights: {
      common: 20,
      uncommon: 30,
      rare: 30,
      ultra_rare: 15,
      secret_gold: 5,
    },
  },
  {
    id: "pack-legendary",
    name: "Golden Legend Pack",
    cost: 8000,
    icon: "🏆",
    cardCount: 5,
    description: "Guarantees at least one Rare or better card. Chance of Secret Gold!",
    allowedSets: ["starter", "monsters", "crews", "promo", "squishy"],
    rarityWeights: {
      common: 30,
      uncommon: 30,
      rare: 25,
      ultra_rare: 10,
      secret_gold: 5,
    },
  },
  {
    id: "pack-squishy",
    name: "Squishy Squad Pack",
    cost: 2000,
    icon: "🧸",
    cardCount: 5,
    description: "Kawaii squishy cards! 80% chance of pulling from the Squishy Squad series.",
    allowedSets: ["squishy"],
    rarityWeights: {
      common: 45,
      uncommon: 30,
      rare: 15,
      ultra_rare: 8,
      secret_gold: 2,
    },
  },
];
