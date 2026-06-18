## Objetivo

Padronizar os textos de resultado das escalas conforme a imagem de referência e trocar o rótulo "Severidade" por "Resultado" na tela de resposta.

## Mudanças

### 1. `supabase/functions/submit-scale-response/index.ts` — textos de severidade

Atualizar o switch de severity para gerar frases amigáveis (mantendo a lógica/cutoffs atuais):

- **WHO5**: `Bem-estar adequado` / `Bem-estar baixo` / `Bem-estar muito baixo`
- **PHQ9**: `Sintomas depressivos mínimos` / `…leves` / `…moderados` / `…moderadamente graves` / `…graves`
- **GAD7**: `Ansiedade mínima` / `…leve` / `…moderada` / `…severa`
- **PSS10**: `Estresse percebido baixo` / `…moderado` / `…alto`
- **ISI**: `Sem insônia significativa` / `Insônia subclínica` / `Insônia clínica moderada` / `Insônia clínica severa`
- **MHCSF**: manter `florescimento` / `moderado` / `definhamento` (já alinhado com a interpretação da tela), mas exibir como `Florescimento` / `Saúde mental moderada` / `Definhamento` no front (item 3).

Respostas novas já gravarão os textos novos. Respostas antigas continuam exibindo seus textos antigos (sem migração).

### 2. `src/hooks/useEmotionalScales.tsx` — mapeamento de cores

Atualizar `severityBand()` para reconhecer também as novas strings (ex.: `"insônia clínica severa"`, `"ansiedade severa"`, `"sintomas depressivos graves"`, `"bem-estar muito baixo"`, `"estresse percebido alto"`), mantendo retro-compatibilidade com os termos antigos.

### 3. `src/pages/ScaleResponse.tsx`

- Trocar o rótulo `Severidade:` por `Resultado:`.
- Exibir `result.response.severity` como veio do backend (já será a frase amigável). Remover `capitalize` no Badge para preservar a capitalização da frase.
- Para MHCSF, continuar usando o bloco `MHCSF_INTERPRETATION` baseado nas chaves `florescimento|moderado|definhamento`.

### 4. `src/pages/MyEmotions.tsx`

- Cabeçalho da tabela: `Severidade` → `Resultado`.
- Remover `capitalize` da célula para respeitar as frases.

## Fora de escopo

- Não alterar cutoffs, scoring, RLS ou cálculo do ISEU.
- Não migrar registros históricos.