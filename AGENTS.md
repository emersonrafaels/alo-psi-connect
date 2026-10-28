# Architecture decisions

- Keep the triage all-students view separate from the pending queue and filter its user-scoped student data through `studentFilters`, so every risk level can be reviewed without changing triage eligibility or records.

- Use `isAwaitingTriage` from triage priorities for pending lists and institutional counters, so all entry points share the same eligibility rule without modifying historical triage records.

- Manage Afya study-case credentials only through the admin-authorized `afya-study-cases` function and a protected synthetic-case registry; server-side registry checks suppress outbound notifications independently of user-editable metadata.
- Derive follow-on study-case behavior from its baseline pattern while generating distinct histories per case key, so new demonstration accounts preserve the intended scenario without copying identical data.
- Define pending Afya demonstration refreshes in `scripts/afya-pending-storytelling.ts` with tested score trajectories and transactional synthetic-only guards, so diary, practice and scale histories stay coherent without altering protected study cases or sending notifications.

- Keep body-region definitions in `src/features/jornada/v5/bodyRegions.ts` so maps, checkout selectors, summaries, and the emotional landscape share one canonical catalogue.
- Build emotional-landscape trends from user-scoped `journey_session_emotions` rows, while keeping aggregate frequency sourced from `journey_landscape`, because intensity history and frequency are distinct measures.
- Build the body's emotional landscape from user-scoped `journey_sessions.comprehension.body_layers`, merged with the current check-in, so historical and unsaved marks share one visualization.
- Always anonymize students on institution-facing screens with stable `Aluno #N` labels derived from patient IDs; keep real identities out of search, exports, dialogs, and Buddy views to protect privacy.
- Keep the public “Como funciona” narrative in `src/pages/HowItWorks.tsx`; it owns the six-section reference sequence and tenant-aware links.
- Scope the “Como funciona” visual language under `.how-it-works-page`, using semantic HSL tokens and Outfit/Figtree so its reference-driven styling does not leak into other public pages.- Feed the institutional Comparador only from the `get_institution_comparator` aggregate RPC and hide groups with fewer than 10 respondents, so no individual student data reaches the page.
- Keep the Comparador's Análise Integrada in `src/features/institution/comparator/` with scale interpretation bands in `scaleBands.ts`, so the page file stays small and bands have one source.
- Keep the Alunos page's Estrutura acadêmica tab in `src/features/academic/structure/` and show only aggregate student counts there (tree, detail panel, CSV), so the hierarchy view never exposes student identities.
- Compute institutional portal wellbeing numbers in the `get_institution_wellbeing_summary` RPC instead of downloading raw mood entries, so large institutions load fast and only aggregates leave the database.
- Compute triage team metrics (period comparisons, median resolution time, coverage, outcomes, weekly flow) as pure functions in `src/features/triage/metrics/teamMetrics.ts`, and keep the three.js campus views in `src/features/triage/metrics/three/` lazy-loaded and aggregated per course (risk split hidden below 10 students, as in the Comparador), so the main bundle stays light and the 3D never exposes individual students.
- Store triage quick notes in `student_triage_notes`, never in `student_triage`, so an internal annotation never changes a student's queue status, triage metrics or benchmarks.
- Detect triage critical keywords only in the `get_institution_critical_flags` RPC (returns severity/count/date, never diary text) and keep them as a separate text signal that never changes the numeric level, so institutions never see student writing and colors depend only on scores.
- Keep triage level thresholds, reasons, care-status and labels in `src/features/triage/signalRules.ts` (mirrored in `buddy-institution-chat/triageRules.ts`); mood drop is only a complementary reason and care status never changes the level color.
- Keep compact and expanded student-history charts in the same MoodTrendChart with shared sentiment selection, so maximizing preserves the visible series and their values.
- Build student-history series through trendSeries: merge equivalent sentiment labels, prefer available legacy scores with dynamic fallback, and assign non-repeating theme-aware color tokens to prevent duplicate legends.
- Derive student-history sentiment tag colors from `src/features/triage/sentimentBands.ts`, which flips the scale for unpleasant sentiments using the emotion taxonomy valence, so a high anxiety or stress score never reads as a good result.
- Keep the institutional portal's section navigation in `src/features/institution/portal/PortalSidebar.tsx` (sidebar on desktop, sheet on mobile) with the active section in `?tab=`, so deep links and back navigation work and new sections are added in one place.

- Route all message sends through the `send-message` function, which resolves recipients and checks sender rights server-side (rules in `supabase/functions/send-message/audience.ts`); threads are one per recipient so students never see each other, and `list_my_message_threads` reveals a student name to an institution only after the student replies with `is_anonymous = false` (tracked by `message_threads.recipient_identified`).
- Feed the institutional Métricas tab from the `get_institution_usage_metrics` aggregate RPC (pure helpers in `src/features/institution/metrics/usageMetrics.ts`), counting activity per student profile and hiding courses below 10 students, so usage analytics never expose individuals.
