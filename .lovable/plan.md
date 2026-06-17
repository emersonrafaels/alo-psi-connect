## Objetivo

Adicionar a escala **MHC-SF** (Mental Health Continuum – Short Form, 14 itens) ao módulo de Escalas Emocionais e aproveitar para entregar melhorias estruturais que tornam o módulo mais robusto, informativo e estratégico — tanto para o paciente quanto para relatórios institucionais.

---

## 1. Nova escala: MHC-SF (Mental Health Continuum – Short Form)

### Conteúdo clínico
- **Código:** `MHCSF`
- **Itens:** 14 perguntas, escala 0–5 (0 = Nunca · 1 = Uma ou duas vezes · 2 = Cerca de uma vez por semana · 3 = Cerca de 2–3 vezes por semana · 4 = Quase todo dia · 5 = Todo dia), referindo-se às **últimas 4 semanas**.
- **Subescalas:**
  - Bem-estar emocional (itens 1–3)
  - Bem-estar social (itens 4–8)
  - Bem-estar psicológico (itens 9–14)
- **Classificação (flourishing / moderate / languishing):**
  - **Flourishing:** pontuação 4 ou 5 em ≥1 item emocional E em ≥6 dos 11 itens sociais+psicológicos.
  - **Languishing:** pontuação 0 ou 1 em ≥1 item emocional E em ≥6 dos 11 itens sociais+psicológicos.
  - **Moderate:** demais casos.
- **Direção ISEU:** `positive` (mais alto = melhor).
- **Peso ISEU sugerido:** `15.0` (saúde mental positiva — complementa o WHO-5).
- **Frequência sugerida:** 30 dias (mensal).
- **Tempo estimado:** ~3 min.

### Ajustes nos pesos do ISEU-RBE
Para acomodar a nova escala mantendo equilíbrio entre "saúde positiva" e "sintomas":

| Escala | Peso atual | Peso novo |
|--------|------------|-----------|
| WHO-5 | 20.0 | 18.0 |
| **MHC-SF** | — | **15.0** |
| PHQ-9 | 18.0 | 16.0 |
| GAD-7 | 13.5 | 12.5 |
| PSS-10 | 13.5 | 12.5 |
| ISI | 10.0 | 10.0 |

Total positivo (WHO-5 + MHC-SF) = 33 · Total sintomas (PHQ-9 + GAD-7 + PSS-10 + ISI) = 51 → mantém leitura clínica conservadora.

### Severidade armazenada
O campo `severity` da resposta receberá `flourishing` / `moderate` / `languishing`. As três subescalas serão calculadas e **persistidas** (ver §3).

---

## 2. Subescalas e detalhamento por resposta (melhoria estrutural)

Hoje cada resposta guarda apenas `raw_score` + `normalized_score`. Para o MHC-SF (e futuramente outras multidimensionais) precisamos guardar resultados por subescala.

- Nova coluna `subscale_scores jsonb` em `emotional_scale_responses`, ex.:
  ```json
  { "emotional": {"raw": 12, "normalized": 80},
    "social":    {"raw": 15, "normalized": 60},
    "psychological": {"raw": 22, "normalized": 73} }
  ```
- Nova coluna `subscales jsonb` em `emotional_scales` declarando estrutura (itens por subescala, label, peso interno).
- A edge function `submit-scale-response` calcula automaticamente as subescalas quando `scale.subscales` existir.

---

## 3. Edge function `submit-scale-response` — extensões

- Adicionar bloco de scoring específico para `MHCSF` (classificação flourishing/moderate/languishing).
- Calcular subescalas com base em `scale.subscales`.
- Continuar respeitando `frequency_days` e o bypass por admin (`force`).
- Recalcular ISEU (`compute_iseu_score`) com os novos pesos.

---

## 4. Função SQL `compute_iseu_score`

- Atualizar pesos conforme tabela acima.
- Garantir que MHC-SF entra na composição (último registro nos últimos 180 dias).
- Sem mudança de assinatura — apenas o conteúdo interno do cálculo.

---

## 5. Melhorias de UX nas páginas existentes

### `/escalas` (EmotionalScales.tsx)
- Agrupar visualmente as escalas em duas seções:
  - **Saúde positiva:** WHO-5, MHC-SF
  - **Sintomas e risco:** PHQ-9, GAD-7, PSS-10, ISI
- Adicionar badge "Novo" no card do MHC-SF por 30 dias após o release.
- Mostrar miniatura de severidade da última aplicação com cor (verde/amarelo/laranja/vermelho) em vez de só `Badge variant=outline`.

### `/escalas/:code` (ScaleResponse.tsx)
- Quando a escala tiver `subscales`, exibir no resultado um pequeno gráfico de barras horizontais (Recharts) com as três subescalas (0–100).
- Mostrar interpretação amigável para MHC-SF: "Você está em **florescimento**" / "moderado" / "definhamento", com texto explicativo curto.
- Para escalas longas (≥14 itens), agrupar itens em "páginas" de 5 com botão "Continuar" — reduz fadiga de resposta.

### `/minhas-emocoes` (MyEmotions.tsx)
- Adicionar **cards individuais por escala** mostrando: última pontuação, tendência (sparkline de 6 últimas aplicações), próxima data sugerida.
- Adicionar tab "Subescalas" exibindo evolução de cada subescala do MHC-SF separadamente.
- Permitir exportar histórico em PDF (reaproveitando `utils/pdfGenerator.ts`).
- Banda colorida (verde/amarelo/laranja/vermelho) no gráfico ISEU-RBE como áreas de referência.

---

## 6. Notificações e engajamento

- Job/edge function `notify-scale-due` (cron diário) que:
  - Identifica usuários com escala vencida (passou `frequency_days`).
  - Envia e-mail (template padrão `noreply@redebemestar.com.br`) com link direto para responder.
  - Limite: no máximo 1 e-mail por usuário por semana.
- Banner discreto na `/escalas` quando há escalas vencidas.

---

## 7. Visão institucional (agregados anônimos)

- Nova função SQL `get_institution_mhcsf_distribution(p_institution_id uuid, p_days int)` que retorna `% flourishing / moderate / languishing` dos vínculos da instituição.
- Card adicional em `InstitutionPortal` → aba "Bem-estar": "Saúde mental positiva (MHC-SF)" com distribuição em pizza + comparativo com período anterior.
- Reaproveitar o padrão dos charts de 180px já usado em wellbeing-dashboard-charts.

---

## 8. Seed/Migration de conteúdo

Migration única contendo:
1. `ALTER TABLE emotional_scale_responses ADD COLUMN subscale_scores jsonb`.
2. `ALTER TABLE emotional_scales ADD COLUMN subscales jsonb`.
3. `INSERT` da escala MHC-SF + 14 itens + estrutura de subescalas.
4. `UPDATE` dos pesos das escalas existentes.
5. Recriação da função `compute_iseu_score` com os pesos novos.
6. Criação da função `get_institution_mhcsf_distribution`.
7. `GRANT` apropriados.

---

## Resultado esperado

- Paciente passa a contar com uma sexta escala que mede **saúde mental positiva** (não só ausência de sintomas).
- ISEU-RBE fica mais equilibrado, refletindo tanto bem-estar quanto sintomas.
- Histórico e dashboards ganham profundidade (subescalas, sparklines, distribuição institucional).
- Engajamento aumenta com lembretes automáticos e UX paginada para escalas longas.
