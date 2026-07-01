## Modernizar página "Como o Buddy te conhece"

Redesenhar `src/pages/buddy/BuddyKnows.tsx` com estética mais moderna, gráfico chamativo e labels em português.

### 1. Header modernizado
- Substituir título simples por hero com gradiente sutil (usando tokens do design system), badge "Powered by IA" e ícone animado do Buddy
- Adicionar métricas rápidas no topo (score de bem-estar, estabilidade, sono, consistência) em cards compactos com barras de progresso

### 2. Gráfico "Mapa de conhecimento" (foco principal)
Substituir o SVG estático atual por uma visualização moderna com:
- **Núcleo central pulsante** com gradiente radial (do primary ao primary-glow) e halo animado
- **Nós orbitais** dimensionados pelo `weight` (raio proporcional), com gradiente e sombra colorida
- **Linhas conectoras** com gradiente e opacidade variando pelo peso
- **Animação suave**: rotação lenta contínua + hover destaca o nó (escala + brilho)
- **Labels**: chips com fundo translúcido (backdrop-blur) posicionados fora dos nós
- **Anéis concêntricos** decorativos indicando níveis de relevância
- Responsivo (ajusta raio por viewport)

### 3. Card "Fontes das percepções"
- Substituir lista simples por barras horizontais proporcionais ao total
- Cada fonte com ícone próprio (Lucide) + cor semântica
- Percentual + valor absoluto

### 4. Cards "Fortalezas" e "Pontos de atenção"
- Layout com borda lateral colorida (verde/âmbar) em vez de header simples
- Cada item vira mini-card com ícone
- **Traduzir severidade**: `high` → "Alta", `medium` → "Média", `low` → "Baixa" (via helper). Badge com cor semântica (destrutivo/âmbar/secondary)

### 5. Card do Buddy (narrativa)
- Manter mascote mas com fundo em gradiente sutil e citação estilizada (aspas grandes decorativas)

### Detalhes técnicos
- Arquivo alterado: `src/pages/buddy/BuddyKnows.tsx`
- Usar apenas tokens semânticos (`hsl(var(--primary))`, `--primary-glow`, `--muted`, etc.) — sem cores hardcoded
- Animações via Tailwind (`animate-pulse`, transitions) + CSS keyframes se necessário para rotação do mapa
- Helper `labelSeverity(s: string)` para tradução PT-BR
- Sem mudanças em hooks, dados ou lógica de negócio — apenas apresentação
