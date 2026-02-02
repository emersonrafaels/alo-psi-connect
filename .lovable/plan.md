

## Plano: Corrigir Emails de Pós-Cadastro + Cópia para Admin do Tenant

### Diagnóstico

Os emails de confirmação de cadastro não estão chegando porque as edge functions usam o `admin_email` (Gmail) como remetente, mas o Resend só aceita domínios verificados.

| Edge Function | Remetente Atual | Status |
|---------------|-----------------|--------|
| `create-patient-profile` | `redebemestar1@gmail.com` | FALHA |
| `create-professional-profile` | `medcos.host@gmail.com` | FALHA |
| `resend-email-confirmation` | `redebemestar1@gmail.com` | FALHA |

### Solução Completa

1. **Remetente**: Usar `noreply@redebemestar.com.br` (domínio verificado)
2. **Cópia para Admin**: Adicionar `admin_email` do tenant como BCC

```javascript
// ANTES (não funciona)
from: `${tenantName} <${tenantData.admin_email}>`
// Sem cópia para admin

// DEPOIS (funciona)
from: `${tenantName} <noreply@redebemestar.com.br>`
bcc: [tenantData.admin_email] // Admin recebe cópia
```

### Mapeamento de Admins por Tenant

| Tenant | Admin Email (BCC) |
|--------|-------------------|
| alopsi (Rede Bem Estar) | `redebemestar1@gmail.com` |
| medcos | `medcos.host@gmail.com` |

### Arquivos a Modificar

#### 1. `create-patient-profile/index.ts`

**Linhas ~403-421** - Adicionar BCC no envio de email:

```javascript
console.log('📧 Sending confirmation email:', {
  tenant: normalizedTenantName,
  from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
  to: email,
  bcc: tenantData.admin_email || null, // Cópia para admin
});

const emailResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
    to: [email],
    bcc: tenantData.admin_email ? [tenantData.admin_email] : [], // Cópia para admin
    subject: `Confirme seu email - ${normalizedTenantName}`,
    html: emailHtml,
  }),
});
```

#### 2. `create-professional-profile/index.ts`

**Linhas ~777-803** - Adicionar BCC no envio de email:

```javascript
console.log('📧 Email details:', {
  from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
  to: profileData.email,
  bcc: tenant.admin_email || null, // Cópia para admin
});

const emailResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
    to: [profileData.email],
    bcc: tenant.admin_email ? [tenant.admin_email] : [], // Cópia para admin
    subject: `Confirme seu email - ${normalizedTenantName}`,
    html: emailHtml,
  }),
});
```

#### 3. `resend-email-confirmation/index.ts`

**Linhas ~228-250** - Adicionar BCC no reenvio:

```javascript
console.log('📧 Email confirmation details:', {
  tenant: normalizedTenantName,
  from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
  to: email,
  bcc: tenantData.admin_email || null, // Cópia para admin
});

const emailResponse = await resend.emails.send({
  from: `${normalizedTenantName} <noreply@redebemestar.com.br>`,
  to: [email],
  bcc: tenantData.admin_email ? [tenantData.admin_email] : [], // Cópia para admin
  subject: `Confirme seu email - ${normalizedTenantName}`,
  html: emailHtml,
});
```

### Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `create-patient-profile/index.ts` | Remetente verificado + BCC admin |
| `create-professional-profile/index.ts` | Remetente verificado + BCC admin |
| `resend-email-confirmation/index.ts` | Remetente verificado + BCC admin |

### Fluxo Final

```text
Novo Cadastro (Rede Bem Estar)
├── Email enviado DE: "Rede Bem Estar <noreply@redebemestar.com.br>"
├── Email enviado PARA: usuario@email.com
└── Cópia BCC PARA: redebemestar1@gmail.com ✅

Novo Cadastro (MEDCOS)
├── Email enviado DE: "MEDCOS <noreply@redebemestar.com.br>"
├── Email enviado PARA: usuario@email.com
└── Cópia BCC PARA: medcos.host@gmail.com ✅
```

### Resultado Esperado

- Emails de confirmação chegam aos usuários
- Cada admin de tenant recebe cópia (BCC) dos cadastros da sua plataforma
- Remetente usa domínio verificado (funciona com Resend)
- Isolamento entre tenants mantido (admin do MEDCOS não vê cadastros da Rede Bem Estar)

