// One-off seed: writes a few starter collections/<ns>/<name>.json entries.
// These are the registry's source of truth. After seeding, more collections are
// added via pull request — that's how publishing works, and what the demo shows.
//
// Stats (downloads/stars) are placeholder seed values until real install
// telemetry lands; everything else (identity, source repo, category) is real.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const COLLECTIONS = [
  { ns: 'stripe', name: 'stripe-api', title: 'Stripe API', tagline: 'Official Stripe REST API collection — payments, customers, webhooks.', category: 'payments', featured: true, trending: false, verified: true, official: true, downloads: 482310, stars: 3120, requests: 412, version: '2025.08.12', updated: '2d ago', langs: ['REST', 'Webhooks'], color: '#635bff', repo: 'https://github.com/stripe/openapi' },
  { ns: 'github', name: 'rest-api', title: 'GitHub REST API', tagline: 'Full GitHub REST API v2022-11-28, 600+ requests with examples.', category: 'devops', featured: true, trending: false, verified: true, official: true, downloads: 301842, stars: 2287, requests: 612, version: '2022.11.28', updated: '1w ago', langs: ['REST', 'GraphQL'], color: '#24292e', repo: 'https://github.com/github/rest-api-description' },
  { ns: 'openai', name: 'openai-api', title: 'OpenAI API', tagline: 'Chat, embeddings, audio, images — the complete OpenAI API surface.', category: 'ai', featured: true, trending: false, verified: true, official: true, downloads: 228109, stars: 1984, requests: 64, version: '1.40.2', updated: '3d ago', langs: ['REST', 'Streaming'], color: '#10a37f', repo: 'https://github.com/openai/openai-openapi' },
];

const entryFor = (c) => ({
  ns: c.ns,
  name: c.name,
  title: c.title,
  tagline: c.tagline,
  category: c.category,
  verified: c.verified,
  official: c.official,
  featured: c.featured,
  trending: c.trending,
  downloads: c.downloads,
  stars: c.stars,
  requests: c.requests,
  version: c.version,
  updated: c.updated,
  langs: c.langs,
  color: c.color,
  source: { type: 'git', repo: c.repo, subdir: '.', ref: 'main' }
});

const run = async () => {
  for (const c of COLLECTIONS) {
    const file = join(ROOT, 'collections', c.ns, `${c.name}.json`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(entryFor(c), null, 2) + '\n');
    console.log('seeded', `${c.ns}/${c.name}`);
  }
  console.log(`\n${COLLECTIONS.length} collections seeded.`);
};

run();
