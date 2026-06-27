import type { ChildId, ColorKey, ModuleId } from "./types";

/* ------------------------------------------------------------------ */
/* Module Registry                                                     */
/* Central config for every learning module in sifirkids.              */
/* Controls visibility, locking, theming, and child access.            */
/* ------------------------------------------------------------------ */

export type ModuleStatus = "active" | "coming_soon" | "locked";

export interface ModuleConfig {
  id: ModuleId;
  /** Display label (BM) */
  label: string;
  /** Emoji icon for the card */
  emoji: string;
  /** Design-system color palette for this module */
  accent: ColorKey;
  /** Short description shown on the card */
  description: string;
  /** Module availability status */
  status: ModuleStatus;
  /** If true, requires parent PIN to access even when active */
  parentOnly: boolean;
  /** Which children can see this module, or "all" */
  children: ChildId[] | "all";
  /** Animation delay offset in the grid (ms) */
  animationDelay: number;
}

/**
 * Master registry of all modules.
 * New modules start as "coming_soon" or "locked".
 * Parent unlocks via PIN in parent dashboard.
 */
export const MODULE_REGISTRY: ModuleConfig[] = [
  {
    id: "multiplication",
    label: "Times Tables",
    emoji: "✖️",
    accent: "coral",
    description: "Multiply 2 to 12",
    status: "active",
    parentOnly: false,
    children: "all",
    animationDelay: 0,
  },
  {
    id: "arabic",
    label: "Alif Ba Ta",
    emoji: "ا ب ت",
    accent: "teal",
    description: "Learn Arabic letters",
    status: "active",
    parentOnly: false,
    children: "all",
    animationDelay: 80,
  },
  {
    id: "sejarah",
    label: "Sejarah Tingkatan 3",
    emoji: "📜",
    accent: "teal",
    description: "Kuiz KSSM — 8 Bab Kedatangan Kuasa Asing",
    status: "active",
    parentOnly: false,
    children: ["dhiya"],
    animationDelay: 160,
  },
  {
    id: "geografi",
    label: "Geografi Tingkatan 3",
    emoji: "🌍",
    accent: "sky",
    description: "Kuiz KSSM — Kemahiran, Fizikal & Manusia (Tingkatan 1-3)",
    status: "active",
    parentOnly: false,
    children: ["dhiya"],
    animationDelay: 170,
  },
  {
    id: "peribahasa",
    label: "Peribahasa",
    emoji: "📖",
    accent: "grape",
    description: "Tingkatan 1, 2 & 3 — Simpulan Bahasa & Peribahasa",
    status: "active",
    parentOnly: false,
    children: "all",
    animationDelay: 240,
  },
  {
    id: "science",
    label: "Sains",
    emoji: "🔬",
    accent: "sky",
    description: "Kuiz Sains KSSR/KSSM — mengikut tahap umur",
    status: "coming_soon",
    parentOnly: true,
    children: "all",
    animationDelay: 320,
  },
  {
    id: "bahasa_melayu",
    label: "Bahasa Melayu",
    emoji: "📝",
    accent: "sunny",
    description: "Kuiz BM KSSR/KSSM - mengikut tahap umur",
    status: "active",
    parentOnly: false,
    children: "all",
    animationDelay: 400,
  },
  {
    id: "pafa_kafa",
    label: "Fardu Ain (PAFA/KAFA)",
    emoji: "🕌",
    accent: "grape",
    description: "Kuiz Perkara Asas Fardu Ain & Kurikulum KAFA",
    status: "active",
    parentOnly: false,
    children: "all",
    animationDelay: 480,
  },
  {
    id: "ai_specs",
    label: "AI Models & Frameworks",
    emoji: "🤖",
    accent: "sky",
    description: "Context windows, pricing, RAG & model capabilities",
    status: "active",
    parentOnly: false,
    children: ["papa", "mommy"],
    animationDelay: 560,
  },
  {
    id: "integration_logic",
    label: "No-Code Integration",
    emoji: "🔗",
    accent: "teal",
    description: "Webhooks, Make.com, API errors & automation logic",
    status: "active",
    parentOnly: false,
    children: ["papa", "mommy"],
    animationDelay: 640,
  },
  {
    id: "legal_ops",
    label: "Malaysian Labour Law",
    emoji: "⚖️",
    accent: "coral",
    description: "Employment Act 1955, wages, leave & East Malaysia",
    status: "active",
    parentOnly: false,
    children: ["papa", "mommy"],
    animationDelay: 720,
  },
];

/** Get modules visible to a specific child, respecting status. */
export function getModulesForChild(childId: ChildId): ModuleConfig[] {
  return MODULE_REGISTRY.filter(
    (m) => m.children === "all" || m.children.includes(childId),
  );
}

/** Get only active (unlocked) modules for a child. */
export function getActiveModulesForChild(childId: ChildId): ModuleConfig[] {
  return getModulesForChild(childId).filter((m) => m.status === "active");
}

/** Get coming_soon/locked modules (for parent dashboard preview). */
export function getLockedModules(): ModuleConfig[] {
  return MODULE_REGISTRY.filter(
    (m) => m.status === "coming_soon" || m.status === "locked",
  );
}

/** Check if a module is accessible (active and not parent-only). */
export function isModuleAccessible(moduleId: ModuleId): boolean {
  const mod = MODULE_REGISTRY.find((m) => m.id === moduleId);
  return mod ? mod.status === "active" && !mod.parentOnly : false;
}
