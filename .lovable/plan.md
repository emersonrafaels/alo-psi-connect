## Objetivo
Tornar configurável, por tenant, o **número de WhatsApp** e a **mensagem inicial** usados pelo botão "Registrar pelo WhatsApp" no diário emocional.

## Mudanças

### 1. Banco (migração)
Adicionar 2 colunas em `public.tenants`:
- `diary_whatsapp_number text` — número no formato `5511999999999`
- `diary_whatsapp_message text` — mensagem pré-preenchida (default: `Olá, quero registrar meu diário emocional`)

Sem alteração de RLS (a tabela já é lida publicamente para branding).

### 2. Admin — Configurações do Tenant
Em `src/components/admin/TenantConfigTabs.tsx`, dentro de `ContactConfigTab` (logo abaixo do campo WhatsApp), adicionar uma seção **"Diário Emocional — WhatsApp"** com:
- Input `diary_whatsapp_number` (com tooltip explicando que é o número do bot que recebe o diário)
- Textarea `diary_whatsapp_message` (mensagem inicial enviada quando o usuário clica no botão)

Incluir os dois campos em `TenantEditorModal.tsx` (`formData` inicial, carregamento no `useEffect`, reset e payload de save).

### 3. Tipo `Tenant`
Em `src/types/tenant.ts`, adicionar `diary_whatsapp_number?: string` e `diary_whatsapp_message?: string`.

### 4. Frontend — botão do diário
Em `src/pages/MoodDiary.tsx` (linha ~400), trocar a URL hard-coded por valores do tenant, com fallback para o número atual:

```ts
const diaryNumber = tenant?.diary_whatsapp_number || tenant?.contact_whatsapp || '5511947994163';
const diaryMessage = tenant?.diary_whatsapp_message || 'Olá, quero registrar meu diário emocional';
window.open(`https://wa.me/${diaryNumber}?text=${encodeURIComponent(diaryMessage)}`, '_blank');
```

## Fora de escopo
- Backend do bot de WhatsApp (mensagens recebidas continuam sendo tratadas fora deste projeto).
- Alterar o botão flutuante de contato (`contact_whatsapp`) — permanece separado.
