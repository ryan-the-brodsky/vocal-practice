import { extractFaq, faqJsonLd } from "@/lib/seo/faq";
import { LEARN_ARTICLES } from "@/content/learn/articles.generated";

const ARTICLE = `# Title

Intro paragraph.

## What is belting?

Not a FAQ heading — an ordinary H2 question.

## FAQ

### What is the difference between belting and shouting?

Shouting drives volume through **air pressure**. Belt drives it through [resonance](https://example.com).

### Can anyone learn to belt?

Belt is a learnable coordination, not an innate gift.

## Sources

- Estill (1988)
`;

describe("extractFaq", () => {
  it("pulls each ### question/answer pair from the FAQ block", () => {
    const faq = extractFaq(ARTICLE);
    expect(faq).toHaveLength(2);
    expect(faq[0].question).toBe("What is the difference between belting and shouting?");
    expect(faq[1].question).toBe("Can anyone learn to belt?");
  });

  it("strips markdown emphasis and link syntax from answers", () => {
    const [first] = extractFaq(ARTICLE);
    expect(first.answer).toBe(
      "Shouting drives volume through air pressure. Belt drives it through resonance.",
    );
  });

  it("ignores H2 questions outside the FAQ block", () => {
    expect(extractFaq(ARTICLE).map((f) => f.question)).not.toContain("What is belting?");
  });

  it("stops at the next H2 so Sources never leaks into an answer", () => {
    for (const { answer } of extractFaq(ARTICLE)) expect(answer).not.toMatch(/Estill/);
  });

  it("returns [] when the article has no FAQ section", () => {
    expect(extractFaq("# Title\n\n## Intro\n\nBody.\n")).toEqual([]);
  });

  it("returns [] rather than throwing on an empty FAQ block", () => {
    expect(extractFaq("## FAQ\n\n## Sources\n")).toEqual([]);
  });
});

describe("faqJsonLd", () => {
  it("emits a schema.org FAQPage with one Question per item", () => {
    const ld = faqJsonLd(extractFaq(ARTICLE), "https://vocalhabit.com/learn/belting-exercises");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]).toMatchObject({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer" },
    });
  });
});

describe("shipped articles", () => {
  // The 9 authored FAQ blocks must stay parseable — a heading-level typo in an
  // article would otherwise silently drop its structured data.
  const withFaq = LEARN_ARTICLES.filter((a) => /^## FAQ/m.test(a.body));

  it("finds the authored FAQ sections", () => {
    expect(withFaq.length).toBeGreaterThanOrEqual(9);
  });

  it.each(withFaq.map((a) => a.slug))("%s parses to non-empty Q&A pairs", (slug) => {
    const article = LEARN_ARTICLES.find((a) => a.slug === slug)!;
    const faq = extractFaq(article.body);
    expect(faq.length).toBeGreaterThan(0);
    for (const { question, answer } of faq) {
      expect(question.length).toBeGreaterThan(0);
      expect(answer.length).toBeGreaterThan(0);
      expect(answer).not.toMatch(/^#/);
    }
  });
});
