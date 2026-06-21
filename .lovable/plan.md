Add scale-completion and current ISEU-RBE info to the Admin → Pacientes table, plus a matching filter.

### Backend — `supabase/functions/admin-patients-overview/index.ts` (list action)

Add two aggregations per listed user:

1. **Scales filled**: `SELECT DISTINCT scale_code FROM emotional_scale_responses WHERE user_id IN (...)`. Group by user → set of codes.
2. **Required ISEU scales**: load once `SELECT code FROM emotional_scales WHERE active = true AND iseu_weight > 0` → `requiredCodes`.
3. **Latest ISEU**: `SELECT user_id, score, band, computed_at FROM iseu_scores WHERE user_id IN (...) ORDER BY computed_at DESC`, keep first per user.

Build per-row payload:
```
scales: {
  filled: number,           // distinct scale_codes the user has answered
  required: number,         // requiredCodes.length
  missing: string[],        // requiredCodes \ filledCodes
  complete: boolean,        // missing.length === 0
}
iseu: {
  score: number | null,     // latest iseu_scores.score, only if complete
  band: 'low'|'moderate'|'high'|'excellent' | null,
  computed_at: string | null,
}
```
`iseu.score`/`band` are returned only when `scales.complete` is true (matches the rule already used on the user-facing page).

### Frontend types — `src/hooks/useAdminPatientsOverview.tsx`

Extend `PatientOverviewRow` with `scales` and `iseu` fields above.

### Table — `src/components/triagem/PatientsTriageView.tsx`

Add two columns between **Diário** and **Encontros**:

- **Escalas** (`x/total`) — small badge; green when complete, neutral otherwise.
- **ISEU-RBE** — colored badge with the score and band label, or em-dash + tooltip "Aguardando escalas" when not complete. Reuse `ISEU_BAND_LABEL`/`ISEU_BAND_COLOR` from `src/hooks/useEmotionalScales` (already used in MyEmotions).

Update `colSpan` placeholders (8 → 10), CSV export (`Escalas preenchidas`, `Escalas totais`, `ISEU score`, `ISEU faixa`).

### Filters — `src/components/triagem/PatientsTriageFilters.tsx`

Add two filter chips:

- **Escalas**: `todos | completas | incompletas | nenhuma`.
- **ISEU**: `todos | baixo | moderado | alto | excelente | sem_iseu`.

Extend `defaultFilters`, `TriageFilters` type, and `applyTriageFilters` to filter rows accordingly.

### Out of scope

- No DB migration. All data already lives in `emotional_scale_responses`, `emotional_scales`, `iseu_scores`.
- No changes to the patient drawer.
- No recomputation of ISEU (uses latest stored value).