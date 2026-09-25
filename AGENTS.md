# Architecture decisions

- Keep body-region definitions in `src/features/jornada/v5/bodyRegions.ts` so maps, checkout selectors, summaries, and the emotional landscape share one canonical catalogue.
- Build emotional-landscape trends from user-scoped `journey_session_emotions` rows, while keeping aggregate frequency sourced from `journey_landscape`, because intensity history and frequency are distinct measures.
- Build the body's emotional landscape from user-scoped `journey_sessions.comprehension.body_layers`, merged with the current check-in, so historical and unsaved marks share one visualization.