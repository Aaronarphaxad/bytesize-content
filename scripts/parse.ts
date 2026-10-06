import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';

import {
  CardFrontMatterSchema,
  CompiledCardSchema,
  SeriesSchema,
  TopicDefSchema,
  YamlCardSchema,
  type CompiledCard,
  type SeriesDef,
  type TopicDef,
} from '../schema/card.ts';

export const ROOT = join(import.meta.dirname, '..');
export const CARDS_DIR = join(ROOT, 'content', 'cards');
export const SERIES_DIR = join(ROOT, 'content', 'series');
export const TOPICS_DIR = join(ROOT, 'content', 'topics');
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

function listFiles(dir: string, extensions: string[], recursive = true): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) out.push(...listFiles(full, extensions, true));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out.sort();
}

function listCardFiles(): string[] {
  // Flat layout preferred; still accept nested leftovers during migration.
  return listFiles(CARDS_DIR, ['.yaml', '.yml', '.md'], true);
}

function listSeriesFiles(): string[] {
  return listFiles(SERIES_DIR, ['.yaml', '.yml'], false);
}

function listTopicFiles(): string[] {
  return listFiles(TOPICS_DIR, ['.yaml', '.yml'], false);
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

function fileSlug(filePath: string): string {
  return basename(filePath).replace(/\.(ya?ml|md)$/, '');
}

/** Keystatic conditional fields serialize as { discriminant, value }. */
function unwrapConditional<T>(value: unknown): T | undefined {
  if (value == null) return undefined;
  if (typeof value === 'object' && value !== null && 'discriminant' in value) {
    const conditional = value as { discriminant: boolean; value?: T };
    return conditional.discriminant ? conditional.value : undefined;
  }
  return value as T;
}

function unwrapSlug(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const slug = value as { slug?: string; name?: string };
    return slug.slug || slug.name;
  }
  return undefined;
}

function normalizeYamlCard(raw: Record<string, unknown>, fileId: string): Record<string, unknown> {
  const next = { ...raw };

  if (next.schemaVersion == null) next.schemaVersion = 1;

  // Filename is the source of truth for id (Keystatic slug).
  const declared = unwrapSlug(next.id);
  next.id = fileId;
  if (declared && declared !== fileId) {
    next.__idMismatch = declared;
  }

  const title = unwrapSlug(next.title);
  if (title) next.title = title;

  if (next.baseLikes === null) delete next.baseLikes;
  if (next.color === '' || next.color == null) delete next.color;

  const code = unwrapConditional<{ language?: string; content?: string }>(next.code);
  if (code?.content) next.code = { language: code.language || 'text', content: code.content };
  else delete next.code;

  const diagramField = unwrapConditional<{ yaml?: string; nodes?: unknown; edges?: unknown }>(
    next.diagram,
  );
  if (diagramField?.yaml) {
    const parsed = parseYaml(diagramField.yaml) as { nodes?: unknown; edges?: unknown };
    next.diagram = { nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] };
  } else if (diagramField?.nodes) {
    next.diagram = { nodes: diagramField.nodes, edges: diagramField.edges ?? [] };
  } else {
    delete next.diagram;
  }

  const image = unwrapConditional<{ url?: string; caption?: string }>(next.image);
  if (image?.url && image.caption) next.image = image;
  else delete next.image;

  if (typeof next.detail === 'string') {
    next.detail = splitParagraphs(next.detail);
  }

  if (next.reviewed instanceof Date) {
    next.reviewed = next.reviewed.toISOString().slice(0, 10);
  }

  return next;
}

