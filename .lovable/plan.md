## Correção do botão "Registrar pelo WhatsApp"

**Problema**: O número `5547994163` está incompleto/inválido, fazendo o WhatsApp Web bloquear a conexão (`ERR_BLOCKED_BY_RESPONSE`).

**Solução**: Atualizar o link em `src/pages/MoodDiary.tsx` (linha 398) para usar o número correto fornecido:

- De: `https://wa.me/5547994163?text=...`
- Para: `https://wa.me/5511947994163?text=Olá, quero registrar meu diário emocional.`

Mantém o formato `wa.me` (mais confiável e não bloqueado por extensões) e a mensagem pré-preenchida.

Nenhuma outra alteração necessária.