## Objetivo

1. Consolidar todos os usuários e dados pessoais relacionados no tenant **Rede Bem Estar** (`472db0ac-0f45-4998-97da-490bc579efb1`), eliminando o uso paralelo do tenant **Medcos** (`3a9ae5ec-50a9-4674-b808-7735e5f0afb5`) para usuários — que está fazendo com que diários preenchidos via WhatsApp não apareçam na plataforma.
2. Validar que o Jayme Neto (`jayme18393@gmail.com`) e seus 2 diários emocionais foram migrados corretamente.
3. Melhorar a formatação visual do **Histórico de Insights** (preview cortado mostrando markdown cru, conforme print).

---

## 1. Migração de tenant (via migration SQL)

Estado atual no banco:

| Tabela | Em Medcos | Em Rede Bem Estar | Sem tenant |
|---|---|---|---|
| `profiles` | 24 | 39 | – |
| `mood_entries` | 35 | 997 | 1 |
| `whatsapp_profile_links` | 1 | – | – |
| `user_tenants` | (a verificar) | – | – |

Migration vai mover **todos** os registros das tabelas abaixo do tenant Medcos para o tenant Rede Bem Estar:

- `profiles.tenant_id`
- `user_tenants.tenant_id` (com tratamento de conflito por `unique(user_id, tenant_id)` — se já existir, apaga o duplicado)
- `mood_entries.tenant_id` (incluindo o registro com `tenant_id IS NULL` do Jayme)
- `mood_insight_analyses.tenant_id`
- `whatsapp_profile_links.tenant_id`
- `whatsapp_conversation_state.tenant_id`
- `whatsapp_reminder_preferences.tenant_id`
- `whatsapp_specialist_requests.tenant_id`
- `pacientes.tenant_id`

Tabelas **NÃO** movidas (não são "usuários", são dados de outras dimensões — institucional, profissional, conteúdo):
`blog_posts`, `agendamentos`, `group_sessions`, `group_session_theme_suggestions`, `institution_*`, `professional_tenants`, `email_test_logs`, `system_configurations`.

Se você preferir mover **literalmente tudo** (incluindo agendamentos, blog, sessões em grupo etc.), me avise antes de aprovar.

## 2. Verificação do Jayme Neto

Após a migração, rodar SELECTs para confirmar:

- `profiles` do `user_id=ceeef817-0d36-4efc-9d01-64c4c09acb2f` está em Rede Bem Estar.
- Os 2 `mood_entries` (datas 2026-05-01 e 2026-05-05) estão com `tenant_id` correto.
- O `whatsapp_profile_links` dele aponta para Rede Bem Estar.
- Aparecem na listagem de pacientes/diários da plataforma.

Reportar resultado no chat.

## 3. Formatação do Histórico de Insights

Arquivo: `src/components/InsightHistoryCard.tsx`

Hoje o **preview** (estado colapsado) renderiza `{insight.insight_content}` cru com `line-clamp-3`, exibindo `##`, `**`, `###` etc. (visível no print).

Mudanças:

- **Preview limpo**: criar helper `stripMarkdown(content)` que remove `#`, `*`, `_`, `>`, `-` de bullets e colapsa espaços, e usar no `line-clamp-3` em vez do conteúdo cru.
- **Cabeçalho do card**: trocar o `<div className="text-sm leading-relaxed line-clamp-3">` por um bloco com fundo leve (`bg-muted/30 rounded-md p-3`) e tipografia `text-foreground/80`, dando hierarquia visual entre preview e conteúdo expandido.
- **Conteúdo expandido**: já usa `<FormattedAIContent />` — manter, garantindo padding/separador entre data e conteúdo.
- **Data**: adicionar pequeno destaque (ícone com cor primary, texto `font-medium`) para casar com o restante da página de Análises.

Sem novas dependências.

### Detalhes técnicos

- `stripMarkdown` ficará inline no componente (função pura curta).
- Manter compatibilidade com feedback (likes/comentários) — sem mudanças funcionais.
- Migration SQL idempotente (`UPDATE ... WHERE tenant_id = 'medcos_id'`).
- Para `user_tenants`, usar `DELETE` dos pares já existentes em alopsi antes do `UPDATE` para evitar violar `unique(user_id, tenant_id)`.
