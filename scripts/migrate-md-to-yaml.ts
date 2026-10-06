/**
 * Convert legacy markdown cards to YAML for Keystatic.
 * Leaves .md files in place until validate/build succeed on .yaml — then deletes .md.
 */
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';

import type { CompiledCard } from '../schema/card.ts';
import { CARDS_DIR, ROOT, SERIES_DIR, parseCardFile } from './parse.ts';

function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out.sort();
}

function toYamlDoc(card: CompiledCard): Record<string, unknown> {
  // Shape matches Keystatic conditional fields so the admin can open existing cards.
  const doc: Record<string, unknown> = {
    schemaVersion: 1,
    id: card.id,
    title: card.title,
    topic: card.topic,
    kind: card.kind,
    difficulty: card.difficulty,
    tags: card.tags ?? [],
    readMinutes: card.readMinutes,
    status: card.status,
    source: card.source,
    reviewed: card.reviewed,
    summary: card.summary,
    detail: card.detail,
    code: card.code
      ? { discriminant: true, value: card.code }
      : { discriminant: false, value: null },
    diagram: card.diagram
      ? {
          discriminant: true,
          value: {
            yaml: stringifyYaml({
              nodes: card.diagram.nodes,
              edges: card.diagram.edges,
            }).trim(),
          },
        }
      : { discriminant: false, value: null },
    image: card.image
      ? { discriminant: true, value: card.image }
      : { discriminant: false, value: null },
  };
  if (card.baseLikes != null) doc.baseLikes = card.baseLikes;
  return doc;
}

function migrateCards(): void {
  const files = listMarkdown(CARDS_DIR);
  let wrote = 0;
  for (const file of files) {
    const { card, issues } = parseCardFile(file);
    if (!card) {
      console.error(`Skip ${relative(ROOT, file)}:`);
      for (const issue of issues) console.error(`  - ${issue.message}`);
      continue;
    }
    const out = join(CARDS_DIR, card.topic, `${card.id}.yaml`);
    writeFileSync(out, stringifyYaml(toYamlDoc(card)));
    unlinkSync(file);
    wrote += 1;
  }
  console.log(`Migrated ${wrote} cards to .yaml`);
}

function migrateSeries(): void {
  if (!existsSync(SERIES_DIR)) return;
  let renamed = 0;
  for (const name of readdirSync(SERIES_DIR)) {
    if (!name.endsWith('.yml')) continue;
    const from = join(SERIES_DIR, name);
    const to = join(SERIES_DIR, name.replace(/\.yml$/, '.yaml'));
    const raw = readFileSync(from, 'utf8');
    writeFileSync(to, raw);
    unlinkSync(from);
    renamed += 1;
  }
  console.log(`Renamed ${renamed} series files to .yaml`);
}

migrateCards();
migrateSeries();
