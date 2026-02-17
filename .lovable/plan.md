
## Configuracao de Emails BCC por Tenant

### Objetivo

Criar uma configuracao no painel admin que permita definir um ou mais emails para serem copiados em oculto (BCC) em todos os emails enviados pela plataforma, separado por tenant (Rede Bem Estar e MEDCOS).

### Mudancas

**1. Novo componente: `src/components/admin/config/EmailBccConfig.tsx`**

Componente de configuracao admin que:
- Usa o hook `useSystemConfig` com categoria `email_bcc`
- Permite adicionar/remover emails BCC em um campo de texto (separados por virgula ou um por linha)
- Salva na tabela `system_configurations` com `category: 'email_bcc'` e `key: 'bcc_recipients'`, valor como array JSON de emails
- Respeita o tenant selecionado no `AdminTenantSelector` (cada tenant tem sua propria lista)
- Exibe os emails cadastrados como badges removiveis
- Validacao basica de formato de email

**2. Modificar: `src/pages/admin/Configurations.tsx`**

- Importar `EmailBccConfig`
- Adicionar card na categoria "Sistema e Integracoes" com icone `Mail`, titulo "Emails BCC" e descricao "Gerencie emails copiados em oculto nos envios"

**3. Nova funcao compartilhada: `supabase/functions/_shared/get-bcc-emails.ts`**

Funcao utilitaria que:
- Recebe um `tenantId` e um client Supabase
- Consulta `system_configurations` onde `category = 'email_bcc'` e `key = 'bcc_recipients'` e `tenant_id = tenantId`
- Retorna array de emails ou array vazio
- Usada por todas as edge functions que enviam email

**4. Modificar edge functions de envio de email**

Atualizar as seguintes edge functions para importar `get-bcc-emails.ts` e incluir os emails BCC em cada `resend.emails.send()`:

| Edge Function | Emails enviados |
|---|---|
| `send-contact-email` | Email para admin + confirmacao para usuario |
| `send-appointment-notification` | Notificacao interna, profissional e paciente |
| `send-group-session-notification` | Confirmacao de inscricao, lembretes |
| `create-patient-profile` | Email de confirmacao |
| `create-professional-profile` | Email de confirmacao |
| `resend-email-confirmation` | Reenvio de confirmacao |
| `newsletter-signup` | Confirmacao + notificacao admin |
| `notify-institution-link` | Notificacao de vinculacao |
| `request-institution-link` | Solicitacao de vinculacao |
| `send-password-reset` | Reset de senha |
| `notify-booking-status` | Status de agendamento |
| `auto-cancel-unpaid-appointments` | Cancelamento automatico |
| `suggest-session-theme` | Sugestao de tema |

A logica em cada function sera:
```text
import { getBccEmails } from "../_shared/get-bcc-emails.ts";

// Dentro do handler, apos obter tenantId:
const bccEmails = await getBccEmails(supabase, tenantId);

// Em cada resend.emails.send():
await resend.emails.send({
  from: ...,
  to: [...],
  bcc: bccEmails.length > 0 ? bccEmails : undefined,
  subject: ...,
  html: ...
});
```

### Detalhes tecnicos

Estrutura de dados na `system_configurations`:
```text
category: "email_bcc"
key: "bcc_recipients"
value: '["email1@example.com", "email2@example.com"]'
tenant_id: "<uuid do tenant>"
```

O componente `EmailBccConfig` usara o mesmo padrao dos outros componentes de configuracao (ex: `NewsletterSubscribersConfig`, `SystemConfig`), aproveitando o `useSystemConfig` que ja suporta multi-tenant via `AdminTenantSelector`.

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/components/admin/config/EmailBccConfig.tsx` | Criar - UI de gestao de emails BCC |
| `src/pages/admin/Configurations.tsx` | Modificar - adicionar card de EmailBccConfig |
| `supabase/functions/_shared/get-bcc-emails.ts` | Criar - funcao compartilhada para buscar BCCs |
| `supabase/functions/send-contact-email/index.ts` | Modificar - incluir BCC |
| `supabase/functions/send-appointment-notification/index.ts` | Modificar - incluir BCC |
| `supabase/functions/send-group-session-notification/index.ts` | Modificar - incluir BCC |
| `supabase/functions/create-patient-profile/index.ts` | Modificar - incluir BCC |
| `supabase/functions/create-professional-profile/index.ts` | Modificar - incluir BCC |
| `supabase/functions/resend-email-confirmation/index.ts` | Modificar - incluir BCC |
| `supabase/functions/newsletter-signup/index.ts` | Modificar - incluir BCC |
| `supabase/functions/notify-institution-link/index.ts` | Modificar - incluir BCC |
| `supabase/functions/request-institution-link/index.ts` | Modificar - incluir BCC |
| `supabase/functions/send-password-reset/index.ts` | Modificar - incluir BCC |
| `supabase/functions/auto-cancel-unpaid-appointments/index.ts` | Modificar - incluir BCC |
| `supabase/functions/suggest-session-theme/index.ts` | Modificar - incluir BCC |
