# bytesize-content

The cards behind the ByteSize app. Edit in [Keystatic](https://keystatic.com) locally, or edit
YAML by hand. Push to `main` → GitHub Actions validates, builds JSON, publishes to GitHub Pages.
The app fetches newer content without an app release.

Full design: app repo `docs/backend-architecture.md`.

## Edit in Keystatic

```bash
npm install
npm run dev
```

Open http://localhost:3000/keystatic.

| Collection | What it does |
| ---------- | ------------ |
| **Topics** | Add Front End, Linux, Networking, etc. Name → auto slug id. |
| **Cards**  | Title → auto card id. Pick a topic. Optional code/diagram/image. |
| **Series** | Title → auto series id. Pick cards from a dropdown (in order). |

Saving writes YAML under `content/`. Then `git push` to publish.

**Id tip:** the slug under the title is the permanent id (likes/bookmarks). Tweak it once on create; do not rename after publish — archive instead.

## Layout

```
content/
  topics/<id>.yaml          topic catalog (label, blurb, icon, color)
  cards/<id>.yaml           one card per file (flat)
  series/<id>.yaml          ordered card ids
keystatic.config.ts
schema/card.ts
scripts/validate.ts | build.ts
```

## Commands

```bash
npm run dev            # Keystatic
npm run validate       # schema, ids, topics, series
npm run build          # dist/ including topics.json
```

## Card shape (hand edit)

See `templates/card.yaml`. Filename is the id. `topic` must match a file in `content/topics/`.
