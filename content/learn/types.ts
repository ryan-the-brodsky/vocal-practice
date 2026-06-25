// Shape of a Learn-library article. Articles are authored as Markdown in
// content/learn/<slug>.md; scripts/gen-learn-content.mjs parses the frontmatter
// + body into content/learn/articles.generated.ts (run `npm run learn:gen`).

export interface LearnArticle {
  slug: string;
  title: string;
  /** Capability id (lib/exercises/capabilities) or a content tag: foundations | pitch-ear. */
  category: string;
  tags: string[];
  /** data/exercises/<id>.json — the exercise this article links into. */
  embeddedExerciseId: string;
  targetKeyword: string;
  volume: number;
  kd: number;
  intent: string;
  metaDescription: string;
  updated: string;
  /** Raw Markdown body (everything after the frontmatter, including ## Sources). */
  body: string;
}
