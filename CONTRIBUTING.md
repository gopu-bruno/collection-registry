# Adding a collection

Publishing to the registry is a pull request. No account, no server — GitHub is the auth and review layer.

1. Add a file at `collections/<ns>/<name>.json` where `<ns>` is your publisher/owner name and `<name>` is the collection. Example:

```json
{
  "ns": "anthropic",
  "name": "claude-api",
  "title": "Claude Messages API",
  "tagline": "Anthropic Messages API with tool use and prompt caching.",
  "category": "ai",
  "verified": true,
  "official": true,
  "featured": false,
  "trending": true,
  "langs": ["REST", "Streaming"],
  "color": "#d97757",
  "source": {
    "type": "git",
    "repo": "https://github.com/anthropics/anthropic-sdk-typescript",
    "subdir": ".",
    "ref": "main"
  }
}
```

2. Required fields: `ns`, `name`, `title`, `tagline`, `category`, `source`. Valid categories: `payments`, `ai`, `auth`, `devops`, `comms`, `data`, `storage`, `productivity`. See [the schema](schema/collection.schema.json).

3. Open a PR. CI validates your entry. On merge, `index.json` is rebuilt automatically and your collection appears on the find page.

> `verified` / `official` are editorial flags set during review.

# Versioning & releases

Your entry only points at a repo. **Versions and install counts come from GitHub Releases on that repo** — the registry reads them, it never stores them. A version *is* a git tag; the install count *is* the number of times that release's artifact was downloaded.

To publish a version, create a **GitHub Release** carrying your collection as a single-file `opencollection.yml` asset:

```
gh release create v1.0.0 opencollection.yml \
  --repo <owner>/<repo> \
  --title "v1.0.0" \
  --notes "First release."
```

(or GitHub → *Releases* → *Draft a new release*). The build then reads, for your collection:

- **version** — the latest release's tag (prefix stripped, see below),
- **downloads** — the sum of that collection's release-asset `download_count`s,
- **releases** — the version history shown on the detail page.

These are re-baked into `index.json` on every merge and on an hourly schedule, so counts stay current without a PR.

## Tag a release for one collection in a shared repo

Tags and releases are **repo-wide** — there is no tag "on a folder." So when several collections live in one repo, name the tag with a **prefix** that identifies the collection, and the build attributes the release to it:

| Your repo layout | How to tag | `tagPrefix` in your entry |
|---|---|---|
| One collection = one repo (`subdir: "."`) | `v1.0.0` | omit (whole-repo) |
| Collection in a subdir of a shared repo | `<subdir>@1.0.0`, e.g. `stripe-stripe-api@1.0.0` | omit — defaults to `"<subdir>@"` |
| Custom scheme | your prefix + version, e.g. `payments-api@1.0.0` | set `"tagPrefix": "payments-api@"` |

The **version shown is the tag with the prefix stripped** (`stripe-stripe-api@1.0.0` → `v1.0.0`). This is the Go-modules submodule-tag convention.

> `source.ref` (e.g. `"main"`) is **not** the version — it's only the *fallback* install target for collections that don't cut releases. A versioned install resolves to the release **tag**; `ref` is "track this branch" when there are no releases.

> Nothing runs on install. The `opencollection.yml` asset is fetched and written into the user's workspace as native `.bru` files — downloading it is what GitHub counts as an install.
