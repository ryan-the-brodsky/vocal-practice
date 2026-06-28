// Shape of an Artist Spotlight profile. Authored as Markdown in
// content/artist-profiles/<slug>.draft.md (or <slug>.md once promoted);
// scripts/gen-artist-profiles.mjs parses scalar frontmatter + body into
// content/artist-profiles/profiles.generated.ts (run `npm run profiles:gen`).
//
// The body carries inline island markers the artists/[slug] route expands:
//   [[RANGE-TESTER compareTo="<artist>"]]      -> RangeTesterIsland
//   [[COACH-VIDEO id=<ytid> by="<channel>" title="…"]] -> CoachVideo (YouTube embed)
//   [[DRILL exerciseId=<id> key="<key>"]]       -> EmbeddedExercise + "Add to routine"
//   [[SHARE]]                                    -> ShareRow

export interface ArtistProfile {
  slug: string;
  title: string;
  seoTitle?: string;
  category: string; // 'artist-profile'
  mode: string; // 'artist' | 'song'
  artist: string;
  song?: string;
  heroImage?: string;
  ogImage?: string;
  heroHeadline?: string;
  metaDescription: string;
  /** 'draft' | 'published' — drafts are excluded from prod builds (draft-gate). */
  status: string;
  /** Date written — drives newest-first ordering on the Learn spotlight carousel. */
  published: string;
  updated: string;
  /** Raw Markdown body (everything after the frontmatter), including island markers. */
  body: string;
}
