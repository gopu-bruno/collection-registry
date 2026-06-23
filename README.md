# collection-registry

A **git-native index** of [Bruno](https://usebruno.com) / OpenCollection API collections — the registry behind **opencollection.dev**.

There is **no server**. The registry *is* this repository:

- Each collection is one file: [`collections/<ns>/<name>.json`](collections/) — a pointer to a git-hosted collection plus display metadata.
- [`index.json`](index.json) is generated from those files by CI and is what the website and the Bruno app fetch. The build also **bakes in each collection's latest version + install counts**, read from the source repo's GitHub Releases.
- **Listing** a collection = a one-time **pull request** adding a file under `collections/`. **Versions** are git tags + releases on the *author's own* repo — publishing a new version needs no PR; the index re-bakes the new version and counts.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the model and [PUBLISHING.md](PUBLISHING.md) for the publish/version flow (app + CLI).

## Local development

```bash
npm run seed      # write the starter collections (one-off)
npm run build     # regenerate index.json from collections/
npm run validate  # validate entries without writing (what PR CI runs)
```

## Adding a collection

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: add `collections/<ns>/<name>.json` matching [the schema](schema/collection.schema.json) and open a PR.
