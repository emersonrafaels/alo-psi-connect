# Radar Institucional — Plano

Novo diagnóstico consultivo por instituição (IES), com formulário multi-etapa, cálculo de maturidade e visualizações. Preenchimento e visualização pelo Admin e pelo Portal Institucional (login existente).

## Escopo

**1. Formulário (baseado no HTML anexo, com UX/UI refinado no padrão RBE)**
- Etapa 1 — Identificação: nome, cidade, estado, nº alunos, tipo, estrutura de apoio.
- Etapa 2 — Perfil do respondente: papel + área.
- Etapa 3 — Estruturas institucionais (7 itens: acolhimento, psicopedagógico, permanência, docência, dados, comunicação, protocolos crise) com 5 níveis de existência.
- Etapa 4 — Principais dores (seleção de 2 a 5 entre catálogo: saúde mental, evasão, formação docente, dados, adesão, etc.).
- Etapa 5 — Perguntas adaptativas (por dor selecionada — escala 0-100 ou segmentada Inicial→Consolidada).
- Etapa 6 — Radar de maturidade (6 dimensões, sliders 0-100).
- Etapa 7 — Priorização (urgência por dor: Baixa/Média/Alta/Imediata).
- Etapa 8 — Contato + consentimento LGPD.

**Melhorias UX/UI vs. protótipo:**
- Design tokens RBE (roxo/mint via `hsl()` do design system), tipografia Instrument Serif + Work Sans do projeto.
- Stepper vertical no desktop, horizontal colapsado no mobile, com progresso e auto-save por etapa (draft em `localStorage` + servidor).
- Micro-copy humanizado em PT-BR ("Como está o clima institucional?" em vez de rótulos técnicos).
- Componentes shadcn (Slider, Select, Card, Badge, Progress, Tooltip com "Como interpretar").
- Radar chart com Recharts (não canvas manual), responsivo, com tooltip por dimensão.
- Validação por etapa via zod + mensagens inline (não modal).
- Botão "Salvar e continuar depois" em todas as etapas.
- Página de resultado com storytelling: headline dinâmico → radar → leitura estratégica → 3 recomendações → CTA "Falar com a Rede".

**2. Visualização**
- **Admin (`/admin/radar-institucional`)**: lista de todas as instituições com radar preenchido, filtros (estado, tipo, dor prioritária, score de maturidade), abrir detalhes de qualquer radar, exportar CSV/PDF, dashboard agregado (dores mais frequentes, distribuição de respondentes, oportunidades — como as barras do protótipo).
- **Portal Institucional (nova aba "Radar" em `InstitutionPortal.tsx`)**: exibe o radar da própria instituição, permite editar/atualizar, mostra histórico de versões.
- **Preenchimento**: admin pode criar em nome de qualquer instituição; o próprio gestor institucional pode preencher pela aba Radar do portal (mesmo formulário).

**3. Persistência & IA**
- Nova tabela `institution_radar_diagnostics` (institution_id, versão, respostas JSON, scores calculados por dimensão, headline/insights gerados, status draft/submitted, respondente, timestamps).
- Edge Function `radar-institutional-analyze`: recebe respostas, calcula scores, gera headline + leitura estratégica + 3 recomendações via Lovable AI (Gemini). Persiste no registro.
- RLS: admins veem tudo; usuários institucionais só a própria instituição (via `institution_users`).
- Rascunhos versionados; submissão gera nova versão imutável + análise IA.

## Arquitetura técnica

**Rotas novas**
- `/portal-institucional/radar` (formulário + visualização do gestor)
- `/admin/radar-institucional` (lista + dashboard agregado)
- `/admin/radar-institucional/:id` (detalhe de uma resposta)

**Componentes principais**
- `src/components/radar/RadarForm.tsx` (stepper multi-etapa)
- `src/components/radar/steps/*` (um por etapa)
- `src/components/radar/RadarChart.tsx` (Recharts RadarChart)
- `src/components/radar/RadarResult.tsx` (headline + leitura + recomendações)
- `src/components/admin/RadarInstitutionalDashboard.tsx` (agregados)
- `src/pages/admin/RadarInstitutional.tsx`, `RadarInstitutionalDetail.tsx`
- `src/pages/institution/InstitutionRadar.tsx`
- `src/hooks/useInstitutionRadar.tsx`

**Catálogos**
- `src/data/radarCatalog.ts` — dores, dimensões de maturidade, estruturas, perguntas adaptativas, papéis (extraídos do HTML).

**Migração**
- Tabela `institution_radar_diagnostics` + GRANTs + RLS (admin_full, institution_own) + trigger `updated_at`.
- Enum `radar_status` (draft, submitted, archived).

**Edge Function**
- `supabase/functions/radar-institutional-analyze/index.ts` usando Lovable AI Gateway (Gemini 2.5 Flash), zod para validação, CORS.

## Perguntas em aberto (posso assumir defaults se preferir)

1. Instituições podem submeter múltiplas versões ao longo do tempo (histórico comparativo), ou só uma "atual" editável? — **Assumindo: histórico versionado com "atual" destacada.**
2. Convém expor o radar/resultado aos profissionais vinculados à instituição, ou apenas aos usuários institution_admin? — **Assumindo: apenas institution_admin + admin RBE.**