function parseMarkdownCard(filePath: string): { card?: CompiledCard; issues: Issue[] } {
  const relativePath = relative(ROOT, filePath);
  const raw = readFileSync(filePath, 'utf8');
  const issues: Issue[] = [];
  const fileId = fileSlug(filePath);

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

  const data = { ...parsed.data, id: fileId, schemaVersion: 1 };
  const fm = CardFrontMatterSchema.safeParse(data);
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

function parseYamlCard(filePath: string): { card?: CompiledCard; issues: Issue[] } {
  const relativePath = relative(ROOT, filePath);
  const issues: Issue[] = [];
  const fileId = fileSlug(filePath);

  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(filePath, 'utf8'));
  } catch (error) {
    issues.push({
      file: relativePath,
      message: `Could not parse YAML: ${(error as Error).message}`,
    });
    return { issues };
  }

  if (!raw || typeof raw !== 'object') {
    issues.push({ file: relativePath, message: 'YAML card must be an object' });
    return { issues };
  }

  const normalized = normalizeYamlCard(raw as Record<string, unknown>, fileId);
  if (normalized.__idMismatch) {
    issues.push({
      file: relativePath,
      message: `yaml id "${normalized.__idMismatch}" does not match filename "${fileId}"`,
    });
    delete normalized.__idMismatch;
  }

  const parsed = YamlCardSchema.safeParse(normalized);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        file: relativePath,
        message: `${issue.path.join('.') || 'card'}: ${issue.message}`,
      });
    }
    return { issues };
  }

  if (parsed.data.kind === 'code' && !parsed.data.code) {
    issues.push({ file: relativePath, message: 'kind: code requires a code block' });
  }
  if (parsed.data.kind === 'diagram' && !parsed.data.diagram) {
    issues.push({ file: relativePath, message: 'kind: diagram requires diagram nodes/edges' });
  }
  if (parsed.data.kind === 'image' && !parsed.data.image) {
    issues.push({ file: relativePath, message: 'kind: image requires image url and caption' });
  }

  if (issues.length > 0) return { issues };
  return { card: parsed.data, issues: [] };
}

export function parseCardFile(filePath: string): { card?: CompiledCard; issues: Issue[] } {
  if (filePath.endsWith('.md')) return parseMarkdownCard(filePath);
  return parseYamlCard(filePath);
}

export function loadAllCards(): { cards: ParsedCardFile[]; issues: Issue[] } {
  const files = listCardFiles();
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
  const files = listSeriesFiles();
  const series: SeriesDef[] = [];
  const issues: Issue[] = [];

  for (const file of files) {
    const relativePath = relative(ROOT, file);
    const fileId = fileSlug(file);
    try {
      const raw = parseYaml(readFileSync(file, 'utf8'));
      if (!raw || typeof raw !== 'object') {
        issues.push({ file: relativePath, message: 'series YAML must be an object' });
        continue;
      }
      const data = { ...(raw as Record<string, unknown>) };
      const title = unwrapSlug(data.title);
      if (title) data.title = title;
      data.id = fileId;

      const parsed = SeriesSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          issues.push({
            file: relativePath,
            message: `${issue.path.join('.') || 'series'}: ${issue.message}`,
          });
        }
        continue;
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

export function loadAllTopics(): { topics: TopicDef[]; issues: Issue[] } {
  const files = listTopicFiles();
  const topics: TopicDef[] = [];
  const issues: Issue[] = [];

  for (const file of files) {
    const relativePath = relative(ROOT, file);
    const fileId = fileSlug(file);
    try {
      const raw = parseYaml(readFileSync(file, 'utf8'));
      if (!raw || typeof raw !== 'object') {
        issues.push({ file: relativePath, message: 'topic YAML must be an object' });
        continue;
      }
      const data = { ...(raw as Record<string, unknown>) };
      const label = unwrapSlug(data.label) ?? unwrapSlug(data.title);
      if (label) data.label = label;
      data.id = fileId;
      if (data.color === '' || data.color == null) delete data.color;

      const parsed = TopicDefSchema.safeParse(data);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          issues.push({
            file: relativePath,
            message: `${issue.path.join('.') || 'topic'}: ${issue.message}`,
          });
        }
        continue;
      }
      topics.push(parsed.data);
    } catch (error) {
      issues.push({
        file: relativePath,
        message: `Could not parse topic: ${(error as Error).message}`,
      });
    }
  }

  return { topics, issues };
}
