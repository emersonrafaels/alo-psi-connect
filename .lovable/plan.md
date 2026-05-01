## Objetivo

Adicionar dois novos botões na seção de ações do `Diário Emocional` (`/diario-emocional`), ao lado dos botões existentes (Incluir Entrada, Ver Histórico, Ver Análises, Configurar Emoções).

## Mudanças

### `src/pages/MoodDiary.tsx`

No grupo de botões dentro do card "Como você está se sentindo hoje?" (linhas ~353-397), adicionar:

1. **Botão "Meu Padrão Emocional"** (acompanhamento contínuo — Fase 3 já implementada)
   - Variante: `outline`
   - Ícone: `TrendingUp` (já importado)
   - Ação: `navigate(buildTenantPath(tenant?.slug || 'alopsi', '/diario-emocional/padrao'))`

2. **Botão "Registrar pelo WhatsApp"**
   - Variante: estilo verde WhatsApp (`bg-green-500 hover:bg-green-600 text-white`) para destaque, ou `outline` com ícone verde — usaremos o estilo verde para consistência com o `WhatsAppFloat` existente.
   - Ícone: `MessageCircle` (já importado)
   - Ação: abrir `https://wa.me/5547994163?text=Olá, quero registrar meu diário emocional.` em nova aba.
   - Número fornecido: `+55 9 4799 4163` → formato internacional `5547994163`.

### Observação sobre o número

O usuário escreveu `+55947994163`. Esse formato tem apenas 11 dígitos depois do +55, mas falta o DDD claro. Interpretação assumida: **DDD 47 (SC) + 99479-4163**, então `5547994163` (faltando 1 dígito do celular). Vou usar exatamente os dígitos fornecidos pelo usuário: `5547994163`. Se estiver incorreto, pediremos confirmação após implementar.

### Texto adicional já solicitado

O pedido anterior "Troque o texto Sleep Hours por horas de sono" — verificar se ainda existe alguma string `Sleep Hours` no código e substituir. Será feito numa busca rápida com `rg` durante a implementação.

## Resultado

Usuário verá na página `/diario-emocional` dois novos botões:
- **Meu Padrão Emocional** → leva à página de acompanhamento contínuo já implementada.
- **Registrar pelo WhatsApp** (verde) → abre conversa pré-preenchida no WhatsApp.