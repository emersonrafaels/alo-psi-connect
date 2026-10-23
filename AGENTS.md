# Architecture decisions

- Manage Afya study-case credentials only through the admin-authorized `afya-study-cases` function and a protected synthetic-case registry; server-side registry checks suppress outbound notifications independently of user-editable metadata.
- Derive follow-on study-case behavior from its baseline pattern while generating distinct histories per case key, so new demonstration accounts preserve the intended scenario without copying identical data.

- Keep body-region definitions in `src/features/jornada/v5/bodyRegions.ts` so maps, checkout selectors, summaries, and the emotional landscape share one canonical catalogue.
- Build emotional-landscape trends from user-scoped `journey_session_emotions` rows, while keeping aggregate frequency sourced from `journey_landscape`, because intensity history and frequency are distinct measures.
- Build the body's emotional landscape from user-scoped `journey_sessions.comprehension.body_layers`, merged with the current check-in, so historical and unsaved marks share one visualization.
- Always anonymize students on institution-facing screens with stable `Aluno #N` labels derived from patient IDs; keep real identities out of search, exports, dialogs, and Buddy views to protect privacy.
- Keep the public “Como funciona” narrative in `src/pages/HowItWorks.tsx`; it owns the six-section reference sequence and tenant-aware links.
- Scope the “Como funciona” visual language under `.how-it-works-page`, using semantic HSL tokens and Outfit/Figtree so its reference-driven styling does not leak into other public pages.- Feed the institutional Comparador only from the `get_institution_comparator` aggregate RPC and hide groups with fewer than 10 respondents, so no individual student data reaches the page.
- Keep the Comparador's Análise Integrada in `src/features/institution/comparator/` with scale interpretation bands in `scaleBands.ts`, so the page file stays small and bands have one source.
- Keep the Alunos page's Estrutura acadêmica tab in `src/features/academic/structure/` and show only aggregate student counts there (tree, detail panel, CSV), so the hierarchy view never exposes student identities.
- Compute institutional portal wellbeing numbers in the `get_institution_wellbeing_summary` RPC instead of downloading raw mood entries, so large institutions load fast and only aggregates leave the database.
- Detect triage critical keywords only in the `get_institution_critical_flags` RPC (returns severity/count/date, never diary text) and apply escalation via `src/features/triage/criticalTerms.ts`, so institutions never see student writing.
- Keep compact and expanded student-history charts in the same MoodTrendChart with shared sentiment selection, so maximizing preserves the visible series and their values.
- Build student-history series through trendSeries: merge equivalent sentiment labels, prefer available legacy scores with dynamic fallback, and assign non-repeating theme-aware color tokens to prevent duplicate legends.
