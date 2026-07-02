## Alteração: cor do mascote Buddy

O SVG `src/assets/buddy/placeholder-buddy.svg` renderiza o Buddy com `fill="#000000"` (preto). A mudança consiste em trocar esse fill para a cor roxa `#5E35B1`, que já consta no gradiente do próprio SVG.

- Arquivo a editar: `src/assets/buddy/placeholder-buddy.svg`
- Alteração: linha `fill="#000000"` → `fill="#5E35B1"`

Nenhuma outra dependência ou arquivo precisa ser modificado; o componente `BuddyCharacter` apenas referencia o SVG via import estático.