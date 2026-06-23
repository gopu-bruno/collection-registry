# Publishing & versioning

Publishing is **two separate acts**, because they touch different repos:

| Act | Where | Needs | How often |
|---|---|---|---|
| **Publish a version** (release) | your **own** repo | repo · version · `opencollection.yml` | every release |
| **List on the registry** | this repo (a PR) | `ns` · `name` · `title` · `tagline` · `category` · `source` | **once** |

A *version* is a git tag with a GitHub Release; the release's `opencollection.yml`
asset is what users download (its `download_count` is the install metric). The
*listing* is a one-time PR adding `collections/<ns>/<name>.json`. After the first
listing, new versions need **no PR** — the index re-bakes from your release tags.

See [ARCHITECTURE.md](ARCHITECTURE.md) for why it's split this way.

---

## From the Bruno app (one flow)

1. **Discover** (globe icon) → **Publish**.
2. **Select** — pick a collection open in your workspace. Bruno reads its git
   remote and prefills the **repo** + **subdir**, and checks the index:
   *Listed* (release-only) or *Not listed yet* (you'll also get the List step).
3. **Publish version** — confirm repo, set the **version** (tag preview shown),
   paste a **GitHub token** (Contents: write on your repo) → it bundles the
   collection to `opencollection.yml`, creates the release, uploads the asset.
4. **List on the registry** *(first time only)* — confirm `ns/name/title/tagline/
   category` → **Open registry PR**. The app opens the PR for you: if your token
   has write here it branches directly; otherwise it **forks** the repo to your
   account and opens the PR from the fork (token needs `public_repo`). Either way
   a maintainer reviews and merges.
5. **Done** — release URL + PR URL. Later versions repeat only steps 2–3.

---

## From the CLI (equivalent)

### 1. Release + asset — your own repo
```bash
# opencollection.yml = the bundled collection (Bruno → export → OpenCollection)
gh release create '<subdir>@1.0.0' opencollection.yml \
  --repo <owner>/<repo> --title '<name> v1.0.0' --notes 'First release.'
```
The tag scheme is `<subdir>@<version>` when the collection lives in a subdir of a
shared repo (so many collections can coexist), else plain `v<version>`. The
version shown is the tag with that prefix stripped.

### 2. Listing PR — this repo (first time only)
```bash
git clone https://github.com/gopu-bruno/collection-registry && cd collection-registry
git checkout -b add-<ns>-<name>
mkdir -p collections/<ns>
$EDITOR collections/<ns>/<name>.json   # see schema/ + the example in CONTRIBUTING.md
git add collections/<ns>/<name>.json
git commit -m "Add <ns>/<name> collection"
git push -u origin add-<ns>-<name>
gh pr create --base main --title "Add <ns>/<name>" --body "Lists <ns>/<name>."
```

**No write access to this repo?** You won't be able to push a branch here — it's
not your repo. Use **fork-and-PR** (the normal open-source path):
```bash
gh repo fork gopu-bruno/collection-registry --clone   # makes <you>/collection-registry
cd collection-registry
git checkout -b add-<ns>-<name>
# ...add the file, commit...
git push -u origin add-<ns>-<name>                     # pushes to YOUR fork
gh pr create --repo gopu-bruno/collection-registry --base main \
  --head <you>:add-<ns>-<name> --title "Add <ns>/<name>"
```
A *fork* is your own server-side copy of the repo (which you can write to); the PR
proposes your change back to the original, where a maintainer reviews and merges.

### 3. Subsequent versions — no PR
```bash
gh release create '<subdir>@1.1.0' opencollection.yml \
  --repo <owner>/<repo> --title '<name> v1.1.0' --notes 'Changes…'
```

---

## "The index re-bakes" — what that means

`index.json` is built by [`scripts/build-index.mjs`](scripts/build-index.mjs),
which reads every `collections/*.json` **and** calls the GitHub API for each
collection's releases, writing the latest **version** + **download counts** into
the file. **Re-baking** = running that build again so those numbers refresh.

It runs on merge to `main`, on manual `workflow_dispatch`, and (when re-enabled)
on a `schedule`. So after you cut a release you change nothing here — the next
re-bake re-reads your repo's releases and updates the numbers the website/app
show. They're "baked" (precomputed into a static file) rather than fetched live,
so clients hit no API rate limit and work offline.
