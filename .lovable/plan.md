# Buddy Institucional — geração funcional + storytelling "uau"

## Diagnóstico
A tela mostra "Ainda não há dados suficientes" mesmo com 33 alunos e 990 check-ins. Causa: o painel (`BuddyInstitutionPanel.tsx`) lê `data.insights`, mas a edge function `institution-predictive-insights` devolve `predictive_insights` + `suggested_actions`. O array `insights` sempre chega vazio, então cai no estado de "sem dados". Nada a ver com volume — é um bug de contrato.

## O que vai mudar

### 1. Edge Function `institution-predictive-insights`
Reescrever o prompt para falar a língua que um gestor de instituição de ensino quer ouvir: panorama, impacto acadêmico/socioemocional, coorte afetada, evidência nos dados, próximo passo concreto.

Novo payload de resposta:
```json
{
  "headline": "Frase curta de impacto (1 linha)",
  "tldr": "Resumo executivo em 2-3 frases para leitura de 10s",
  "wow_metric": { "label": "...", "value": "...", "context": "..." },
  "insights": [
    {
      "title": "...",
      "narrative": "situação → o que significa para a instituição → recomendação",
      "cohort": "grupo afetado (ex: alunos com humor <3 nos últimos 15d)",
      "impact": "academico" | "socioemocional" | "engajamento" | "risco",
      "severity": "atencao" | "alerta" | "critico" | "positivo",
      "confidence": "baixa" | "media" | "alta",
      "evidence": "referência aos números que sustentam"
    }
  ],
  "priority_actions": [
    { "title": "...", "why": "...", "how": "passos práticos", "owner": "Coordenação|Psicologia|Professores|Gestão", "timeframe": "esta semana|15 dias|mês", "cta_label": "..." }
  ],
  "celebrate": ["conquistas/pontos positivos para reforçar"]
}
```

Prompt novo (resumo): "Você é um consultor sênior em bem-estar estudantil. Traduza dados agregados em decisões que uma coordenação/reitoria toma segunda de manhã. Evite jargão clínico. Cada insight precisa responder: o que está acontecendo, por que a instituição deve se importar, o que fazer nos próximos 15 dias, quem executa. Nunca cite alunos individualmente."

Manter cache 24h, mas gravar o novo `payload`.

### 2. Painel `BuddyInstitutionPanel.tsx` — redesenho "uau"
Remover totalmente o card "Benchmark com a rede" e o bloco de fallback "Ainda não há dados suficientes" antigo.

Nova estrutura visual:
- **Hero de storytelling**: fundo gradiente sutil, mascote Buddy (roxo) ao lado, `headline` grande, `tldr` embaixo.
- **Cartão de métrica-uau**: destaque em número grande (`wow_metric.value`), rótulo e contexto — o "efeito uau" para o gestor.
- **Bloco Celebrar** (verde, ícone Sparkles): lista curta do que está indo bem — abre a conversa positiva.
- **Insights (2 col em md+)**: cards com:
  - Ícone por `impact` (livro=academico, coração=socioemocional, users=engajamento, alerta=risco)
  - Badge de `severity` em PT-BR com cor coerente (Atenção âmbar / Alerta laranja / Crítico rose / Positivo esmeralda)
  - `narrative` em 3 linhas com quebra por marcadores "Situação · Impacto · Recomendação"
  - Rodapé com coorte + confiança + evidência (menor, muted)
- **Ações prioritárias**: lista numerada estilo checklist executivo, cada item com título, "Por quê" (1 linha), "Como" (2-3 bullets), badge de `owner` e `timeframe`, botão CTA que rola para a aba correspondente (Triagem/Notas) quando aplicável.
- **Rodapé**: "Gerado em <data> · atualizado a cada 24h" + botão "Atualizar" que força regeneração.

Estado inicial (antes do clique "Gerar insights"): manter card convite, mas com preview do que virá (3 pílulas: "Diagnóstico executivo", "Coortes em risco", "Plano de 15 dias").

Estado sem insights suficientes: mostrar mensagem apenas se `insights.length === 0` **após** geração bem-sucedida, com CTA para revisar quando houver mais dados.

### 3. Compatibilidade
Adicionar leitura tolerante: se o payload vier no formato antigo (`predictive_insights`), mapear para o novo shape no cliente antes de renderizar — evita quebrar caches de 24h já gravados.

## Arquivos alterados
- `supabase/functions/institution-predictive-insights/index.ts` — novo prompt + novo shape de payload
- `src/components/institution/BuddyInstitutionPanel.tsx` — remove benchmark, novo layout de storytelling, mapper de compatibilidade
- (nenhuma migração, nenhuma alteração em outras abas)

## Validação
- Clicar em "Gerar insights" na UNIFAGOC deve retornar `headline`, `tldr`, `wow_metric`, ≥3 insights e ≥3 ações.
- Card benchmark não aparece mais.
- Layout responsivo (grid 1 col em mobile, 2 em md).
