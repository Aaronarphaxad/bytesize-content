import { z } from 'zod';

export const TOPICS = [
  'system-design',
  'data-structures',
  'backend',
  'devops',
  'security',
  'cloud',
  'productivity',
] as const;

export const KINDS = ['text', 'code', 'diagram', 'image'] as const;
export const DIFFICULTIES = ['intro', 'intermediate', 'advanced'] as const;
export const STATUSES = ['published', 'archived'] as const;

export const DiagramNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

export const DiagramEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().min(1).optional(),
});

export const CardFrontMatterSchema = z.object({
  schemaVersion: z.literal(1),
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be lowercase kebab-case'),
  title: z.string().min(1),
  topic: z.enum(TOPICS),
  kind: z.enum(KINDS),
  difficulty: z.enum(DIFFICULTIES),
  tags: z.array(z.string().min(1)).default([]),
  readMinutes: z.number().int().positive(),
  status: z.enum(STATUSES).default('published'),
  source: z.object({
    label: z.string().min(1),
    url: z.string().url(),
  }),
  // gray-matter's YAML parser turns bare YYYY-MM-DD into a Date.
  reviewed: z.preprocess((value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    return value;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'reviewed must be YYYY-MM-DD')),
  baseLikes: z.number().int().nonnegative().optional(),
  image: z
    .object({
      url: z.string().url(),
      caption: z.string().min(1),
    })
    .optional(),
});

export const SeriesSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'series id must be lowercase kebab-case'),
  title: z.string().min(1),
  cards: z.array(z.string().min(1)).min(2),
});

export type CardFrontMatter = z.infer<typeof CardFrontMatterSchema>;
export type SeriesDef = z.infer<typeof SeriesSchema>;
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Topic = (typeof TOPICS)[number];
export type MediaKind = (typeof KINDS)[number];

/** Compiled card shape the app fetches from Pages. */
export const CompiledCardSchema = CardFrontMatterSchema.extend({
  summary: z.string().min(1),
  detail: z.array(z.string().min(1)).min(1),
  code: z
    .object({
      language: z.string().min(1),
      content: z.string().min(1),
    })
    .optional(),
  diagram: z
    .object({
      nodes: z.array(DiagramNodeSchema).min(1),
      edges: z.array(DiagramEdgeSchema),
    })
    .optional(),
  series: z
    .object({
      id: z.string().min(1),
      part: z.number().int().positive(),
      total: z.number().int().positive(),
    })
    .optional(),
});

export type CompiledCard = z.infer<typeof CompiledCardSchema>;
