import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import type { CompiledCard } from '../schema/card.ts';
import { loadAllCards, loadAllSeries, reportIssues, type Issue } from './parse.ts';

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

  // Only enforce immutability once main already has published content.
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
  for (const path of listing.split('\n').filter((p) => p.endsWith('.md'))) {
    try {
      const blob = execSync(`git show ${ref}:${path}`, { encoding: 'utf8' });
      const match = blob.match(/^id:\s*([a-z0-9-]+)\s*$/m);
      if (match) ids.add(match[1]);
    } catch {
      // ignore missing blobs
    }
  }
  return ids;
}

function validateCorpus(): void {
  const { cards, issues: cardIssues } = loadAllCards();
  const { series, issues: seriesIssues } = loadAllSeries();
  const issues: Issue[] = [...cardIssues, ...seriesIssues];

  const byId = new Map<string, CompiledCard>();
  const titles = new Map<string, string>();

  for (const entry of cards) {
    const { card, relativePath } = entry;
    if (byId.has(card.id)) {
      issues.push({
        file: relativePath,
        line: 2,
        message: `duplicate id "${card.id}" (also used elsewhere)`,
      });
    } else {
      byId.set(card.id, card);
    }

    const titleKey = card.title.trim().toLowerCase();
    const prior = titles.get(titleKey);
    if (prior) {
      issues.push({
        file: relativePath,
        line: 2,
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
          file: `content/series/${def.id}.yml`,
          message: `card "${cardId}" appears twice in series "${def.id}"`,
        });
      }
      seenInSeries.add(cardId);

      if (!byId.has(cardId)) {
        issues.push({
          file: `content/series/${def.id}.yml`,
          message: `series "${def.id}" references unknown card id "${cardId}"`,
        });
        continue;
      }

      const prior = claimed.get(cardId);
      if (prior && prior !== def.id) {
        issues.push({
          file: `content/series/${def.id}.yml`,
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
    `OK · ${cards.length} cards (${published} published, ${archived} archived) · ${series.length} series`,
  );
}

validateCorpus();
