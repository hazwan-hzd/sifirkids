// Types and definitions for SifirKids Avatar customization items.
// Conforms to the ChildAvatar interface in types.ts.

export type AvatarCategory =
  | "skin"
  | "eyes"
  | "hairStyle"
  | "top"
  | "dress"
  | "accessory"
  | "background";

export interface AvatarItem {
  id: string;
  name: string;
  category: AvatarCategory;
  cost: number;
  isPremium: boolean;
  /** Optional HEX or styling value associated with this item */
  value?: string;
  description?: string;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export const AVATAR_COLORS = {
  hair: [
    { name: "Black", hex: "#1a1a1a" },
    { name: "Dark Brown", hex: "#54301a" },
    { name: "Light Brown", hex: "#a1623b" },
    { name: "Blonde", hex: "#ffd43b" },
    { name: "Cherry Red", hex: "#e63946" },
    { name: "Pinkie Pink", hex: "#ff66cc" },
    { name: "Ocean Blue", hex: "#3a86c8" },
    { name: "Grapest Purple", hex: "#8b4dff" },
  ] as ColorOption[],
  top: [
    { name: "Coral Orange", hex: "#ff5a47" },
    { name: "Teal Green", hex: "#14c2a0" },
    { name: "Sky Blue", hex: "#1f9bff" },
    { name: "Sunny Yellow", hex: "#ffba00" },
    { name: "Grape Purple", hex: "#8b4dff" },
    { name: "Roblox Grey", hex: "#343a40" },
    { name: "Sport Jersey Red", hex: "#d90429" },
    { name: "Cozy White", hex: "#f8f9fa" },
  ] as ColorOption[],
  dress: [
    { name: "Pink Tulle", hex: "#ff85a2" },
    { name: "Royal Purple", hex: "#7209b7" },
    { name: "Mint Green", hex: "#48cae4" },
    { name: "Sunshine Yellow", hex: "#ffd166" },
    { name: "Coral Rose", hex: "#ff7096" },
    { name: "Midnight Black", hex: "#212529" },
  ] as ColorOption[],
  accessory: [
    { name: "Bright Red", hex: "#ef4444" },
    { name: "Electric Blue", hex: "#3b82f6" },
    { name: "Shiny Gold", hex: "#ffd700" },
    { name: "Barbie Pink", hex: "#ec4899" },
    { name: "Chic Black", hex: "#1a1a1a" },
    { name: "Pure White", hex: "#ffffff" },
  ] as ColorOption[],
};

export const DEFAULT_AVATAR: {
  skin: string;
  hairStyle: string;
  hairColor: string;
  eyes: string;
  top: string;
  topColor: string;
  dress: string;
  dressColor: string;
  bottom: string;
  bottomColor: string;
  accessory: string;
  accessoryColor: string;
  background: string;
  unlockedItems: string[];
} = {
  skin: "skin-fair",
  hairStyle: "hair-short",
  hairColor: "#54301a",
  eyes: "eyes-cute",
  top: "top-tshirt",
  topColor: "#1f9bff",
  dress: "dress-none",
  dressColor: "#ff85a2",
  bottom: "bottom-none",
  bottomColor: "#343a40",
  accessory: "acc-none",
  accessoryColor: "#ffd700",
  background: "bg-white",
  unlockedItems: [
    "skin-light",
    "skin-fair",
    "skin-medium",
    "skin-olive",
    "skin-dark",
    "eyes-cute",
    "eyes-happy",
    "eyes-kawaii",
    "hair-bald",
    "hair-short",
    "hair-long",
    "hair-curly",
    "top-tshirt",
    "top-sweater",
    "top-tank",
    "dress-none",
    "dress-summer",
    "acc-none",
    "bg-white",
    "bg-sunny",
    "bg-sky",
  ],
};

export const AVATAR_ITEMS: Record<AvatarCategory, AvatarItem[]> = {
  skin: [
    { id: "skin-light", name: "Creamy Peach", category: "skin", cost: 0, isPremium: false, value: "#ffd1b3" },
    { id: "skin-fair", name: "Fair Sand", category: "skin", cost: 0, isPremium: false, value: "#ffe0bd" },
    { id: "skin-medium", name: "Golden Tan", category: "skin", cost: 0, isPremium: false, value: "#e0a96d" },
    { id: "skin-olive", name: "Warm Olive", category: "skin", cost: 0, isPremium: false, value: "#c68642" },
    { id: "skin-dark", name: "Deep Cocoa", category: "skin", cost: 0, isPremium: false, value: "#8d5524" },
    { id: "skin-blue", name: "Alien Blue", category: "skin", cost: 1000, isPremium: true, value: "#99ccff", description: "Out of this world skin tone!" },
    { id: "skin-pink", name: "Candy Pink", category: "skin", cost: 1200, isPremium: true, value: "#ffb3d9", description: "Sweet bubblegum look" },
    { id: "skin-green", name: "Slime Green", category: "skin", cost: 1500, isPremium: true, value: "#b3ffb3", description: "Super stretchy green skin" },
  ],
  eyes: [
    { id: "eyes-cute", name: "Cute Round", category: "eyes", cost: 0, isPremium: false },
    { id: "eyes-happy", name: "Happy Curves", category: "eyes", cost: 0, isPremium: false },
    { id: "eyes-kawaii", name: "Kawaii Anime", category: "eyes", cost: 0, isPremium: false },
    { id: "eyes-winking", name: "Winky Wink", category: "eyes", cost: 500, isPremium: true, description: "A playful wink!" },
    { id: "eyes-sparkle", name: "Sparkle Stars", category: "eyes", cost: 800, isPremium: true, description: "Stars shining in your eyes" },
    { id: "eyes-nerd", name: "Nerd Glasses", category: "eyes", cost: 600, isPremium: true, description: "Classic thick frame spectacles" },
    { id: "eyes-cool", name: "Cool Shades", category: "eyes", cost: 1000, isPremium: true, description: "Retro dark sunglasses" },
  ],
  hairStyle: [
    { id: "hair-bald", name: "Bald / None", category: "hairStyle", cost: 0, isPremium: false },
    { id: "hair-short", name: "Classic Short", category: "hairStyle", cost: 0, isPremium: false },
    { id: "hair-long", name: "Flowing Long", category: "hairStyle", cost: 0, isPremium: false },
    { id: "hair-curly", name: "Bouncy Curls", category: "hairStyle", cost: 0, isPremium: false },
    { id: "hair-pigtails", name: "Playful Pigtails", category: "hairStyle", cost: 500, isPremium: true },
    { id: "hair-cool-sweep", name: "Cool Side Sweep", category: "hairStyle", cost: 800, isPremium: true },
    { id: "hair-spiky", name: "Chibi Spiky Hair", category: "hairStyle", cost: 1500, isPremium: true, description: "Hafeeza's Favorite spiky look!" },
    { id: "hair-pinkie", name: "Pinkie Pie Hair", category: "hairStyle", cost: 3000, isPremium: true, description: "Dhiya's Favorite bouncy pink style!" },
  ],
  top: [
    { id: "top-tshirt", name: "Basic Tee", category: "top", cost: 0, isPremium: false },
    { id: "top-sweater", name: "Cozy Sweater", category: "top", cost: 0, isPremium: false },
    { id: "top-tank", name: "Active Tank", category: "top", cost: 0, isPremium: false },
    { id: "top-hoodie", name: "Classic Hoodie", category: "top", cost: 500, isPremium: true },
    { id: "top-jacket", name: "Denim Jacket", category: "top", cost: 1000, isPremium: true },
    { id: "top-jersey", name: "Football Jersey", category: "top", cost: 1500, isPremium: true, description: "Ilyas's Favorite number 10 football jersey!" },
    { id: "top-roblox-hoodie", name: "Roblox Logo Hoodie", category: "top", cost: 2500, isPremium: true, description: "Ilyas's Favorite Roblox gaming hoodie!" },
  ],
  dress: [
    { id: "dress-none", name: "No Dress", category: "dress", cost: 0, isPremium: false },
    { id: "dress-summer", name: "Summer Dress", category: "dress", cost: 0, isPremium: false },
    { id: "dress-apron", name: "Apron Dress", category: "dress", cost: 800, isPremium: true },
    { id: "dress-dungarees", name: "Playful Dungarees", category: "dress", cost: 1200, isPremium: true },
    { id: "dress-superhero", name: "Hero Suit", category: "dress", cost: 1500, isPremium: true },
    { id: "dress-tulle-skirt", name: "Pink Tulle Skirt", category: "dress", cost: 2000, isPremium: true, description: "Dhiya's Favorite sparkly pink skirt dress!" },
    { id: "dress-kimono", name: "Festive Kimono", category: "dress", cost: 3000, isPremium: true },
    { id: "dress-princess", name: "Princess Gown", category: "dress", cost: 4000, isPremium: true, description: "A royal dress with sparkles" },
  ],
  accessory: [
    { id: "acc-none", name: "No Accessory", category: "accessory", cost: 0, isPremium: false },
    { id: "acc-hairbow", name: "Kawaii Hairbow", category: "accessory", cost: 800, isPremium: true, description: "Dhiya's Favorite cute hair ribbon!" },
    { id: "acc-anime-headband", name: "Anime Headband", category: "accessory", cost: 1200, isPremium: true, description: "Hafeeza's Favorite leaf village headband!" },
    { id: "acc-headphones", name: "Gamer Headphones", category: "accessory", cost: 1500, isPremium: true },
    { id: "acc-roblox-cap", name: "Roblox Cap", category: "accessory", cost: 1800, isPremium: true, description: "Ilyas's Favorite Roblox themed cap!" },
    { id: "acc-gojo", name: "Gojo Blindfold", category: "accessory", cost: 2200, isPremium: true, description: "Hafeeza's Favorite Jujutsu blindfold!" },
    { id: "acc-star-mic", name: "K-Pop Star Mic", category: "accessory", cost: 2500, isPremium: true, description: "Hafeeza's Favorite sparkly mic headset!" },
    { id: "acc-unicorn", name: "Pink Unicorn Horn", category: "accessory", cost: 3500, isPremium: true, description: "Dhiya's Favorite magical glowing horn!" },
    { id: "acc-crown", name: "Golden Royal Crown", category: "accessory", cost: 5000, isPremium: true, description: "Shiny gold crown fit for royalty!" },
  ],
  background: [
    { id: "bg-white", name: "Clean White", category: "background", cost: 0, isPremium: false, value: "#ffffff" },
    { id: "bg-sunny", name: "Sunny Yellow", category: "background", cost: 0, isPremium: false, value: "linear-gradient(to bottom, #fff2cc, #ffba00)" },
    { id: "bg-sky", name: "Sky Blue", category: "background", cost: 0, isPremium: false, value: "linear-gradient(to bottom, #d9eeff, #1f9bff)" },
    { id: "bg-grape", name: "Grape Purple", category: "background", cost: 500, isPremium: true, value: "linear-gradient(to bottom, #ece0ff, #8b4dff)" },
    { id: "bg-teal", name: "Teal Mint", category: "background", cost: 500, isPremium: true, value: "linear-gradient(to bottom, #d4f5ef, #14c2a0)" },
    { id: "bg-coral", name: "Coral Peach", category: "background", cost: 500, isPremium: true, value: "linear-gradient(to bottom, #ffe3e0, #ff5a47)" },
    { id: "bg-rainbow", name: "Magical Rainbow", category: "background", cost: 3000, isPremium: true, value: "linear-gradient(135deg, #ff7a6b, #ffba00, #7ed957, #1f9bff, #a06bff)" },
    { id: "bg-space", name: "Deep Space Stars", category: "background", cost: 4000, isPremium: true, value: "linear-gradient(to bottom, #100a26, #2c2140)" },
  ],
};
