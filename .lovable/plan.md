## Plano

### Objetivo
Substituir o número e a mensagem de fallback do botão **"Registrar pelo WhatsApp"** no Diário Emocional pelo número do bot cadastrado no tenant.

### Alteração
- **Arquivo:** `src/pages/MoodDiary.tsx`
- **Linha:** ~402-403
- **Mudança:**
  - Fallback de número: de `'5511947994163'` para `'5511937074332'`
  - Fallback de mensagem: de `'Olá, quero registrar meu diário emocional'` para `'Olá, quero registrar meu diário emocional'` (já está igual, mantém o padrão)

### Comportamento final
O botão continuará priorizando a configuração por tenant (`tenant.diary_whatsapp_number` / `tenant.diary_whatsapp_message`). Quando esses campos não estiverem preenchidos, passará a usar o número do bot real (`5511937074332`) em vez do número antigo de segurança.

### Validação
- Verificar se o arquivo compila sem erros.
- Confirmar que o link gerado aponta para `https://wa.me/5511937074332` quando não houver configuração de tenant.