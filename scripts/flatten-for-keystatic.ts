/**
 * Flatten topic-folder cards into content/cards/<id>.yaml,
 * seed content/topics/, and strip redundant id fields for Keystatic slugs.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { DEFAULT_TOPICS } from '../schema/card.ts';
import { CARDS_DIR, ROOT, SERIES_DIR, TOPICS_DIR } from './parse.ts';

const TOPIC_META: Record<
  (typeof DEFAULT_TOPICS)[number],
  { label: string; blurb: string; icon: string; color: string }
> = {
  'system-design': {
    label: 'System Design',
    blurb: 'Scale, trade-offs and architecture',
    icon: 'network',
    color: '#9B8CFF',
  },
  'data-structures': {
    label: 'Data Structures',
    blurb: 'Trees, hashes, graphs, complexity',
    icon: 'binary',
    color: '#5FD6AE',
  },
  backend: {
    label: 'Backend',
    blurb: 'APIs, databases, caching, reliability',
    icon: 'server',
    color: '#FFA86B',
  },
  devops: {
    label: 'DevOps',
    blurb: 'CI/CD, containers, operations',
    icon: 'git-branch',
    color: '#7FB8F5',
  },
  security: {
    label: 'Security',
    blurb: 'Auth, threats, safe defaults',
    icon: 'shield-check',
    color: '#FF8FA6',
  },
  cloud: {
    label: 'Cloud',
    blurb: 'AWS, GCP and Azure primitives',
    icon: 'cloud',
    color: '#6FD4E8',
  },
  productivity: {
    label: 'Productivity',
    blurb: 'Focus, habits, engineering craft',
    icon: 'zap',
    color: '#F5D06B',
  },
};

function stripId(doc: Record<string, unknown>): Record<string, unknown> {
  const next = { ...doc };
  delete next.id;
  // Keystatic rejects keys that are not in the collection schema.
  delete next.schemaVersion;
  return next;
}

function flattenCards(): number {
  if (!existsSync(CARDS_DIR)) return 0;
  let moved = 0;

  for (const entry of readdirSync(CARDS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      // Already flat — just strip id if present.
      if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        const full = join(CARDS_DIR, entry.name);
        const raw = parseYaml(readFileSync(full, 'utf8')) as Record<string, unknown>;
        writeFileSync(full, stringifyYaml(stripId(raw)));
      }
      continue;
    }

    const topicDir = join(CARDS_DIR, entry.name);
    for (const name of readdirSync(topicDir)) {
      if (!name.endsWith('.yaml') && !name.endsWith('.yml')) continue;
      const from = join(topicDir, name);
      const to = join(CARDS_DIR, name);
      if (existsSync(to)) {
        throw new Error(`Collision flattening ${from} → ${to}`);
      }
      const raw = parseYaml(readFileSync(from, 'utf8')) as Record<string, unknown>;
      writeFileSync(to, stringifyYaml(stripId(raw)));
      rmSync(from);
      moved += 1;
    }
    rmSync(topicDir, { recursive: true, force: true });
  }

  return moved;
}

function seedTopics(): number {
  mkdirSync(TOPICS_DIR, { recursive: true });
  let wrote = 0;
  for (const id of DEFAULT_TOPICS) {
    const out = join(TOPICS_DIR, `${id}.yaml`);
    if (existsSync(out)) continue;
    const meta = TOPIC_META[id];
    writeFileSync(
      out,
      stringifyYaml({
        label: meta.label,
        blurb: meta.blurb,
        icon: meta.icon,
        color: meta.color,
      }),
    );
    wrote += 1;
  }
  return wrote;
}

function rewriteSeries(): number {
  if (!existsSync(SERIES_DIR)) return 0;
  let n = 0;
  for (const name of readdirSync(SERIES_DIR)) {
    if (!name.endsWith('.yaml') && !name.endsWith('.yml')) continue;
    const full = join(SERIES_DIR, name);
    const raw = parseYaml(readFileSync(full, 'utf8')) as Record<string, unknown>;
    const next = stripId(raw);
    const dest = name.endsWith('.yml') ? join(SERIES_DIR, name.replace(/\.yml$/, '.yaml')) : full;
    writeFileSync(dest, stringifyYaml(next));
    if (dest !== full) rmSync(full);
    n += 1;
  }
  return n;
}

const moved = flattenCards();
const topics = seedTopics();
const series = rewriteSeries();
console.log(`Flattened ${moved} cards · seeded ${topics} topics · rewrote ${series} series`);
console.log(`Root: ${ROOT}`);
