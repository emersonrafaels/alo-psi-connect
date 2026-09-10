# Roda das emoções: abrir a intensidade só no terceiro nível

Dois ajustes na etapa "Perceber" da jornada.

## 1. Modal apenas depois do terceiro nível

Hoje, ao clicar em uma palavra do segundo nível (por exemplo "Ameaçado"), a janela de intensidade abre imediatamente, impedindo a pessoa de ver as palavras mais específicas (Inseguro, Ciumento).

Passa a funcionar assim:

- Clicar em uma palavra do segundo nível que tenha palavras filhas apenas abre esse terceiro nível na roda — nenhuma janela aparece.
- A janela de intensidade abre só ao clicar em uma palavra do terceiro nível.
- Palavras do segundo nível sem desdobramento continuam abrindo a janela direto (comportamento correto hoje).
- A busca e a lista completa continuam abrindo a janela direto, porque ali a escolha já é da palavra final.

## 2. "Explorar outra emoção" vira "Adicionar outra emoção"

Hoje esse texto é apenas uma etiqueta informativa no painel lateral, sem ação. Passa a ser um botão de verdade, com o texto "Adicionar outra emoção", que devolve a pessoa à roda (voltando ao início dos níveis) e rola a página até ela, pronta para escolher a próxima palavra. Continua oculto quando já existem três emoções registradas.

## Detalhes técnicos

- `src/features/jornada/v5/reducer.ts`: em `SELECT_LEVEL2`, definir `pendingEmotionId` somente quando o nó não tiver `children` (consultando `getEmotionNode`/taxonomia); caso contrário apenas atualizar `level2Id`. `SELECT_LEVEL3` segue igual.
- `src/features/jornada/v5/copy.ts`: `perceive.exploreAnother` → "Adicionar outra emoção".
- `src/features/jornada/v5/components/PerceiveSidebar.tsx`: trocar o `Badge` por um `Button` (variant outline, ícone `Plus`) com novo callback `onAddAnother`.
- `src/features/jornada/v5/JornadaEmocionalV5.tsx`: passar `onAddAnother` que dispara `BACK_TO_WHEEL` + `BACK_LEVEL` (reset até a família) e rola até a roda via ref.
- Validar com Playwright: clicar em "Raiva" → "Ameaçado" (sem modal, terceiro nível visível) → "Inseguro" (modal abre) → registrar → usar "Adicionar outra emoção" e registrar a segunda; conferir console limpo em desktop e mobile.
