import type {
  LongDescriptionSections,
  LongDescriptionSectionKey,
} from "../types/longDescription";

export const LONG_DESCRIPTION_SECTION_META: Record<
  LongDescriptionSectionKey,
  { title: string; helperText: string }
> = {
  purpose: {
    title: "Purpose",
    helperText: "What is this diagram trying to explain?",
  },
  structure: {
    title: "Structure",
    helperText: "How is the information organized?",
  },
  keyComponents: {
    title: "Key components",
    helperText: "What are the main parts or categories?",
  },
  traversal: {
    title: "Traversal",
    helperText: "How do the parts connect or build on each other?",
  },
  mainTakeaway: {
    title: "Main takeaway",
    helperText: "What is the most important thing to understand?",
  },
};

const SECTION_ORDER: LongDescriptionSectionKey[] = [
  "purpose",
  "structure",
  "keyComponents",
  "traversal",
  "mainTakeaway",
];

export function createEmptyLongDescriptionSections(): LongDescriptionSections {
  return {
    purpose: { text: "", included: true },
    structure: { text: "", included: true },
    keyComponents: { text: "", included: true },
    traversal: { text: "", included: true },
    mainTakeaway: { text: "", included: true },
  };
}

export function buildLongDescriptionMarkdown(
  sections: LongDescriptionSections
): string {
  return SECTION_ORDER.filter((key) => sections[key].included)
    .map((key) => {
      const text = sections[key].text.trim();
      if (!text) return null;
      return `## ${LONG_DESCRIPTION_SECTION_META[key].title}\n${text}`;
    })
    .filter((value): value is string => Boolean(value))
    .join("\n\n");
}

const HEADING_TO_SECTION_KEY: Record<string, LongDescriptionSectionKey> = {
  purpose: "purpose",
  structure: "structure",
  "key components": "keyComponents",
  traversal: "traversal",
  "main takeaway": "mainTakeaway",

  // backward compatibility with older backend output
  overview: "purpose",
  "additional details": "traversal",
};

export function parseLongDescriptionMarkdown(
  markdown: string
): LongDescriptionSections {
  const sections = createEmptyLongDescriptionSections();

  const trimmed = markdown.trim();
  if (!trimmed) return sections;

  const headingRegex = /^##\s+(.+?)\s*$/gm;
  const matches = Array.from(trimmed.matchAll(headingRegex));

  if (matches.length === 0) {
    sections.purpose.text = trimmed;
    return sections;
  }

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const heading = match[1].trim().toLowerCase();
    const mappedKey = HEADING_TO_SECTION_KEY[heading];

    if (!mappedKey) continue;

    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : trimmed.length;
    const content = trimmed.slice(start, end).trim();

    if (!content) continue;

    if (sections[mappedKey].text) {
      sections[mappedKey].text = `${sections[mappedKey].text}\n\n${content}`;
    } else {
      sections[mappedKey].text = content;
    }
  }

  return sections;
}