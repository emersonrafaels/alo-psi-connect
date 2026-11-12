# Triage rules

- Keep the triage all-students view separate from the pending queue and filter its user-scoped student data through `studentFilters`, so every risk level can be reviewed without changing triage eligibility or records.
- Use `isAwaitingTriage` from triage priorities for pending lists and institutional counters, so all entry points share the same eligibility rule without modifying historical triage records.
- Compute triage team metrics (period comparisons, median resolution time, coverage, outcomes, weekly flow) as pure functions in `src/features/triage/metrics/teamMetrics.ts`, and keep the three.js campus views in `src/features/triage/metrics/three/` lazy-loaded and aggregated per course (risk split hidden below 10 students, as in the Comparador), so the main bundle stays light and the 3D never exposes individual students.
- Store triage quick notes in `student_triage_notes`, never in `student_triage`, so an internal annotation never changes a student's queue status, triage metrics or benchmarks.
- Detect triage critical keywords only in the `get_institution_critical_flags` RPC (returns severity/count/date, never diary text) and keep them as a separate text signal that never changes the numeric level, so institutions never see student writing and colors depend only on scores.
- Keep triage level thresholds, reasons, care-status and labels in `src/features/triage/signalRules.ts` (mirrored in `buddy-institution-chat/triageRules.ts`); mood drop is only a complementary reason and care status never changes the level color.
- Keep compact and expanded student-history charts in the same MoodTrendChart with shared sentiment selection, so maximizing preserves the visible series and their values.
- Build student-history series through trendSeries: merge equivalent sentiment labels, prefer available legacy scores with dynamic fallback, and assign non-repeating theme-aware color tokens to prevent duplicate legends.
- Derive student-history sentiment tag colors from `src/features/triage/sentimentBands.ts`, which flips the scale for unpleasant sentiments using the emotion taxonomy valence, so a high anxiety or stress score never reads as a good result.
