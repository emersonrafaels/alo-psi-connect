# Diagnóstico — botão "Registrar pelo WhatsApp"

## O que está acontecendo

O link gerado no botão é tecnicamente válido:

```
https://wa.me/5511947994163?text=Olá%2C%20quero%20registrar%20meu%20diário%20emocional.
```

Quando você clica, o `wa.me` faz redirect interno para `api.whatsapp.com/send/?phone=5511947994163...`. O erro **`ERR_BLOCKED_BY_RESPONSE`** nessa URL não é problema de formato — é a resposta do próprio WhatsApp quando **o número informado não possui uma conta WhatsApp ativa** (ou está bloqueado/inválido na base deles).

Validei o número `+55 11 94799-4163`:
- Possui 11 dígitos (DDD 11 + 9 + 8 dígitos) — formato correto de celular BR
- Não há erro de digitação no código

Comparando com outros pontos do app que funcionam:
- `WhatsAppFloat`, `HomeRedeBemEstar` → `5511956850046` (outro número, este sim com conta WhatsApp ativa)

## Causa provável

O número **5511947994163 não tem conta WhatsApp ativa**, por isso o WhatsApp Web bloqueia a conversa. Não é algo que possa ser resolvido só com mudança de código/formato do link — qualquer link `wa.me`, Walink, ChatPro etc. cairá no mesmo bloqueio.

## Opções de solução

Escolha uma das três abaixo. Não vou alterar código até você decidir:

### Opção A — Ativar WhatsApp no número 11 94799-4163
1. Instalar WhatsApp (ou WhatsApp Business) no celular com esse chip
2. Concluir a verificação por SMS
3. Testar novamente o botão — funcionará automaticamente sem mudança no código

### Opção B — Trocar para outro número que já tem WhatsApp ativo
Trocar o número do botão para um já em uso, por exemplo o oficial da Rede Bem-Estar (`5511956850046`). Edição em uma linha:

- **Arquivo:** `src/pages/MoodDiary.tsx` (linha 398)
- **De:** `https://wa.me/5511947994163?text=...`
- **Para:** `https://wa.me/<NOVO_NUMERO>?text=...`

### Opção C — Conectar via Evolution API / n8n (sem depender de número humano)
Em vez de abrir conversa no WhatsApp Web, o botão poderia:
1. Disparar uma mensagem programática via Evolution API para o **número do próprio usuário**
2. O usuário responde no WhatsApp dele e o bot processa o registro

Isso exige configuração de webhook e fluxo n8n já existente no projeto. Caminho mais robusto e escalável, mas envolve mais trabalho.

## Recomendação

Para destravar agora: **Opção A** (ativar WhatsApp no chip) ou **Opção B** (apontar para um número que já funciona).

Me diga qual caminho seguir e, se for B, qual número usar.
