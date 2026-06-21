// GitHub Releases → per-collection usage stats.
//
// In the "point, never host" model a published version is a git tag, and a
// release on that tag carries the collection's `opencollection.yml` as an
// asset. Downloading that asset is the install — GitHub counts it on the asset
// (`download_count`). So the registry needs no telemetry of its own: the real
// install count is just the sum of asset downloads across a collection's
// releases, read straight from the GitHub Releases API.
//
// Because several collections can live in one repo (a monorepo of collections),
// releases are attributed to a collection by a tag PREFIX:
//   • explicit  — `source.tagPrefix` on the entry (e.g. "stripe-stripe-api@")
//   • derived   — `<subdir>@`  when the collection sits in a subdir
//   • whole-repo — no prefix; every release counts (one collection per repo)
// The version shown is the tag with that prefix stripped.

const GITHUB_API = 'https://api.github.com';
const ASSET_RE = /opencollection.*\.ya?ml$/i;

export function parseRepo(url) {
  const m = String(url || '').match(/github\.com[/:]([^/]+)\/([^/.\s]+)/i);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;
}

// Tag prefix that identifies this collection's releases (see header).
export function tagPrefixFor(entry) {
  const s = entry.source || {};
  if (s.tagPrefix) return s.tagPrefix;
  if (s.subdir && s.subdir !== '.') return `${s.subdir}@`;
  return null; // whole-repo: every release belongs to this collection
}

function stripPrefix(tag, prefix) {
  if (prefix && tag.startsWith(prefix)) return tag.slice(prefix.length);
  return tag.replace(/^v/, '');
}

function pickAsset(release) {
  const assets = release.assets || [];
  return assets.find((a) => ASSET_RE.test(a.name)) || assets[0] || null;
}

function assetDownloads(release) {
  return (release.assets || []).reduce((s, a) => s + (a.download_count || 0), 0);
}

// Fetch every (non-draft) release for a repo, paginated. Returns [] on 404
// (no releases / repo gone); throws on other errors so callers can decide.
export async function fetchRepoReleases(owner, repo, { token, fetchImpl = fetch } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'bruno-collection-registry' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetchImpl(`${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=100&page=${page}`, { headers });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`GitHub ${res.status} ${res.statusText} for ${owner}/${repo}/releases`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all.filter((r) => !r.draft);
}

// Reduce a repo's raw releases to one collection's stats (filtered by prefix).
export function statsFromReleases(releases, entry) {
  const prefix = tagPrefixFor(entry);
  const mine = (releases || []).filter((r) => (prefix ? (r.tag_name || '').startsWith(prefix) : true));
  const sorted = mine.slice().sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
  const latest = sorted.find((r) => !r.prerelease) || sorted[0] || null;
  const latestAsset = latest ? pickAsset(latest) : null;

  return {
    version: latest ? stripPrefix(latest.tag_name, prefix) : null,
    downloads: mine.reduce((s, r) => s + assetDownloads(r), 0),
    releaseCount: mine.length,
    latestAssetUrl: latestAsset ? latestAsset.browser_download_url : null,
    releases: sorted.slice(0, 20).map((r) => {
      const asset = pickAsset(r);
      return {
        version: stripPrefix(r.tag_name, prefix),
        tag: r.tag_name,
        publishedAt: r.published_at,
        downloads: assetDownloads(r),
        prerelease: !!r.prerelease,
        notes: (r.body || '').split('\n').find((l) => l.trim()) || '',
        assetUrl: asset ? asset.browser_download_url : null,
      };
    }),
  };
}
