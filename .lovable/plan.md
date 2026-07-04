## Objetivo
Corrigir o Buddy para que o conteúdo não seja cortado em mobile/tablet, sem depender de esconder overflow horizontal. A solução deve fazer o layout encolher e quebrar texto corretamente em vez de simplesmente ocultar o que passa da tela.

## Plano de ajuste

1. **Remover o mascaramento que esconde o problema**
   - Trocar `overflow-x-clip` no layout do Buddy por uma estratégia segura de largura (`w-full`, `max-w-full`, `min-w-0`) nos containers reais.
   - Isso evita que textos, botões e cards sejam cortados sem possibilidade de rolagem.

2. **Reorganizar o layout mobile do topo do Buddy**
   - Reduzir paddings laterais no menor breakpoint.
   - Garantir que o título tenha largura real disponível e quebre em múltiplas linhas.
   - Aplicar `min-w-0`, `max-w-full`, `whitespace-normal`, `break-words`/`overflow-wrap:anywhere` nos blocos de título, descrição e conteúdo dinâmico.

3. **Corrigir o card principal da tela `/buddy`**
   - Ajustar o card do resumo para nunca ultrapassar a largura da viewport.
   - No mobile, transformar a fala do Buddy em layout vertical ou mais compacto quando a largura for pequena, em vez de manter mascote + balão lado a lado ocupando espaço demais.
   - Ajustar o balão para ocupar `max-w-full`, sem `overflow-hidden` cortando texto.

4. **Ajustar botões e CTAs longos**
   - Fazer botões em mobile quebrarem texto internamente ou ficarem em linhas separadas com largura total.
   - Remover qualquer combinação de ícone + texto que force largura maior que o card.
   - Garantir altura/tamanho de toque adequado sem estourar horizontalmente.

5. **Revisar navegação horizontal do Buddy**
   - Manter a navegação em scroll horizontal no mobile, mas deixar claro que ela rola e impedir que os fades/containers escondam conteúdo principal.
   - Garantir que o nav não aumente a largura do layout pai.

6. **Aplicar a mesma base responsiva nas subtelas do Buddy**
   - `/buddy/me-conhecer`: revisar stepper, barra inferior sticky e cards de perguntas.
   - `/buddy/como-te-conhece`: revisar cabeçalhos, botões e textos gerados.
   - `/buddy/padroes`: revisar métricas, seletor de período e cards de listas.
   - `/buddy/privacidade`, `/buddy/jornada`, `/buddy/pontos-de-forca`: aplicar a mesma proteção de largura e quebra de texto onde houver conteúdo dinâmico.

7. **Validação visual obrigatória**
   - Testar com Playwright em 360px, 390px, 768px e desktop.
   - Verificar `document.documentElement.scrollWidth <= window.innerWidth` em cada rota.
   - Capturar screenshots das telas principais para confirmar que nada está cortado, especialmente com nome longo como “Carta Consulta - Paciente”.

## Detalhes técnicos
- Priorizar correção de causa raiz: `min-w-0`, `max-w-full`, grids seguros e quebra real de texto.
- Evitar `overflow-x-hidden/clip` como solução principal.
- Usar classes responsivas existentes do Tailwind e tokens semânticos do design system.
- Não alterar lógica do Buddy, dados, Supabase ou geração de insights; apenas layout, tipografia e responsividade.