## Whitelist de emails para bypass de bloqueio por frequência das escalas

### 1. Configuração (system_configurations)
Reusar a tabela `system_configurations` com:
- `category`: `emotional_scales`
- `key`: `frequency_bypass_emails`
- `value`: JSON array de emails (ex.: `["alopsi.host@gmail.com"]`)
- `tenant_id`: null (global)

Não requer migration — a tabela já existe e segue o mesmo padrão usado em `PatientFullViewAccessConfig`.

### 2. Edge function `submit-scale-response`
Antes da verificação de frequência (linha ~89), buscar o array de emails e, se `user.email` estiver presente (case-insensitive), tratar como bypass — mesmo comportamento do `force + isAdmin`. Isso preserva o fluxo e mantém o registro do response normal.

### 3. UI de administração
Criar `src/components/admin/config/ScaleFrequencyBypassConfig.tsx`:
- Input para adicionar email + botão "Adicionar" (validação simples de formato)
- Lista de emails com botão remover
- Persiste via `supabase.from('system_configurations')` (upsert pelo padrão visto em `PatientFullViewAccessConfig`)

Registrar o card em `src/pages/admin/Configurations.tsx` na categoria `system` com:
- title: "Escalas: bypass de frequência"
- description: "Emails que podem responder escalas sem o bloqueio de 180 dias"
- icon: `Shield`
- `requiresSuperAdmin: true`

### Escopo
- Sem mudanças em schema, RLS ou outras escalas/severidades.
- Lista é case-insensitive, armazenada em lowercase.