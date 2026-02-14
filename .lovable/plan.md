

## Tours Guiados com Highlight nos Elementos

### Objetivo

Transformar ambos os tours (Portal Institucional e Encontros) de simples modais centralizados para um estilo que destaca visualmente os elementos-alvo na pagina, com um tooltip/popover posicionado proximo ao elemento em destaque. Tambem adicionar o botao de reiniciar tour na pagina de Encontros.

### Como funciona o highlight

Cada passo do tour que possui um `target` (seletor CSS como `[data-tour="sessions-tabs"]`) ira:

1. Localizar o elemento na pagina via `document.querySelector(target)`
2. Aplicar um overlay escuro sobre toda a pagina, exceto sobre o elemento-alvo (efeito "spotlight")
3. Posicionar o card do tour (titulo, descricao, botoes) proximo ao elemento destacado
4. Para passos sem `target` (como "welcome"), manter o card centralizado na tela

### Arquivos a criar

**1. `src/components/ui/tour-overlay.tsx`**

Componente reutilizavel que renderiza:
- Um overlay escuro (backdrop) com um "recorte" transparente sobre o elemento-alvo
- Um card flutuante posicionado automaticamente (abaixo ou acima do elemento) contendo titulo, descricao, barra de progresso e botoes de navegacao
- Usa `getBoundingClientRect()` para calcular posicao e `ResizeObserver`/scroll listener para reposicionar dinamicamente
- Aplica `z-index` alto no elemento-alvo para que fique acima do overlay

### Arquivos a modificar

**2. `src/components/group-sessions/GroupSessionsTour.tsx`**

Substituir o Dialog pelo novo componente `TourOverlay`, passando os mesmos props (step, next, prev, skip, progress).

**3. `src/components/institution/InstitutionTour.tsx`**

Mesma mudanca: substituir Dialog pelo `TourOverlay`.

**4. `src/pages/MyGroupSessions.tsx`**

Adicionar o botao com icone `Compass` ao lado do titulo "Encontros" (igual ao portal institucional) para chamar `tour.resetTour()`. Importar `Compass` do lucide-react e usar o `resetTour` que ja esta disponivel no hook.

### Detalhes tecnicos do TourOverlay

```
+----------------------------------+
|          OVERLAY ESCURO          |
|                                  |
|    +------------------------+    |
|    |   ELEMENTO DESTACADO   |    |  <-- recorte transparente
|    +------------------------+    |
|         |                        |
|    +----v-------------------+    |
|    | Passo 2 de 5           |    |
|    | Navegacao por Abas     |    |  <-- card flutuante
|    | Alterne entre...       |    |
|    | [Pular] [Ant] [Prox]   |    |
|    +------------------------+    |
|                                  |
+----------------------------------+
```

Logica de posicionamento:
- Calcula rect do elemento-alvo com `getBoundingClientRect()`
- Se ha espaco abaixo (> 250px), posiciona card abaixo; senao, acima
- Faz scroll suave ate o elemento se nao estiver visivel (`scrollIntoView`)
- Overlay usa SVG ou box-shadow para criar o efeito de recorte
- Abordagem com `box-shadow` no spotlight: `box-shadow: 0 0 0 9999px rgba(0,0,0,0.6)` aplicado no proprio "recorte"

Estrutura do componente:
- Portal renderizado no body
- Div de overlay com pointer-events
- Div de spotlight posicionada sobre o elemento-alvo (sem pointer-events, com border-radius e box-shadow enorme)
- Card absoluto posicionado relativo ao spotlight
- Animacao de transicao entre passos

### Resumo de mudancas

| Arquivo | Acao |
|---------|------|
| `src/components/ui/tour-overlay.tsx` | Criar componente reutilizavel de tour com highlight |
| `src/components/group-sessions/GroupSessionsTour.tsx` | Usar TourOverlay ao inves de Dialog |
| `src/components/institution/InstitutionTour.tsx` | Usar TourOverlay ao inves de Dialog |
| `src/pages/MyGroupSessions.tsx` | Adicionar botao Compass para reiniciar tour |
