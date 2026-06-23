import { supabase } from "./supabase";
import type { Card } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TcgRun {
  id: string;
  name: string;
  status: "active" | "exhausted" | "retired";
  created_at: string;
}

export interface PackSupply {
  pack_type: string;
  total_supply: number;
  opened_count: number;
  remaining: number;
}

export interface PullLogEntry {
  id: number;
  run_id: string;
  pack_type: string;
  child_id: string;
  card_id: string;
  card_name: string;
  rarity: string;
  has_image: boolean;
  pulled_at: string;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Get the currently active run (most recent active run). */
export async function getActiveRun(): Promise<TcgRun | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tcg_runs")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as TcgRun;
}

/** Get pack supply for a given run. Returns all pack types with remaining counts. */
export async function getPackSupply(
  runId: string
): Promise<PackSupply[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tcg_pack_inventory")
    .select("pack_type, total_supply, opened_count")
    .eq("run_id", runId);

  if (error || !data) return [];
  return data.map((row) => ({
    ...row,
    remaining: row.total_supply - row.opened_count,
  }));
}

/** Get remaining supply for a specific pack type in a run. */
export async function getPackRemaining(
  runId: string,
  packType: string
): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("tcg_pack_inventory")
    .select("total_supply, opened_count")
    .eq("run_id", runId)
    .eq("pack_type", packType)
    .single();

  if (error || !data) return 0;
  return data.total_supply - data.opened_count;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Log pulled cards and decrement pack supply.
 * Returns false if the pack is sold out or an error occurs.
 */
export async function logPullAndDecrement(
  runId: string,
  packType: string,
  childId: string,
  pulledCards: Card[]
): Promise<boolean> {
  if (!supabase) return false;

  // 1. Check remaining supply
  const { data: inv, error: invErr } = await supabase
    .from("tcg_pack_inventory")
    .select("id, total_supply, opened_count")
    .eq("run_id", runId)
    .eq("pack_type", packType)
    .single();

  if (invErr || !inv) return false;
  if (inv.opened_count >= inv.total_supply) return false; // sold out

  // 2. Increment opened count
  const { error: updateErr } = await supabase
    .from("tcg_pack_inventory")
    .update({ opened_count: inv.opened_count + 1 })
    .eq("id", inv.id);

  if (updateErr) return false;

  // 3. Log each pulled card
  const pullRows = pulledCards.map((card) => ({
    run_id: runId,
    pack_type: packType,
    child_id: childId,
    card_id: card.id,
    card_name: card.name,
    rarity: card.rarity,
    has_image: !!card.imageUrl,
  }));

  const { error: logErr } = await supabase
    .from("tcg_pull_log")
    .insert(pullRows);

  if (logErr) {
    console.error("Failed to log pulls:", logErr);
    // Don't fail the whole operation - pack was already decremented
  }

  return true;
}

/** Get all pulls for a run, optionally filtered by child. */
export async function getRunPullHistory(
  runId: string,
  childId?: string
): Promise<PullLogEntry[]> {
  if (!supabase) return [];

  let query = supabase
    .from("tcg_pull_log")
    .select("*")
    .eq("run_id", runId)
    .order("pulled_at", { ascending: false });

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as PullLogEntry[];
}

/** Get pull stats summary for a run. */
export async function getRunStats(runId: string): Promise<{
  totalPulls: number;
  byRarity: Record<string, number>;
  byChild: Record<string, number>;
}> {
  const pulls = await getRunPullHistory(runId);
  const byRarity: Record<string, number> = {};
  const byChild: Record<string, number> = {};

  for (const pull of pulls) {
    byRarity[pull.rarity] = (byRarity[pull.rarity] ?? 0) + 1;
    byChild[pull.child_id] = (byChild[pull.child_id] ?? 0) + 1;
  }

  return { totalPulls: pulls.length, byRarity, byChild };
}
