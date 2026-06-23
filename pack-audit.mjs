#!/usr/bin/env node
/**
 * SifirKids TCG Pack Audit Script
 * Reads data.ts, extracts cards + packs, and produces a rarity distribution report.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

// --- 1. Read and parse data.ts ---
const src = readFileSync("src/lib/data.ts", "utf-8");

// Extract the CARDS array
const cardsMatch = src.match(/export\s+const\s+CARDS\s*:\s*Card\[\]\s*=\s*\[([\s\S]*?)\n\];/);
if (!cardsMatch) { console.error("Could not find CARDS array"); process.exit(1); }

// Extract the PACKS array
const packsMatch = src.match(/export\s+const\s+PACKS\s*:\s*PackConfig\[\]\s*=\s*\[([\s\S]*?)\n\];/);
if (!packsMatch) { console.error("Could not find PACKS array"); process.exit(1); }

// --- Parse cards ---
function parseCards(raw) {
  const cards = [];
  // Match each { ... } block
  const blocks = [...raw.matchAll(/\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)];
  for (const block of blocks) {
    const body = block[1];
    const get = (key) => {
      const m = body.match(new RegExp(`${key}\\s*:\\s*"([^"]*?)"`));
      return m ? m[1] : undefined;
    };
    const id = get("id");
    if (!id) continue;
    cards.push({
      id,
      name: get("name") || id,
      set: get("set") || "unknown",
      rarity: get("rarity") || "common",
      imageUrl: get("imageUrl"),
      releasedIn: get("releasedIn") || "SK-01",
    });
  }
  return cards;
}

// --- Parse packs ---
function parsePacks(raw) {
  const packs = [];
  // Split on each top-level object
  const blocks = [...raw.matchAll(/\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g)];
  for (const block of blocks) {
    const body = block[1];
    const getStr = (key) => {
      const m = body.match(new RegExp(`${key}\\s*:\\s*"([^"]*?)"`));
      return m ? m[1] : undefined;
    };
    const getNum = (key) => {
      const m = body.match(new RegExp(`${key}\\s*:\\s*([\\d.]+)`));
      return m ? parseFloat(m[1]) : 0;
    };
    const getArr = (key) => {
      const m = body.match(new RegExp(`${key}\\s*:\\s*\\[([^\\]]*?)\\]`));
      if (!m) return [];
      return [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
    };

    const id = getStr("id");
    if (!id) continue;

    // Parse rarityWeights sub-object
    const rwMatch = body.match(/rarityWeights\s*:\s*\{([^}]*)\}/);
    const rw = { common: 0, uncommon: 0, rare: 0, ultra_rare: 0, secret_gold: 0 };
    if (rwMatch) {
      for (const tier of Object.keys(rw)) {
        const m = rwMatch[1].match(new RegExp(`${tier}\\s*:\\s*([\\d.]+)`));
        if (m) rw[tier] = parseFloat(m[1]);
      }
    }

    packs.push({
      id,
      name: getStr("name") || id,
      cost: getNum("cost"),
      cardCount: getNum("cardCount"),
      allowedSets: getArr("allowedSets"),
      rarityWeights: rw,
    });
  }
  return packs;
}

const allCards = parseCards(cardsMatch[1]);
const allPacks = parsePacks(packsMatch[1]);

console.log(`Parsed ${allCards.length} cards and ${allPacks.length} packs.`);

// --- 2. Define runs ---
const RUN_ORDER = ["SK-01", "SK-02"];

function getCumulativePool(runId) {
  const idx = RUN_ORDER.indexOf(runId);
  const allowedRuns = RUN_ORDER.slice(0, idx + 1);
  return allCards.filter(c => allowedRuns.includes(c.releasedIn));
}

const RARITIES = ["common", "uncommon", "rare", "ultra_rare", "secret_gold"];

// --- 3. Audit each pack x run ---
const results = [];
const issues = [];

for (const pack of allPacks) {
  for (const run of RUN_ORDER) {
    const pool = getCumulativePool(run);
    const withImages = pool.filter(c => !!c.imageUrl);
    const withoutImages = pool.filter(c => !c.imageUrl);

    const byRarity = {};
    const byRarityWithImg = {};
    for (const r of RARITIES) {
      byRarity[r] = pool.filter(c => c.rarity === r).length;
      byRarityWithImg[r] = withImages.filter(c => c.rarity === r).length;
    }

    const totalWeight = Object.values(pack.rarityWeights).reduce((a, b) => a + b, 0);

    const rarityDetails = {};
    for (const r of RARITIES) {
      const weight = pack.rarityWeights[r];
      const pct = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : "0.0";
      const poolCount = byRarityWithImg[r];
      const totalPoolCount = byRarity[r];
      const noImage = totalPoolCount - poolCount;

      rarityDetails[r] = { weight, pct, poolCount, totalPoolCount, noImage };

      if (weight > 0 && poolCount === 0) {
        issues.push({
          pack: pack.name,
          packId: pack.id,
          run,
          rarity: r,
          weight,
          pct,
          totalInPool: totalPoolCount,
          noImageCount: noImage,
          msg: totalPoolCount > 0
            ? `Has ${totalPoolCount} cards but NONE have images - falls back to common`
            : `0 cards in pool - falls back to common`,
        });
      }
    }

    results.push({
      pack,
      run,
      totalPool: pool.length,
      pullablePool: withImages.length,
      missingImages: withoutImages.length,
      missingImageCards: withoutImages.map(c => `${c.id} (${c.name})`),
      byRarity,
      byRarityWithImg,
      rarityDetails,
    });
  }
}

// --- 4. Build report ---
let md = `# SifirKids TCG Pack Audit Report\n\n`;
md += `> Generated: ${new Date().toISOString()}\n`;
md += `> **New pull logic:** When buying from a run, packs pull from the FULL cumulative card pool (not limited by allowedSets). Pack type only controls rarity weights.\n\n`;

// Summary stats
md += `## Card Database Summary\n\n`;
md += `| Metric | Count |\n|--------|-------|\n`;
md += `| Total cards in database | ${allCards.length} |\n`;
md += `| Cards with images | ${allCards.filter(c => !!c.imageUrl).length} |\n`;
md += `| Cards WITHOUT images | ${allCards.filter(c => !c.imageUrl).length} |\n`;
md += `| SK-01 cards | ${allCards.filter(c => c.releasedIn === "SK-01").length} |\n`;
md += `| SK-02 cards | ${allCards.filter(c => c.releasedIn === "SK-02").length} |\n\n`;

// Pool size per run
md += `## Pool Size per Run (Pullable = has image)\n\n`;
md += `| Run | Total Cards | With Images (Pullable) | Without Images |\n`;
md += `|-----|------------|----------------------|----------------|\n`;
for (const run of RUN_ORDER) {
  const pool = getCumulativePool(run);
  const withImg = pool.filter(c => !!c.imageUrl).length;
  const noImg = pool.filter(c => !c.imageUrl).length;
  md += `| ${run} | ${pool.length} | ${withImg} | ${noImg} |\n`;
}
md += `\n`;

// Cards missing images
const noImgCards = allCards.filter(c => !c.imageUrl);
if (noImgCards.length > 0) {
  md += `## Cards Missing Images (Excluded from Pull Pool)\n\n`;
  md += `| Card ID | Name | Set | Rarity | Released In |\n`;
  md += `|---------|------|-----|--------|-------------|\n`;
  for (const c of noImgCards) {
    md += `| ${c.id} | ${c.name} | ${c.set} | ${c.rarity} | ${c.releasedIn} |\n`;
  }
  md += `\n`;
}

// Main audit table
md += `## Pack x Run Rarity Distribution\n\n`;
md += `For each pack type and run, shows: pullable cards per rarity tier (cards with images in cumulative pool).\n\n`;

for (const pack of allPacks) {
  md += `### ${pack.icon} ${pack.name} (\`${pack.id}\`)\n\n`;
  md += `- **Cost:** ${pack.cost.toLocaleString()} pts | **Cards per pack:** ${pack.cardCount}\n`;
  md += `- **allowedSets:** ${pack.allowedSets.join(", ")} *(ignored for run-based pulls)*\n\n`;

  md += `| Run | Pool | Pullable | Common | Uncommon | Rare | Ultra Rare | Secret Gold |\n`;
  md += `|-----|------|----------|--------|----------|------|------------|-------------|\n`;

  for (const run of RUN_ORDER) {
    const r = results.find(x => x.pack.id === pack.id && x.run === run);
    const d = r.rarityDetails;
    const fmt = (tier) => {
      const t = d[tier];
      const flag = (t.weight > 0 && t.poolCount === 0) ? " ⚠️" : "";
      return `${t.poolCount}/${t.totalPoolCount} (${t.pct}%)${flag}`;
    };
    md += `| ${run} | ${r.totalPool} | ${r.pullablePool} | ${fmt("common")} | ${fmt("uncommon")} | ${fmt("rare")} | ${fmt("ultra_rare")} | ${fmt("secret_gold")} |\n`;
  }
  md += `\n`;

  // Rarity weights
  md += `**Rarity Weights:** `;
  const totalW = Object.values(pack.rarityWeights).reduce((a, b) => a + b, 0);
  md += RARITIES.map(r => `${r}: ${pack.rarityWeights[r]}/${totalW} (${((pack.rarityWeights[r] / totalW) * 100).toFixed(1)}%)`).join(" | ");
  md += `\n\n`;
}

// Issues
md += `## ⚠️ Issues Found\n\n`;
if (issues.length === 0) {
  md += `✅ **No issues found.** All rarity tiers with weight > 0 have pullable cards in every run.\n\n`;
} else {
  md += `Found **${issues.length}** issue(s) where a rarity tier has weight > 0 but 0 pullable cards (will fall back to common):\n\n`;
  md += `| Pack | Run | Rarity | Weight | Pull Rate | Cards in Pool | Issue |\n`;
  md += `|------|-----|--------|--------|-----------|---------------|-------|\n`;
  for (const i of issues) {
    md += `| ${i.pack} | ${i.run} | ${i.rarity} | ${i.weight} | ${i.pct}% | ${i.totalInPool} | ${i.msg} |\n`;
  }
  md += `\n`;
}

// Per-run rarity breakdown
md += `## Full Rarity Breakdown per Run (All Cards)\n\n`;
for (const run of RUN_ORDER) {
  const pool = getCumulativePool(run);
  const withImg = pool.filter(c => !!c.imageUrl);
  md += `### ${run} (${pool.length} total, ${withImg.length} pullable)\n\n`;
  md += `| Rarity | Total | With Image | Without Image |\n`;
  md += `|--------|-------|------------|---------------|\n`;
  for (const r of RARITIES) {
    const total = pool.filter(c => c.rarity === r).length;
    const img = withImg.filter(c => c.rarity === r).length;
    md += `| ${r} | ${total} | ${img} | ${total - img} |\n`;
  }
  md += `\n`;
}

// Write report
const outPath = "/Users/hazwans./.gemini/antigravity/brain/4f45471f-0404-43dc-887c-374a1f463267/pack_audit_report.md";
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, md);
console.log(`\nReport written to: ${outPath}`);
console.log(`\nIssues found: ${issues.length}`);
if (issues.length > 0) {
  for (const i of issues) {
    console.log(`  ⚠️ ${i.pack} / ${i.run} / ${i.rarity}: ${i.msg}`);
  }
}
