

## Adicionar Barra de Rolagem Vertical no Modal de Atividade do Aluno

### Problema
O conteudo do modal (registros emocionais) ultrapassa a altura visivel mas nao mostra uma barra de rolagem, impedindo o usuario de ver todos os registros.

### Correcao

**Arquivo: `src/components/institution/StudentActivityModal.tsx`**

Duas mudancas:

1. **Linha 228** - Adicionar `overflow-hidden` ao `DialogContent` para evitar overflow externo:
   - De: `className="max-w-2xl max-h-[85vh] flex flex-col"`
   - Para: `className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"`

2. **Linha 256** - Trocar o `ScrollArea` com `style` inline por uma altura fixa via classe Tailwind e garantir `overflow-y-auto`:
   - De: `<ScrollArea className="flex-1 mt-3" style={{ maxHeight: 'calc(85vh - 180px)' }}>`
   - Para: `<ScrollArea className="flex-1 mt-3 h-0 min-h-0" style={{ maxHeight: 'calc(85vh - 180px)' }}>`

O truque e adicionar `h-0 min-h-0` ao `ScrollArea` para forcar o container flex a respeitar o `flex-1` e permitir que o `ScrollArea` do Radix renderize a barra de rolagem corretamente dentro do espaco disponivel.

