## Objetivo

Ao concluir o preenchimento de um Radar Institucional (público ou vinculado), enviar um email para todos os administradores do site com um resumo do diagnóstico e link direto para visualização.

## O que será criado

**Nova Edge Function `notify-radar-submitted`** (segue o padrão de `notify-institution-action`, usando Resend + `noreply@redebemestar.com.br`).

Entrada: `{ diagnostic_id }`.

Fluxo:
1. Buscar o diagnóstico em `institution_radar_diagnostics` (respondente, instituição, `overall_score`, `headline`, top 3 dores, prioridades, `submission_source`, `public_access_token`).
2. Buscar emails dos administradores via `user_roles` (`role = 'admin'`) + join com `profiles.email`.
3. Montar email HTML com:
   - Instituição (nome vinculado ou `submitted_institution_name`) e badge "Pública" / "Vinculada".
   - Respondente (nome, cargo, email, telefone).
   - Score geral, headline da leitura estratégica.
   - Top 3 dores e top 3 prioridades.
   - **CTA "Ver diagnóstico completo"**:
     - Vinculado → `https://redebemestar.com.br/admin/radar-institucional/{id}`
     - Público → `https://redebemestar.com.br/radar-institucional/resultado/{token}` (e também o link admin acima).
4. Enviar via Resend (loop por destinatário para evitar vazamento de emails no `to`).

## Integrações (disparo)

- **`supabase/functions/radar-public-submit/index.ts`**: após o `insert` bem-sucedido, invocar `notify-radar-submitted` (fire-and-forget, dentro do try/catch existente).
- **`supabase/functions/radar-institutional-analyze/index.ts`**: ao finalizar a análise e marcar como `submitted`, invocar `notify-radar-submitted`. Assim o email leva o `headline` já gerado. (Se a análise falhar, o `radar-public-submit` também dispara como fallback com dados brutos.)
  - Para evitar duplicidade, adicionar uma flag simples: enviar apenas se `notified_at IS NULL`, e setar `notified_at = now()` após o envio.

## Alteração no banco

Migration adicionando coluna `notified_at TIMESTAMPTZ` em `institution_radar_diagnostics` para deduplicação de notificações.

## Fora de escopo

- Configuração por-tenant de destinatários (usa admins globais do site).
- Notificação para o próprio respondente (o fluxo público já mostra o resultado via token).
