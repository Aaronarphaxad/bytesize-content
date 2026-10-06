import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import type { CompiledCard } from '../schema/card.ts';
import {
  loadAllCards,
  loadAllSeries,
  loadAllTopics,
  reportIssues,
  type Issue,
} from './parse.ts';

function idsOnMain(): Set<string> | null {
  try {
    execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
  } catch {
    try {
      execSync('git rev-parse --verify main', { stdio: 'ignore' });
    } catch {
      return null;
    }
  }

  const ref = (() => {
    try {
      execSync('git rev-parse --verify origin/main', { stdio: 'ignore' });
      return 'origin/main';
    } catch {
      return 'main';
    }
  })();

  let listing = '';
  try {
    listing = execSync(`git ls-tree -r --name-only ${ref} content/cards`, {
      encoding: 'utf8',
    });
  } catch {
    return null;
  }

  if (!listing.trim()) return null;

  const ids = new Set<string>();
  for (const path of listing.split('\n')) {
    if (!path.endsWith('.md') && !path.endsWith('.yaml') && !path.endsWith('.yml')) continue;
    const base = path.split('/').pop() ?? '';
    const id = base.replace(/\.(ya?ml|md)$/, '');
    if (id) ids.add(id);
  }
  return ids;
}

function validateCorpus(): void {
  const { cards, issues: cardIssues } = loadAllCards();
  const { series, issues: seriesIssues } = loadAllSeries();
  const { topics, issues: topicIssues } = loadAllTopics();
  const issues: Issue[] = [...cardIssues, ...seriesIssues, ...topicIssues];

  if (topics.length === 0) {
    issues.push({
      file: 'content/topics',
      message: 'no topics defined — add at least one under content/topics/',
    });
  }

  const topicIds = new Set(topics.map((t) => t.id));
  const byId = new Map<string, CompiledCard>();
  const titles = new Map<string, string>();

  for (const entry of cards) {
    const { card, relativePath } = entry;
    if (byId.has(card.id)) {
      issues.push({
        file: relativePath,
        message: `duplicate id "${card.id}" (also used elsewhere)`,
      });
    } else {
      byId.set(card.id, card);
    }

    if (!topicIds.has(card.topic)) {
      issues.push({
        file: relativePath,
        message: `unknown topic "${card.topic}" — create it under Topics in Keystatic first`,
      });
    }

    const titleKey = card.title.trim().toLowerCase();
    const prior = titles.get(titleKey);
    if (prior) {
      issues.push({
        file: relativePath,
        message: `duplicate title "${card.title}" (also in ${prior})`,
      });
    } else {
      titles.set(titleKey, relativePath);
    }
  }

  const claimed = new Map<string, string>();
  for (const def of series) {
    const seenInSeries = new Set<string>();
    for (const cardId of def.cards) {
      if (seenInSeries.has(cardId)) {
        issues.push({
          file: `content/series/${def.id}.yaml`,
          message: `card "${cardId}" appears twice in series "${def.id}"`,
        });
      }
      seenInSeries.add(cardId);

      if (!byId.has(cardId)) {
        issues.push({
          file: `content/series/${def.id}.yaml`,
          message: `series "${def.id}" references unknown card id "${cardId}"`,
        });
        continue;
      }

      const prior = claimed.get(cardId);
      if (prior && prior !== def.id) {
        issues.push({
          file: `content/series/${def.id}.yaml`,
          message: `card "${cardId}" is already in series "${prior}"`,
        });
      } else {
        claimed.set(cardId, def.id);
      }
    }
  }

  const mainIds = idsOnMain();
  if (mainIds) {
    for (const id of mainIds) {
      if (!byId.has(id)) {
        issues.push({
          file: 'content/cards',
          message: `id "${id}" existed on main and is missing now — archive with status: archived instead of deleting`,
        });
      }
    }
  }

  if (!existsSync(new URL('../content/cards', import.meta.url))) {
    issues.push({ file: 'content/cards', message: 'content/cards directory is missing' });
  }

  reportIssues(issues);

  const published = cards.filter((c) => c.card.status === 'published').length;
  const archived = cards.length - published;
  console.log(
    `OK · ${cards.length} cards (${published} published, ${archived} archived) · ${series.length} series · ${topics.length} topics`,
  );
}

validateCorpus();
