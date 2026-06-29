export const meta = {
  name: 'artist-spotlight',
  description: 'Generate a draft Artist Spotlight: research → parallel(drills · hero · fact-check) → draft → edit. Draft-only; stops before publish.',
  whenToUse: 'Autonomous/deterministic version of the artist-profile orchestrator — the henchmen background agent runs this on a schedule, gated at publish. Pass { artist, song? } as args.',
  phases: [
    { title: 'Research', detail: 'discover + transcribe coach videos, consolidate, range/voice-type facts → brief' },
    { title: 'Fan-out', detail: 'drills · hero image · fact-check, in parallel from the brief' },
    { title: 'Draft', detail: 'assemble content/artist-profiles/<slug>.draft.md' },
    { title: 'Edit', detail: 'anti-slop / voice pass (editorial-critic)' },
  ],
};

// ---- inputs --------------------------------------------------------------
const artist = (args && args.artist) || (typeof args === 'string' ? args : null);
const song = (args && args.song) || null;
if (!artist) throw new Error('artist-spotlight: pass { artist, song? } as args');
const who = song ? `${artist} — "${song}"` : artist;

// ---- structured-output schemas (kept loose so workers don't fail validation)
const BRIEF = {
  type: 'object',
  required: ['artist', 'range', 'voiceType', 'coachSources'],
  properties: {
    artist: { type: 'string' }, song: { type: ['string', 'null'] },
    artistClass: { type: 'string', enum: ['technique', 'tone'] },
    range: { type: 'object' }, voiceType: { type: 'object' },
    signatureMove: { type: 'string' },
    consolidatedPoints: { type: 'array' }, disagreements: { type: 'array' }, pitfalls: { type: 'array' },
    coachSources: { type: 'array', items: { type: 'object' } },
    techniqueArticleMap: { type: 'array' }, specClaims: { type: 'array' }, references: { type: 'array' },
  },
};
const DRILLS = { type: 'object', required: ['candidates'], properties: { candidates: { type: 'array', items: { type: 'object' } } } };
const HERO = { type: 'object', properties: { ogImage: { type: ['string', 'null'] }, heroImage: { type: ['string', 'null'] }, headline: { type: 'string' }, alt: { type: 'string' }, rightsBasis: { type: 'string' } } };
const FACTCHECK = { type: 'object', required: ['verdicts'], properties: { verdicts: { type: 'array' }, sourcesFile: { type: ['string', 'null'] }, mustFix: { type: 'array' } } };
const DRAFT = { type: 'object', required: ['draftPath', 'slug'], properties: { draftPath: { type: 'string' }, slug: { type: 'string' }, summary: { type: 'string' } } };
const EDIT = { type: 'object', properties: { passed: { type: 'boolean' }, notes: { type: 'array' }, changesApplied: { type: 'boolean' } } };

const follow = (skill) => `Read and follow .claude/skills/${skill}/SKILL.md exactly.`;

// ---- PHASE 1 · RESEARCH (blocking — everything depends on the brief) -------
phase('Research');
log(`Researching ${who} — coach videos + consolidation`);
const brief = await agent(
  `You are Phase 1 (research) of the artist-spotlight pipeline for ${who}. ${follow('artist-research')}
   Use scripts/yt-extract.sh (search + batch --json) to find + transcribe 3–6 credible vocal-coach videos,
   consolidate them, and establish hedged+sourced range/voice-type facts and the technique→Learn-article map.
   Return ONLY the research brief as JSON.`,
  { schema: BRIEF, label: `research:${artist}`, phase: 'Research' },
);
if (!brief) throw new Error('research phase returned nothing');

// ---- PHASE 2 · FAN-OUT (parallel — independent given the brief) ------------
phase('Fan-out');
log('Fan-out: drills · hero image · fact-check (parallel)');
const briefJson = JSON.stringify(brief);
const [drills, hero, factcheck] = await parallel([
  () => agent(
    `Phase 2 worker for ${who}. ${follow('spotlight-drills')} Research brief: ${briefJson}.
     Propose a native-first candidate-drill menu (4–6). Return JSON.`,
    { schema: DRILLS, label: `drills:${artist}`, phase: 'Fan-out' },
  ),
  () => agent(
    `Phase 2 worker for ${who}. ${follow('spotlight-hero-image')} Research brief: ${briefJson}.
     Compose the hero/OG image (rights-guarded — default typographic if no cleared photo). Return JSON.`,
    { schema: HERO, label: `hero:${artist}`, phase: 'Fan-out' },
  ),
  () => agent(
    `Phase 2 worker for ${who}. ${follow('content-fact-check')} Verify the brief's specClaims + any
     range/voice-type/health claims with >=2 lenses; write seo/spotlight-<slug>-content-sources.md. Return JSON.`,
    { schema: FACTCHECK, label: `fact-check:${artist}`, phase: 'Fan-out' },
  ),
]);

// ---- PHASE 3 · DRAFT (barrier — needs all Phase-2 outputs) -----------------
phase('Draft');
log('Assembling the draft (applying fact-check verdicts)');
const draft = await agent(
  `You are Phase 3 (draft) for ${who}. ${follow('draft-spotlight')}
   Research brief: ${briefJson}
   Drill menu: ${JSON.stringify(drills)}
   Hero image: ${JSON.stringify(hero)}
   Fact-check verdicts: ${JSON.stringify(factcheck)}
   Assemble content/artist-profiles/<slug>.draft.md (apply the verdicts), then run \`npm run profiles:gen\`.
   Return JSON with draftPath + slug.`,
  { schema: DRAFT, label: `draft:${artist}`, phase: 'Draft' },
);
if (!draft) throw new Error('draft phase returned nothing');

// ---- PHASE 4 · EDIT (loop-until-pass) -------------------------------------
phase('Edit');
log('Editorial pass (anti-slop / voice)');
const edited = await agent(
  `You are Phase 4 (edit) for ${who}. Apply the editorial-critic anti-slop + brand-voice standards to
   ${draft.draftPath}: kill AI tells, enforce hedging on range/voice-type claims, confirm internal links +
   the medical disclaimer. Edit the file in place. Re-run \`npm run profiles:gen\`. Return JSON.`,
  { schema: EDIT, label: `edit:${artist}`, phase: 'Edit' },
);

// ---- STAGE (no publish — human gates own that) ----------------------------
log(`Draft staged: ${draft.draftPath}. Human gates: approve on preview → publish.`);
return {
  artist, song, slug: draft.slug, draftPath: draft.draftPath,
  drillCount: (drills && drills.candidates && drills.candidates.length) || 0,
  heroRightsBasis: (hero && hero.rightsBasis) || 'unknown',
  factcheckMustFix: (factcheck && factcheck.mustFix) || [],
  editPassed: (edited && edited.passed) !== false,
  coachSourceCount: (brief.coachSources && brief.coachSources.length) || 0,
  note: 'Draft-only. Not published. Approve on the Netlify preview, then promote (status -> published).',
};
