# Architecture decisions

- Keep body-region definitions in `src/features/jornada/v5/bodyRegions.ts` so maps, checkout selectors, summaries, and the emotional landscape share one canonical catalogue.
- Build emotional-landscape trends from user-scoped `journey_session_emotions` rows, while keeping aggregate frequency sourced from `journey_landscape`, because intensity history and frequency are distinct measures.