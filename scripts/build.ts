import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

import type { CompiledCard, Difficulty, MediaKind } from '../schema/card.ts';
import { DIFFICULTIES, KINDS } from '../schema/card.ts';
import {
  DIST_DIR,
  loadAllCards,
  loadAllSeries,
  loadAllTopics,
  reportIssues,
} from './parse.ts';

function shortSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'local';
  }
}

function attachSeries(
  cards: CompiledCard[],
  seriesDefs: { id: string; title: string; cards: string[] }[],
): CompiledCard[] {
  const membership = new Map<string, { id: string; part: number; total: number }>();
  for (const def of seriesDefs) {
    def.cards.forEach((cardId, index) => {
      membership.set(cardId, {
        id: def.id,
        part: index + 1,
        total: def.cards.length,
      });
    });
  }

  return cards.map((card) => {
    const series = membership.get(card.id);
    if (!series) {
      const { series: _drop, ...rest } = card as CompiledCard & { series?: unknown };
      return rest as CompiledCard;
    }
    return { ...card, series };
  });
}

function emptyCounts<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
}

function build(): void {
  const { cards: parsed, issues: cardIssues } = loadAllCards();
  const { series, issues: seriesIssues } = loadAllSeries();
  const { topics, issues: topicIssues } = loadAllTopics();
  reportIssues([...cardIssues, ...seriesIssues, ...topicIssues]);

  const withSeries = attachSeries(
    parsed.map((p) => p.card),
    series,
  );

  const published = withSeries.filter((c) => c.status === 'published');

  const byTopic: Record<string, number> = Object.fromEntries(topics.map((t) => [t.id, 0]));
  const byKind = emptyCounts(KINDS);
  const byDifficulty = emptyCounts(DIFFICULTIES);
  for (const card of published) {
    byTopic[card.topic] = (byTopic[card.topic] ?? 0) + 1;
    byKind[card.kind as MediaKind] += 1;
    byDifficulty[card.difficulty as Difficulty] += 1;
  }

  const now = new Date().toISOString();
  const version = `${now.replace(/\.\d{3}Z$/, 'Z')}-${shortSha()}`;

  const manifest = {
    schemaVersion: 1 as const,
    version,
    generatedAt: now,
    counts: {
      total: published.length,
      byTopic,
      byKind,
      byDifficulty,
    },
  };

  mkdirSync(DIST_DIR, { recursive: true });
  writeFileSync(join(DIST_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(DIST_DIR, 'cards.json'), `${JSON.stringify(published, null, 2)}\n`);
  writeFileSync(join(DIST_DIR, 'series.json'), `${JSON.stringify(series, null, 2)}\n`);
  writeFileSync(join(DIST_DIR, 'topics.json'), `${JSON.stringify(topics, null, 2)}\n`);

  console.log(
    `Built dist/ · ${published.length} published cards · ${topics.length} topics · version ${version}`,
  );
}

build();
