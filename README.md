# bytesize-content

The cards behind the ByteSize app. Each card is one markdown file. On every push to `main`, GitHub
Actions validates the cards, compiles them to JSON, and publishes them to GitHub Pages, where the app
fetches them. New and edited cards reach the app without an app release.

The full design is in the app repo at `docs/backend-architecture.md`.

## Layout

```
content/
  cards/<topic>/<slug>.md   one card per file, in the folder matching its topic
  series/<id>.yml           a series: title and ordered card ids
schema/card.ts              the card schema, shared by both scripts
scripts/
  validate.ts               schema, ids, series checks
  build.ts                  compiles content/ to dist/
  migrate-from-app.ts       one-off export of the app's original seed cards
templates/card.md           copy this to start a card
.github/workflows/
  validate.yml              runs on every push and pull request
  publish.yml               main only: validate, build, deploy to Pages
```

Topics: `system-design`, `data-structures`, `backend`, `devops`, `security`, `cloud`,
`productivity`.

## Adding a card

1. Copy `templates/card.md` to `content/cards/<topic>/<slug>.md`.
2. Pick an `id` that is short and stable. It can never change or be deleted after it is published,
   because the app stores likes, bookmarks and read history by id. To retire a card, set
   `status: archived`.
3. Fill in the front matter, write the summary, and add the sections the card's `kind` needs.
4. Set `reviewed` to the date you checked the claim against the source.
5. Push. If validation fails, the error points at the file and line.

To add the card to a series, append its id to the right file in `content/series/`. Order in that
list is the order in the app.

## Card format

Front matter carries the metadata. The body is the summary, then optional sections:

| Section       | Used by        | Content                                               |
| ------------- | -------------- | ----------------------------------------------------- |
| (summary)     | every card     | prose before the first heading, one or two sentences  |
| `## Detail`   | every card     | one paragraph per detail entry                        |
| `## Code`     | `kind: code`   | one fenced block; the fence language is the language  |
| `## Diagram`  | `kind: diagram`| one fenced `yaml` block of `nodes` and `edges`        |

An `image` card puts `image: { url, caption }` in front matter.

## Difficulty

Three levels, chosen by what the reader must already know:

- **intro** — assumes no named prerequisite. "What a load balancer is for."
- **intermediate** — assumes exactly one concept the reader must already know. "The N+1 query"
  assumes an ORM.
- **advanced** — assumes two or more, or is about failure modes and trade-offs rather than mechanics.
  "PACELC", "quorum reads versus strongly consistent reads".

If you are torn between two levels, pick the higher one.

## Commands

```bash
npm install
npm run validate   # check every card
npm run build      # write dist/
```

## Publishing to GitHub Pages

1. Create a public GitHub repository named `bytesize-content` (under your user or org).
2. Push this repo to it:

   ```bash
   git remote add origin git@github.com:<you>/bytesize-content.git
   git add .
   git commit -m "Initial content corpus"
   git push -u origin main
   ```

3. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. After `publish.yml` succeeds, content is at:

   `https://<you>.github.io/bytesize-content/manifest.json`

Point the Expo app at that URL with `EXPO_PUBLIC_CONTENT_URL`.
