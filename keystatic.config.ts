import { collection, config, fields } from '@keystatic/core';

import { DIFFICULTIES, KINDS, STATUSES, TOPIC_ICONS } from './schema/card';

function selectOptions<T extends string>(
  values: readonly T[],
  labels?: Partial<Record<T, string>>,
) {
  return values.map((value) => ({
    label: labels?.[value] ?? value,
    value,
  }));
}

const ICON_LABELS: Partial<Record<(typeof TOPIC_ICONS)[number], string>> = {
  network: 'Network',
  binary: 'Binary / DS',
  server: 'Server',
  'git-branch': 'Git branch',
  'shield-check': 'Shield',
  cloud: 'Cloud',
  zap: 'Zap',
  code: 'Code',
  layers: 'Layers',
  lightbulb: 'Lightbulb',
  compass: 'Compass',
  brain: 'Brain',
  target: 'Target',
  'book-open': 'Book',
};

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: { name: 'ByteSize Content' },
  },
  collections: {
    topics: collection({
      label: 'Topics',
      slugField: 'label',
      path: 'content/topics/*',
      format: { data: 'yaml' },
      columns: ['label', 'blurb'],
      schema: {
        label: fields.slug({
          name: {
            label: 'Name',
            description: 'Shown in the app. Slug becomes the topic id (e.g. Front End → front-end).',
            validation: { isRequired: true },
          },
          slug: {
            label: 'Topic id',
            description: 'Auto-generated. Keep stable once cards use it.',
          },
        }),
        blurb: fields.text({
          label: 'Blurb',
          description: 'One short line for onboarding and explore',
          validation: { isRequired: true },
        }),
        icon: fields.select({
          label: 'Icon',
          options: selectOptions(TOPIC_ICONS, ICON_LABELS),
          defaultValue: 'layers',
        }),
        color: fields.text({
          label: 'Accent color',
          description: 'Optional #RRGGBB. Leave blank for an automatic color.',
        }),
      },
    }),

    cards: collection({
      label: 'Cards',
      slugField: 'title',
      path: 'content/cards/*',
      format: { data: 'yaml' },
      columns: ['title', 'topic', 'kind', 'difficulty', 'status'],
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            description: 'The claim, under ~10 words. Slug is the card id — auto-filled, tweak once.',
            validation: { isRequired: true },
          },
          slug: {
            label: 'Card id',
            description:
              'Auto-generated from the title. Immutable after publish (likes/bookmarks key off it).',
          },
        }),
        topic: fields.relationship({
          label: 'Topic',
          description: 'Pick a topic, or create one under Topics first',
          collection: 'topics',
          validation: { isRequired: true },
        }),
        kind: fields.select({
          label: 'Format',
          options: selectOptions(KINDS, {
            text: 'Explainer',
            code: 'Code',
            diagram: 'Diagram',
            image: 'Visual',
          }),
          defaultValue: 'text',
        }),
        difficulty: fields.select({
          label: 'Level',
          options: selectOptions(DIFFICULTIES, {
            intro: 'Intro',
            intermediate: 'Intermediate',
            advanced: 'Advanced',
          }),
          defaultValue: 'intro',
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        readMinutes: fields.integer({
          label: 'Read minutes',
          defaultValue: 1,
          validation: { isRequired: true, min: 1 },
        }),
        status: fields.select({
          label: 'Status',
          options: selectOptions(STATUSES, {
            published: 'Published',
            archived: 'Archived',
          }),
          defaultValue: 'published',
        }),
        source: fields.object({
          label: fields.text({
            label: 'Source label',
            validation: { isRequired: true },
          }),
          url: fields.url({
            label: 'Source URL',
            validation: { isRequired: true },
          }),
        }),
        reviewed: fields.date({
          label: 'Reviewed',
          description: 'Date you last checked the claim against the source',
          validation: { isRequired: true },
        }),
        baseLikes: fields.integer({
          label: 'Base likes (demo seed)',
          description: 'Optional. Remove when real counts exist.',
          validation: { min: 0 },
        }),
        summary: fields.text({
          label: 'Summary',
          description: 'One or two sentences shown in the feed',
          multiline: true,
          validation: { isRequired: true, length: { min: 1 } },
        }),
        detail: fields.array(
          fields.text({
            label: 'Paragraph',
            multiline: true,
            validation: { isRequired: true },
          }),
          {
            label: 'Detail',
            description: 'Longer explanation — one item per paragraph',
            itemLabel: (props) => props.value?.slice(0, 48) || 'Paragraph',
            validation: { length: { min: 1 } },
          },
        ),
        code: fields.conditional(
          fields.checkbox({ label: 'Include code block', defaultValue: false }),
          {
            true: fields.object({
              language: fields.text({ label: 'Language', defaultValue: 'ts' }),
              content: fields.text({
                label: 'Code',
                multiline: true,
                validation: { isRequired: true },
              }),
            }),
            false: fields.empty(),
          },
        ),
        diagram: fields.conditional(
          fields.checkbox({ label: 'Include diagram', defaultValue: false }),
          {
            true: fields.object({
              yaml: fields.text({
                label: 'Diagram YAML',
                description: 'nodes: and edges: in the existing diagram format',
                multiline: true,
                validation: { isRequired: true },
              }),
            }),
            false: fields.empty(),
          },
        ),
        image: fields.conditional(
          fields.checkbox({ label: 'Include image', defaultValue: false }),
          {
            true: fields.object({
              url: fields.url({ label: 'Image URL', validation: { isRequired: true } }),
              caption: fields.text({
                label: 'Caption',
                validation: { isRequired: true },
              }),
            }),
            false: fields.empty(),
          },
        ),
      },
    }),

    series: collection({
      label: 'Series',
      slugField: 'title',
      path: 'content/series/*',
      format: { data: 'yaml' },
      columns: ['title'],
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            description: 'Series name. Slug is the series id — auto-filled.',
            validation: { isRequired: true },
          },
          slug: {
            label: 'Series id',
            description: 'Auto-generated. Keep stable once published.',
          },
        }),
        cards: fields.array(
          fields.relationship({
            label: 'Card',
            collection: 'cards',
            validation: { isRequired: true },
          }),
          {
            label: 'Cards (in order)',
            description: 'Pick cards in reading order. Part numbers are derived from this list.',
            itemLabel: (props) => props.value || 'Card',
            validation: { length: { min: 2 } },
          },
        ),
      },
    }),
  },
});
