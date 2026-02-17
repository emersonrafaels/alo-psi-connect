

## Adicionar botao "Enviar Email de Teste" na configuracao de Emails BCC

### Objetivo

Adicionar um botao na tela de configuracao de Emails BCC que envia um email de teste simples para os emails cadastrados, permitindo validar se a configuracao esta funcionando corretamente.

### Mudancas

**`src/components/admin/config/EmailBccConfig.tsx`**

- Adicionar um botao "Enviar Email de Teste" abaixo da lista de emails BCC (visivel apenas quando ha emails cadastrados)
- Ao clicar, chamar a edge function `send-test-email` com tipo `newsletter_confirmation` (template simples) enviando para o primeiro email BCC da lista
- Usar o `effectiveTenantId` do `useAdminTenant` context para enviar com o tenant correto
- Adicionar estado de loading no botao durante o envio
- Exibir toast de sucesso/erro apos o envio
- Importar `Send` icon do lucide-react e `supabase` client

**Logica do botao:**
```text
const sendTestEmail = async () => {
  // Pegar tenantId do contexto admin
  // Chamar supabase.functions.invoke('send-test-email', {
  //   body: {
  //     emailType: 'newsletter_confirmation',
  //     recipientEmail: bccEmails[0],
  //     tenantId: effectiveTenantId,
  //     variables: { recipientName: 'Teste BCC' }
  //   }
  // })
  // Toast sucesso/erro
};
```

### Resumo

| Arquivo | Acao |
|---|---|
| `src/components/admin/config/EmailBccConfig.tsx` | Adicionar botao de envio de email de teste |

