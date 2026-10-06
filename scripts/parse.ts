import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';

import {
  CardFrontMatterSchema,
  CompiledCardSchema,
  SeriesSchema,
  TOPICS,
  type CompiledCard,
  type SeriesDef,
  type Topic,
} from '../schema/card.ts';

export const ROOT = join(import.meta.dirname, '..');
export const CARDS_DIR = join(ROOT, 'content', 'cards');
export const SERIES_DIR = join(ROOT, 'content', 'series');
export const DIST_DIR = join(ROOT, 'dist');

export type ParsedCardFile = {
  path: string;
  relativePath: string;
  matterLine: number;
  card: CompiledCard;
};

export type Issue = {
  file: string;
  line?: number;
  message: string;
};

function githubAnnotate(issue: Issue, level: 'error' | 'warning' = 'error'): void {
  const file = issue.file.replace(/\\/g, '/');
  const loc = issue.line ? `file=${file},line=${issue.line}` : `file=${file}`;
  console.log(`::${level} ${loc}::${issue.message}`);
}

export function reportIssues(issues: Issue[]): never | void {
  for (const issue of issues) githubAnnotate(issue);
  if (issues.length > 0) {
    console.error(`\n${issues.length} validation error${issues.length === 1 ? '' : 's'}`);
    process.exit(1);
  }
}

function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== '.gitkeep') {
      out.push(full);
    }
  }
  return out.sort();
}

function listYamlFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => join(dir, name))
    .sort();
}

function sectionBody(markdown: string, heading: string): string | undefined {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return undefined;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n').trim();
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

function parseCodeFence(body: string): { language: string; content: string } | undefined {
  const match = body.match(/```([a-zA-Z0-9_+-]*)\s*\r?\n([\s\S]*?)```/);
  if (!match) return undefined;
  return {
    language: match[1] || 'text',
    content: match[2].replace(/\n$/, ''),
  };
}

function parseDiagramYaml(body: string): { nodes: unknown; edges: unknown } | undefined {
  const match = body.match(/```ya?ml\s*\r?\n([\s\S]*?)```/i);
  if (!match) return undefined;
  const parsed = parseYaml(match[1]) as { nodes?: unknown; edges?: unknown };
  return {
    nodes: parsed.nodes ?? [],
    edges: parsed.edges ?? [],
  };
}

function extractSummary(body: string): string {
  const lines = body.split(/\r?\n/);
  const end = lines.findIndex((line) => /^##\s/.test(line));
  const summaryLines = end < 0 ? lines : lines.slice(0, end);
  return summaryLines.join('\n').trim();
}

export function parseCardFile(filePath: string): { card?: CompiledCard; issues: Issue[] } {
  const relativePath = relative(ROOT, filePath);
  const raw = readFileSync(filePath, 'utf8');
  const issues: Issue[] = [];

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch (error) {
    issues.push({
      file: relativePath,
      message: `Could not parse front matter: ${(error as Error).message}`,
    });
    return { issues };
  }

  const fm = CardFrontMatterSchema.safeParse(parsed.data);
  if (!fm.success) {
    for (const issue of fm.error.issues) {
      issues.push({
        file: relativePath,
        line: 2,
        message: `${issue.path.join('.') || 'front matter'}: ${issue.message}`,
      });
    }
    return { issues };
  }

  const folderTopic = relative(CARDS_DIR, filePath).split(sep)[0];
  if (folderTopic !== fm.data.topic) {
    issues.push({
      file: relativePath,
      line: 2,
      message: `folder topic "${folderTopic}" does not match front matter topic "${fm.data.topic}"`,
    });
  }

  const body = parsed.content.replace(/^\uFEFF/, '').trim();
  const summary = extractSummary(body);
  if (!summary) {
    issues.push({
      file: relativePath,
      message: 'missing summary (prose before the first ## heading)',
    });
  }

  const detailBody = sectionBody(body, 'Detail');
  const detail = detailBody ? splitParagraphs(detailBody) : [];
  if (detail.length === 0) {
    issues.push({
      file: relativePath,
      message: 'missing ## Detail section with at least one paragraph',
    });
  }

  let code: CompiledCard['code'];
  let diagram: CompiledCard['diagram'];

  if (fm.data.kind === 'code') {
    const codeBody = sectionBody(body, 'Code');
    const fence = codeBody ? parseCodeFence(codeBody) : undefined;
    if (!fence) {
      issues.push({
        file: relativePath,
        message: 'kind: code requires a ## Code section with one fenced block',
      });
    } else {
      code = fence;
    }
  }

  if (fm.data.kind === 'diagram') {
    const diagramBody = sectionBody(body, 'Diagram');
    const yaml = diagramBody ? parseDiagramYaml(diagramBody) : undefined;
    if (!yaml) {
      issues.push({
        file: relativePath,
        message: 'kind: diagram requires a ## Diagram section with a fenced yaml block',
      });
    } else {
      diagram = yaml as CompiledCard['diagram'];
    }
  }

  if (fm.data.kind === 'image' && !fm.data.image) {
    issues.push({
      file: relativePath,
      line: 2,
      message: 'kind: image requires image: { url, caption } in front matter',
    });
  }

  if (fm.data.kind !== 'image' && fm.data.image) {
    issues.push({
      file: relativePath,
      line: 2,
      message: 'image front matter is only valid when kind: image',
    });
  }

  if (issues.length > 0) return { issues };

  const candidate = {
    ...fm.data,
    summary,
    detail,
    ...(code ? { code } : {}),
    ...(diagram ? { diagram } : {}),
  };

  const compiled = CompiledCardSchema.safeParse(candidate);
  if (!compiled.success) {
    for (const issue of compiled.error.issues) {
      issues.push({
        file: relativePath,
        message: `${issue.path.join('.') || 'card'}: ${issue.message}`,
      });
    }
    return { issues };
  }

  return { card: compiled.data, issues: [] };
}

export function loadAllCards(): { cards: ParsedCardFile[]; issues: Issue[] } {
  const files = listMarkdownFiles(CARDS_DIR);
  const cards: ParsedCardFile[] = [];
  const issues: Issue[] = [];

  for (const file of files) {
    const { card, issues: fileIssues } = parseCardFile(file);
    issues.push(...fileIssues);
    if (card) {
      cards.push({
        path: file,
        relativePath: relative(ROOT, file),
        matterLine: 2,
        card,
      });
    }
  }

  return { cards, issues };
}

export function loadAllSeries(): { series: SeriesDef[]; issues: Issue[] } {
  const files = listYamlFiles(SERIES_DIR);
  const series: SeriesDef[] = [];
  const issues: Issue[] = [];

  for (const file of files) {
    const relativePath = relative(ROOT, file);
    try {
      const raw = parseYaml(readFileSync(file, 'utf8'));
      const parsed = SeriesSchema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          issues.push({
            file: relativePath,
            message: `${issue.path.join('.') || 'series'}: ${issue.message}`,
          });
        }
        continue;
      }
      const fileId = relativePath.split(sep).pop()!.replace(/\.ya?ml$/, '');
      if (fileId !== parsed.data.id) {
        issues.push({
          file: relativePath,
          message: `filename id "${fileId}" does not match series id "${parsed.data.id}"`,
        });
      }
      series.push(parsed.data);
    } catch (error) {
      issues.push({
        file: relativePath,
        message: `Could not parse series: ${(error as Error).message}`,
      });
    }
  }

  return { series, issues };
}

export function topicFoldersPresent(): Topic[] {
  if (!existsSync(CARDS_DIR)) return [];
  return readdirSync(CARDS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name): name is Topic => (TOPICS as readonly string[]).includes(name));
}
