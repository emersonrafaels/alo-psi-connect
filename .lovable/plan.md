

## Corrigir emails de confirmacao para pacientes e profissionais

### Problemas identificados

Foram encontrados 4 problemas nos emails de confirmacao de cadastro:

1. **Dominio incorreto (APP_BASE_URL)**: 3 funcoes usam `Deno.env.get('APP_BASE_URL') || 'https://alopsi.com.br'` que resolve para `alopsi.com.br` em vez de `redebemestar.com.br`
2. **Subtitulo incorreto**: 3 funcoes usam "Conectando voce ao cuidado mental" em vez de "Conectando voce ao cuidado"
3. **Resend-email-confirmation nao detecta tipo de usuario**: A funcao `resend-email-confirmation` sempre envia como `isProfessional=false`, mesmo para profissionais
4. **Emails de abandono usam dominio errado**: Em `create-professional-profile`, emails de erro usam `noreply@alopsi.com.br` em vez de `noreply@redebemestar.com.br`

### Funcoes afetadas

| Funcao | baseUrl | Subtitulo | isProfessional | Remetente |
|--------|---------|-----------|----------------|-----------|
| create-patient-profile | alopsi.com.br | "cuidado mental" | false (OK) | OK |
| create-professional-profile | alopsi.com.br | "cuidado mental" | true (OK) | alopsi.com.br nos emails de abandono |
| resend-email-confirmation | alopsi.com.br | "cuidado mental" | false sempre (BUG) | OK |
| notify-institution-link | alopsi.com.br | N/A | N/A | N/A |

### Plano de correcao

**Arquivo 1: `supabase/functions/create-patient-profile/index.ts`**
- Linha 40: Alterar "cuidado mental" para "cuidado"
- Linha 400: Alterar `baseUrl` para `"https://redebemestar.com.br"` (sem APP_BASE_URL)

**Arquivo 2: `supabase/functions/create-professional-profile/index.ts`**
- Linha 242: Alterar "cuidado mental" para "cuidado"
- Linha 770: Alterar `baseUrl` para `"https://redebemestar.com.br"` (sem APP_BASE_URL)
- Linha 169: Alterar `noreply@alopsi.com.br` para `noreply@redebemestar.com.br` nos emails de abandono
- Linha 183: Alterar `notificacoes@alopsi.com.br` para `noreply@redebemestar.com.br` no email da equipe

**Arquivo 3: `supabase/functions/resend-email-confirmation/index.ts`**
- Linha 61: Alterar "cuidado mental" para "cuidado"
- Linha 225: Alterar `baseUrl` para `"https://redebemestar.com.br"` (sem APP_BASE_URL)
- Buscar `tipo_usuario` do perfil e passar `isProfessional` corretamente ao gerar o email

**Arquivo 4: `supabase/functions/notify-institution-link/index.ts`**
- Alterar `baseUrl` para `"https://redebemestar.com.br"` (sem APP_BASE_URL)

### Resultado esperado

- Pacientes recebem: "Bem-vindo ao [Tenant]!" + "Obrigado por se cadastrar!"
- Profissionais recebem: "Bem-vindo a nossa equipe!" + "Obrigado por se cadastrar como profissional!"
- Todos os links apontam para `redebemestar.com.br` com o path correto do tenant
- Subtitulo correto: "Conectando voce ao cuidado"
- Remetente sempre `noreply@redebemestar.com.br`
- Reenvio de confirmacao detecta automaticamente se e profissional ou paciente

### Deploy

Apos as alteracoes, deploy das 4 edge functions: `create-patient-profile`, `create-professional-profile`, `resend-email-confirmation`, `notify-institution-link`.

