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

> `verified` / `official` are editorial flags set during review. Usage stats (downloads, stars) are intentionally not stored until they can be measured for real.
