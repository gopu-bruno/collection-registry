// Builds index.json from every collections/<ns>/<name>.json file.
// This is what the website and the app fetch — one request, client-side search.
//
//   node scripts/build-index.mjs          # write index.json
//   node scripts/build-index.mjs --check  # validate entries only (used in PR CI)
//
// "featured" / "trending" / "categories" / totals are DERIVED here, so adding a
// collection via PR is all it takes for it to show up on the find page.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const COLLECTIONS_DIR = join(ROOT, 'collections');
const CHECK = process.argv.includes('--check');

// Category catalog: id -> display label + icon name (icons live in the website).
const CATEGORIES = {
  payments:     { label: 'Payments',         icon: 'card' },
  ai:           { label: 'AI & ML',          icon: 'sparkle' },
  auth:         { label: 'Auth & Identity',  icon: 'key' },
  devops:       { label: 'DevOps & Infra',   icon: 'server' },
  comms:        { label: 'Communications',   icon: 'message' },
  data:         { label: 'Data & Analytics', icon: 'chart' },
  storage:      { label: 'Storage & CDN',    icon: 'box' },
  productivity: { label: 'Productivity',     icon: 'layout' },
};

const REQUIRED = ['ns', 'name', 'title', 'tagline', 'category', 'version', 'source'];

async function readAll() {
  const out = [];
  let nsDirs = [];
  try {
    nsDirs = await readdir(COLLECTIONS_DIR, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const d of nsDirs) {
    if (!d.isDirectory()) continue;
    const files = await readdir(join(COLLECTIONS_DIR, d.name));
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const path = join(COLLECTIONS_DIR, d.name, f);
      let entry;
      try {
        entry = JSON.parse(await readFile(path, 'utf8'));
      } catch (e) {
        throw new Error(`Invalid JSON in ${d.name}/${f}: ${e.message}`);
      }
      validate(entry, `${d.name}/${f}`);
      out.push(entry);
    }
  }
  return out;
}

function validate(entry, where) {
  for (const k of REQUIRED) {
    if (entry[k] === undefined || entry[k] === null || entry[k] === '') {
      throw new Error(`${where}: missing required field "${k}"`);
    }
  }
  if (!CATEGORIES[entry.category]) {
    throw new Error(`${where}: unknown category "${entry.category}" (valid: ${Object.keys(CATEGORIES).join(', ')})`);
  }
  if (!entry.source || entry.source.type !== 'git' || !entry.source.repo) {
    throw new Error(`${where}: source must be { type: "git", repo: "<url>" }`);
  }
}

function buildIndex(all) {
  const byDownloads = [...all].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  const featured = byDownloads.filter((c) => c.featured).slice(0, 3);
  const trending = byDownloads.filter((c) => c.trending && !c.featured).slice(0, 6);

  const counts = {};
  for (const c of all) counts[c.category] = (counts[c.category] || 0) + 1;
  const categories = Object.entries(CATEGORIES)
    .map(([id, meta]) => ({ id, label: meta.label, icon: meta.icon, count: counts[id] || 0 }))
    .filter((c) => c.count > 0);

  const publishers = new Set(all.map((c) => c.ns)).size;
  const totalInstalls = all.reduce((s, c) => s + (c.downloads || 0), 0);

  return {
    featured,
    trending,
    categories,
    all: byDownloads,
    totalCollections: all.length,
    publishers,
    monthlyInstalls: fmtInstalls(totalInstalls),
  };
}

const fmtInstalls = (n) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1000 ? Math.round(n / 1000) + 'k' : String(n);

async function main() {
  const all = await readAll();
  if (!all.length) throw new Error('No collections found under collections/.');

  if (CHECK) {
    console.log(`✓ ${all.length} collection(s) valid.`);
    return;
  }

  const index = buildIndex(all);
  await writeFile(join(ROOT, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  console.log(`Wrote index.json — ${all.length} collections, ${index.publishers} publishers.`);
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
