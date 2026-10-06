/**
 * One-off: export the Expo app's seed cards into markdown + series YAML.
 *
 * Usage (from this repo):
 *   npm run migrate
 */
import { mkdirSync, writeFileSync, unlinkSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { stringify as stringifyYaml } from 'yaml';

import type { Difficulty, Topic } from '../schema/card.ts';
import { ROOT, CARDS_DIR, SERIES_DIR } from './parse.ts';

type SeedCard = {
  id: string;
  kind: 'text' | 'code' | 'diagram' | 'image';
  topic: Topic;
  title: string;
  summary: string;
  detail: string[];
  code?: { language: string; content: string };
  diagram?: {
    nodes: { id: string; label: string; x: number; y: number; width?: number; height?: number }[];
    edges: { from: string; to: string; label?: string }[];
  };
  image?: { url: string; caption: string };
  source: { label: string; url: string; verified: true };
  series?: { id: string; part: number; total: number };
  baseLikes: number;
  readMinutes: number;
};

const APP_ROOT = join(ROOT, '..', 'bytesize');
const DUMP_PATH = join(ROOT, '.cards-dump.json');

const SERIES_TITLES: Record<string, string> = {
  cap: 'CAP theorem',
  'http-cache': 'HTTP caching',
  lb: 'Load balancing',
};

/** First-pass difficulty; correct by hand after migration. */
function guessDifficulty(card: SeedCard): Difficulty {
  const hay = `${card.title} ${card.summary} ${card.detail.join(' ')}`.toLowerCase();
  if (
    /pacelc|quorum|vector clock|crdt|consistent hash|bloom filter|n\+1|etag|cap:|partition/.test(
      hay,
    )
  ) {
    return 'advanced';
  }
  if (
    /orm|jwt|csrf|xss|dockerfile|offset|idempotenc|load balancer|sharding|cdn|trie|bfs|heap|acid|oauth|privilege/.test(
      hay,
    )
  ) {
    return 'intermediate';
  }
  return 'intro';
}

function dumpSeedCards(): SeedCard[] {
  if (!existsSync(join(APP_ROOT, 'src', 'data', 'cards.ts'))) {
    throw new Error(`App seed not found at ${APP_ROOT}/src/data/cards.ts`);
  }

  const dumpScript = join(APP_ROOT, 'scripts', '_dump-cards-tmp.mts');
  mkdirSync(dirname(dumpScript), { recursive: true });
  writeFileSync(
    dumpScript,
    `
import { writeFileSync } from 'node:fs';
import { CARDS } from '../src/data/cards.ts';
writeFileSync(${JSON.stringify(DUMP_PATH)}, JSON.stringify(CARDS, null, 2));
console.log('dumped', CARDS.length, 'cards');
`,
  );

  try {
    execSync(`npx tsx "${dumpScript}"`, {
      cwd: APP_ROOT,
      stdio: 'inherit',
    });
  } finally {
    if (existsSync(dumpScript)) unlinkSync(dumpScript);
  }

  return JSON.parse(readFileSync(DUMP_PATH, 'utf8')) as SeedCard[];
}

function yamlEscapeScalar(value: string): string {
  if (/[:#{}[\],&*?|>!%@`]/.test(value) || value.includes("'") || value.includes('"')) {
    return JSON.stringify(value);
  }
  return value;
}

function frontMatter(card: SeedCard, difficulty: Difficulty): string {
  const lines = [
    '---',
    'schemaVersion: 1',
    `id: ${card.id}`,
    `title: ${yamlEscapeScalar(card.title)}`,
    `topic: ${card.topic}`,
    `kind: ${card.kind}`,
    `difficulty: ${difficulty}`,
    'tags: []',
    `readMinutes: ${card.readMinutes}`,
    'status: published',
    'source:',
    `  label: ${yamlEscapeScalar(card.source.label)}`,
    `  url: ${card.source.url}`,
    `reviewed: "${new Date().toISOString().slice(0, 10)}"`,
    `baseLikes: ${card.baseLikes}`,
  ];

  if (card.image) {
    lines.push('image:');
    lines.push(`  url: ${card.image.url}`);
    lines.push(`  caption: ${yamlEscapeScalar(card.image.caption)}`);
  }

  lines.push('---', '');
  return lines.join('\n');
}

function bodyMarkdown(card: SeedCard): string {
  const parts: string[] = [card.summary, '', '## Detail', ''];
  for (const paragraph of card.detail) {
    parts.push(paragraph, '');
  }

  if (card.kind === 'code' && card.code) {
    parts.push('## Code', '', `\`\`\`${card.code.language}`, card.code.content, '```', '');
  }

  if (card.kind === 'diagram' && card.diagram) {
    parts.push('## Diagram', '', '```yaml');
    parts.push(stringifyYaml(card.diagram).trimEnd());
    parts.push('```', '');
  }

  return `${parts.join('\n').trimEnd()}\n`;
}

function migrate(): void {
  const cards = dumpSeedCards();
  console.log(`Migrating ${cards.length} cards…`);

  for (const topic of new Set(cards.map((c) => c.topic))) {
    mkdirSync(join(CARDS_DIR, topic), { recursive: true });
  }
  mkdirSync(SERIES_DIR, { recursive: true });

  for (const card of cards) {
    const difficulty = guessDifficulty(card);
    const file = join(CARDS_DIR, card.topic, `${card.id}.md`);
    writeFileSync(file, frontMatter(card, difficulty) + bodyMarkdown(card));
  }

  const seriesMap = new Map<string, { part: number; id: string }[]>();
  for (const card of cards) {
    if (!card.series) continue;
    const list = seriesMap.get(card.series.id) ?? [];
    list.push({ part: card.series.part, id: card.id });
    seriesMap.set(card.series.id, list);
  }

  for (const [seriesId, members] of seriesMap) {
    members.sort((a, b) => a.part - b.part);
    const doc = {
      id: seriesId,
      title: SERIES_TITLES[seriesId] ?? seriesId,
      cards: members.map((m) => m.id),
    };
    writeFileSync(join(SERIES_DIR, `${seriesId}.yml`), stringifyYaml(doc));
  }

  if (existsSync(DUMP_PATH)) unlinkSync(DUMP_PATH);
  console.log(
    `Wrote ${cards.length} markdown files and ${seriesMap.size} series under content/`,
  );
  console.log('Review difficulty values — they are a first pass only.');
}

migrate();
