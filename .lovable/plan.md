## Objetivo
Adicionar um modo de maximizar (lightbox fullscreen) às imagens explicativas das escalas e do ISEU-RBE, permitindo que o usuário amplie a imagem para visualização detalhada.

## Escopo
- Modificar apenas o componente `ScaleExplainerDialog`.
- Não alterar dados, hooks, páginas ou backend.

## Como será feito
1. **Estado de maximização:** Adicionar estado `isMaximized` dentro do `ScaleExplainerDialog`.
2. **Toggle na interface:** Incluir um botão com ícone `Maximize2` no cabeçalho, ao lado do título, para ativar/desativar o modo fullscreen. Ao maximizar, o botão muda para `Minimize2`.
3. **Layout lightbox fullscreen:**
   - Quando `isMaximized === true`, o conteúdo do diálogo ocupa `max-w-[95vw] max-h-[95vh]`, centralizado, com fundo do diálogo em branco/cartão e overlay escuro padrão do Radix.
   - A imagem é exibida com `max-h-[85vh] object-contain` para aproveitar a tela sem cortar.
   - Cabeçalho e rodapé permanecem visíveis, mas compactos.
4. **Interações:**
   - Clicar na imagem também alterna o modo maximizar.
   - Pressionar `Esc` quando maximizado volta ao tamanho normal (e uma segunda `Esc` fecha o diálogo, comportamento padrão do Radix Dialog).
   - Cursor `zoom-in`/`zoom-out` ao passar sobre a imagem para indicar ação.
5. **Acessibilidade:** Manter `alt` descritivo e botões com `aria-label`.

## Arquivos envolvidos
- `src/components/scales/ScaleExplainerDialog.tsx` (edição)

## Fora do escopo
- Não alterar o diálogo base em `src/components/ui/dialog.tsx`.
- Não adicionar zoom/pan de imagem (apenas maximizar o diálogo).
- Não mudar as URLs das imagens explicativas.