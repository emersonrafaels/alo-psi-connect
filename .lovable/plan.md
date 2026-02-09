

## Plano: Notificacoes e Comunicacao para Encontros em Grupo

### Visao Geral

Implementar um sistema completo de notificacoes por email para o ciclo de vida dos encontros em grupo, reutilizando a infraestrutura ja existente (Resend, tenant branding, email `noreply@redebemestar.com.br`).

---

### Fase 1 -- Email de Confirmacao de Inscricao

Quando um participante se inscreve em um encontro, enviar email automatico com:
- Nome e descricao do encontro
- Data, horario e duracao
- Link do Google Meet (se disponivel)
- Link do grupo do WhatsApp (se disponivel)
- Nome do facilitador/organizador
- Botao para cancelar inscricao

**Implementacao:**

| Item | Descricao |
|------|-----------|
| Edge Function | Criar `send-group-session-notification/index.ts` usando Resend com branding do tenant |
| Hook | Chamar a edge function no `onSuccess` do `registerMutation` em `useGroupSessionRegistration.tsx` |
| Template | HTML responsivo com dados da sessao, links e branding dinamico |

---

### Fase 2 -- Lembrete Automatico (24h e 1h antes)

Enviar lembretes automaticos para todos os inscritos confirmados antes do inicio da sessao.

**Implementacao:**

| Item | Descricao |
|------|-----------|
| Edge Function | Criar `remind-group-session/index.ts` que busca sessoes proximas e envia lembretes |
| Cron Job | Agendar via `pg_cron` a cada 30 minutos para verificar sessoes nas proximas 24h e 1h |
| Controle | Adicionar coluna `reminder_24h_sent` e `reminder_1h_sent` (boolean) na tabela `group_session_registrations` para evitar duplicatas |

**Migracao SQL:**
```sql
ALTER TABLE group_session_registrations
  ADD COLUMN IF NOT EXISTS reminder_24h_sent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent boolean DEFAULT false;
```

---

### Fase 3 -- Notificacao ao Facilitador sobre Status da Sessao

Informar o facilitador quando sua sessao for aprovada ou rejeitada pelo admin.

**Implementacao:**

| Item | Descricao |
|------|-----------|
| Edge Function | Reutilizar `send-group-session-notification/index.ts` com tipo de evento `session_approved` ou `session_rejected` |
| Trigger | Chamar a notificacao no componente `PendingSessionsApproval.tsx` apos a acao de aprovar/rejeitar |
| Conteudo | Incluir notas de revisao (`review_notes`) quando houver rejeicao |

---

### Fase 4 -- Notificacao de Cancelamento de Sessao

Quando um admin ou facilitador cancela uma sessao, notificar todos os inscritos.

**Implementacao:**

| Item | Descricao |
|------|-----------|
| Edge Function | Reutilizar a mesma function com tipo `session_cancelled` |
| Busca | Consultar todos os registros com `status = 'confirmed'` para a sessao cancelada |
| Conteudo | Motivo do cancelamento e sugestao de proximos encontros |

---

### Fase 5 -- Notificacao pos-Encontro (Follow-up)

Enviar email apos o encontro com agradecimento e link para proximos eventos.

**Implementacao:**

| Item | Descricao |
|------|-----------|
| Cron Job | Verificar sessoes finalizadas (data passou) e enviar follow-up |
| Controle | Adicionar coluna `followup_sent` (boolean) na tabela `group_session_registrations` |
| Conteudo | Agradecimento, link para pagina de encontros, convite para newsletter |

---

### Arquitetura da Edge Function Central

Uma unica edge function `send-group-session-notification` que recebe um `event_type` e despacha o template correto:

```text
event_type:
  registration_confirmed  --> Email para participante
  registration_cancelled  --> Email para participante
  session_approved        --> Email para facilitador
  session_rejected        --> Email para facilitador
  session_cancelled       --> Email para todos os inscritos
  reminder_24h            --> Email para inscritos
  reminder_1h             --> Email para inscritos
  followup                --> Email para inscritos que participaram
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/send-group-session-notification/index.ts` | Criar -- Edge function central de notificacoes |
| `src/hooks/useGroupSessionRegistration.tsx` | Editar -- Chamar notificacao apos inscricao |
| `src/components/admin/PendingSessionsApproval.tsx` | Editar -- Chamar notificacao apos aprovar/rejeitar |
| `supabase/functions/remind-group-session/index.ts` | Criar -- Cron de lembretes |
| Migracao SQL | Criar -- Adicionar colunas de controle de envio |
| `supabase/config.toml` | Editar -- Registrar novas edge functions |

### Dependencias

- Secret `RESEND_API_KEY` ja esta configurada
- Dominio `redebemestar.com.br` ja esta verificado no Resend
- Infraestrutura de tenant branding ja existe

### Ordem de Implementacao Sugerida

1. Fase 1 (confirmacao de inscricao) -- impacto imediato para usuarios
2. Fase 3 (status do facilitador) -- essencial para o workflow de aprovacao
3. Fase 4 (cancelamento) -- protege a experiencia do usuario
4. Fase 2 (lembretes) -- reduz no-show
5. Fase 5 (follow-up) -- engajamento e retencao

