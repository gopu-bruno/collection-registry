// One-off seed: writes a few starter collections/<ns>/<name>.json entries.
// These are the registry's source of truth. After seeding, more collections are
// added via pull request — that's how publishing works, and what the demo shows.
//
// Every field here is real: authored identity/metadata + the git source repo.
// No engagement/usage stats are stored until they can be measured for real.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Each entry's source points at a real Bruno collection (opencollection.yml +
// .yml requests) hosted in the bruno-collections repo under its own subdir.
// Community-authored, so verified/official are false.
const HOST_REPO = 'https://github.com/gopu-bruno/bruno-collections';

const COLLECTIONS = [
  { ns: 'stripe', name: 'stripe-api', title: 'Stripe API', tagline: 'Payments, customers and webhooks for the Stripe REST API.', category: 'payments', featured: true, trending: false, langs: ['REST'], color: '#635bff' },
  { ns: 'github', name: 'rest-api', title: 'GitHub REST API', tagline: 'Core endpoints of the GitHub REST API.', category: 'devops', featured: true, trending: false, langs: ['REST'], color: '#24292e' },
  { ns: 'openai', name: 'openai-api', title: 'OpenAI API', tagline: 'Chat completions and models for the OpenAI API.', category: 'ai', featured: true, trending: false, langs: ['REST'], color: '#10a37f' },
];

const entryFor = (c) => ({
  ns: c.ns,
  name: c.name,
  title: c.title,
  tagline: c.tagline,
  category: c.category,
  verified: false,
  official: false,
  featured: c.featured,
  trending: c.trending,
  langs: c.langs,
  color: c.color,
  source: { type: 'git', repo: HOST_REPO, subdir: `${c.ns}-${c.name}`, ref: 'main' }
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
