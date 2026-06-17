## Atualizar faixas de severidade das escalas conforme a tabela de referência

Ajustes apenas em rótulos/faixas; não muda cálculo bruto, normalização nem pesos do ISEU.

### 1. `supabase/functions/submit-scale-response/index.ts` — switch `severity`

| Escala | Faixa (raw) | Severidade |
|---|---|---|
| **WHO-5** (0–25) | 18–25 | `adequado` |
| | 13–17 | `baixo` |
| | 0–12 | `muito baixo` |
| **MHC-SF** | (sem mudança — `florescimento` / `moderado` / `definhamento`) | |
| **PHQ-9** | 0–4 / 5–9 / 10–14 / 15–19 / 20–27 | `mínimo` / `leve` / `moderado` / `moderadamente grave` / `grave` *(já correto)* |
| **GAD-7** | 0–4 / 5–9 / 10–14 / 15–21 | `mínima` / `leve` / `moderada` / `severa` *(gênero feminino)* |
| **PSS-10** | 0–13 / 14–26 / 27–40 | `baixo` / `moderado` / `alto` *(já correto)* |
| **ISI** | 0–7 / 8–14 / 15–21 / 22–28 | `sem insônia significativa` / `subliminar` / `moderada` / `severa` |

WHO-5 deixa de usar a conversão `raw*4` para classificação — passa a usar o raw direto (0–25), com os pontos de corte da imagem (≤12 ≈ <50/100 → muito baixo).

### 2. `src/hooks/useEmotionalScales.tsx` — `severityBand()`

Atualizar o mapeamento severidade→banda ISEU para os novos rótulos:

- **WHO-5**: `adequado` → verde, `baixo` → laranja, `muito baixo` → vermelho. (Sem faixa intermediária amarela — a escala tem 3 níveis.)
- **GAD-7**: `mínima` → verde, `leve` → amarelo, `moderada` → laranja, `severa` → vermelho.
- **ISI**: `sem insônia significativa` → verde, `subliminar` → amarelo, `moderada` → laranja, `severa` → vermelho.

### 3. Histórico — sem migração

Respostas antigas no banco mantêm os rótulos antigos (`ótimo`, `bom`, `mínimo` masculino p/ GAD-7, `sem insônia`, `grave` p/ ISI). O `severityBand()` continuará reconhecendo-os para colorir corretamente (fallback amarelo já trata casos desconhecidos). Novas respostas usarão os rótulos atualizados.

### Fora do escopo

- Pesos do ISEU, cálculo do `normalized_score`, conteúdo dos itens e UI permanecem inalterados.
- Sem alteração no banco de dados (sem migração).
