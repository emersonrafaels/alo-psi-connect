## Objetivo
Eliminar a leitura/escrita pública na tabela `agendamento_tokens`, mantendo o fluxo de acesso ao agendamento por link (`/agendamento/:token`) funcionando.

## Situação atual
- Policies em `agendamento_tokens`:
  - `Tokens are accessible by token value` — SELECT, USING `true` (qualquer um lê todos os tokens + emails).
  - `Anyone can create tokens` — INSERT, WITH CHECK `true` (qualquer um insere).
- Criação real de tokens já ocorre via edge functions com service role (`send-magic-link`, `create-access-token`) — não precisam da policy pública.
- Leitura/uso de token pelo cliente acontece em `src/pages/AppointmentAccess.tsx`, que faz `select * from agendamento_tokens` e depois `update used=true` diretamente.

## Mudanças

### 1. Nova edge function `redeem-appointment-token` (verify_jwt = false)
Recebe `{ token }` e, com service role:
- Busca o token (não usado, não expirado).
- Carrega o agendamento associado e dados do profissional (mesmos campos que `AppointmentAccess` consome hoje).
- Valida que `tokenData.email === appointment.email_paciente`.
- Marca o token como `used = true`.
- Retorna o objeto `appointment` no mesmo formato usado pelo componente.
- Erros padronizados: `invalid_token`, `appointment_not_found`, `email_mismatch`.

### 2. Migração SQL
- `DROP POLICY "Tokens are accessible by token value" ON public.agendamento_tokens;`
- `DROP POLICY "Anyone can create tokens" ON public.agendamento_tokens;`
- Não criar policies novas — service role continua acessando normalmente (bypass de RLS). RLS continua ligada.
- Registrar `verify_jwt = false` para a nova função em `supabase/config.toml`.

### 3. Frontend `src/pages/AppointmentAccess.tsx`
- Substituir os dois acessos diretos a `agendamento_tokens` por uma única chamada `supabase.functions.invoke('redeem-appointment-token', { body: { token } })`.
- Tratar os códigos de erro retornados para preservar as mensagens atuais ("Token inválido ou expirado", "Agendamento não encontrado", "Token não corresponde ao agendamento").
- Restante do fluxo (criação de conta, magic link) permanece inalterado.

## Detalhes técnicos
- A função usa `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — segredo já disponível em todas as edge functions.
- CORS habilitado para chamadas a partir do navegador.
- Operação de "marcar como usado" usa `update ... where token = $1 and used = false` para evitar corrida.
- Nenhuma alteração em `send-magic-link`, `create-access-token` ou `delete-user-completely` (já operam com service role).

## Validação após implementação
- Abrir um link `/agendamento/:token` válido → continua exibindo o agendamento.
- Token expirado/usado → mensagem de erro adequada.
- `select` direto na tabela com a anon key passa a retornar 0 linhas.
