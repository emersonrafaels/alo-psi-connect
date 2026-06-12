## Objetivo

Criar área de **Escalas Emocionais** baseada no pack ISEU-RBE: listagem, resposta, histórico longitudinal por usuário e cálculo do índice composto. Frequência: 1x a cada 6 meses por escala. Acesso: qualquer usuário logado.

## Escalas incluídas (pack essencial)

| Escala | Itens | Faixa | Peso ISEU |
|---|---|---|---|
| WHO-5 (Bem-estar) | 5 | 0–5 | 20% (positivo) |
| PHQ-9 (Depressão) | 9 | 0–3 | 18% (invertido) |
| GAD-7 (Ansiedade) | 7 | 0–3 | 13,5% (invertido) |
| PSS-10 (Estresse) | 10 | 0–4 | 13,5% (invertido) |
| ISI (Insônia) | 7 | 0–4 | 10% (invertido) |

Os 25% restantes do ISEU-RBE (sono/atividade/social) ficam para fase 2; o índice é normalizado pelos pesos disponíveis e exibido como 0–100.

## Backend (Supabase)

Novas tabelas:

1. **`emotional_scales`** — catálogo
   - `code` (WHO5, PHQ9, GAD7, PSS10, ISI), `name`, `description`, `instructions`, `item_min`, `item_max`, `reverse_items` (int[]), `frequency_days` (180), `active`
2. **`emotional_scale_items`** — perguntas
   - `scale_id`, `order`, `text`, `option_labels` (jsonb)
3. **`emotional_scale_responses`** — **histórico completo**, append-only
   - `user_id`, `scale_id`, `answers` (jsonb), `raw_score`, `normalized_score` (0–100 saúde), `severity`, `taken_at`
   - Nunca sobrescreve respostas: cada submissão gera nova linha, mesmo dentro da janela de 6 meses (admin pode liberar refazer). Índice em `(user_id, scale_id, taken_at desc)` para séries temporais rápidas.
4. **`iseu_scores`** — **histórico do índice composto**, append-only
   - `user_id`, `score` (0–100), `band` (verde/amarelo/laranja/vermelho), `components` (jsonb com snapshot de cada escala usada), `computed_at`
   - Nova linha a cada recálculo, permitindo gráfico de evolução.

RLS: cada usuário lê/insere apenas o próprio histórico (sem UPDATE/DELETE para preservar a série); admin lê todos. Catálogo: leitura para `authenticated`, escrita só admin. GRANTs adequados em todas as tabelas.

Seed: migration popula as 5 escalas com itens em PT-BR e `reverse_items` corretos (ex.: PSS-10 itens 4,5,7,8).

Função `compute_iseu_score(_user_id)` (SECURITY DEFINER): pega a resposta **mais recente** de cada escala do pack nos últimos 180 dias, aplica fórmula ISEU-RBE normalizada, insere nova linha em `iseu_scores` (não faz upsert) e retorna o score. Chamada após cada submissão.

Edge function `submit-scale-response`:
- Valida JWT e payload com zod.
- Bloqueia nova resposta se já houver uma da mesma escala nos últimos 180 dias (regra de frequência), exceto se `force=true` com role admin.
- Calcula `raw_score`/`normalized_score`/`severity`, **insere nova linha** em `emotional_scale_responses` (histórico preservado).
- Chama `compute_iseu_score` para registrar novo ponto na série do ISEU.

## Frontend

Rotas novas (sob tenant slug):
- `/escalas` — lista das 5 escalas; cada card mostra nome, tempo estimado, status ("Disponível" / "Próxima em X dias"), último resultado e data.
- `/escalas/:code` — formulário Likert, envia e exibe resultado + interpretação + comparação com aplicação anterior.
- `/minhas-emocoes` — **histórico longitudinal**:
  - Gráfico de linha do ISEU-RBE ao longo do tempo (recharts).
  - Gráfico/sparkline por escala mostrando evolução do `normalized_score`.
  - Tabela cronológica com todas as aplicações: data, escala, score, severidade, variação vs. anterior (↑/↓/=).
  - Filtro por escala e por período.

Hooks:
- `useEmotionalScales()` — catálogo + última resposta do usuário por escala.
- `useScaleResponseHistory(scaleCode?)` — série completa (todas as submissões).
- `useIseuHistory()` — série temporal de `iseu_scores`.
- `useSubmitScaleResponse()` — mutação chamando a edge function.

Componentes:
- `ScaleCard`, `LikertQuestion`, `ScaleResultPanel`, `IseuTrendChart`, `ScaleEvolutionChart`, `IseuBandBadge`, `ScaleHistoryTable`.

## Header / Menu do usuário

Em `src/components/ui/header.tsx`, adicionar item **"Minhas Emoções"** (ícone `HeartPulse`) no dropdown desktop e no menu mobile, após "Meus Encontros". Visível para qualquer `user` logado. Rota → `buildTenantPath(tenantSlug, '/minhas-emocoes')`.

## Estilo visual

Tokens semânticos do projeto (sem hex hardcoded). Cards `bg-card`, `rounded-2xl`, sombra suave. Bandas ISEU: verde=`--success`, amarelo=`--warning`, laranja=`--chart-4`, vermelho=`--destructive`. HTML enviado serve apenas como referência de conteúdo e fórmula, não de estilo.

## Out of scope

- Escalas complementares (PANAS, EBES, AUDIT, C-SSRS) — fase 2.
- Notificações automáticas de "próxima escala disponível".
- Dashboard institucional agregando ISEU por instituição.
