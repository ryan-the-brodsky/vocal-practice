// Pulls the "## FAQ" block out of a Learn article body so [slug].tsx can emit
// FAQPage JSON-LD. Google deprecated FAQ *rich results* in May 2026, so this
// buys nothing in the SERP — it stays because FAQPage is still valid schema.org
// and non-Google retrieval (AI answer engines) parses it for clean Q&A pairs.

export interface FaqItem {
  question: string;
  answer: string;
}

// JSON-LD answers must be plain text; strip the Markdown the body carries.
function toPlainText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractFaq(body: string): FaqItem[] {
  // "## FAQ" through to the next H2 (usually "## Sources") or end of file.
  // End-of-input is `(?![\s\S])`, not `$` — with the `m` flag `$` means end of
  // LINE, which would terminate the lazy group on the first blank line.
  const section = body.match(/^## FAQ[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (!section) return [];

  const items: FaqItem[] = [];
  // Each "### Question" owns everything up to the next ### or the block's end.
  for (const m of section[1].matchAll(/^###\s+(.+?)\s*\n([\s\S]*?)(?=^###\s|(?![\s\S]))/gm)) {
    const question = toPlainText(m[1]);
    const answer = toPlainText(m[2]);
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

export function faqJsonLd(items: FaqItem[], url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntityOfPage: url,
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}
