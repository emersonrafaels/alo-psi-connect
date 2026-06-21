# Legibilidade dos números + Modo tela cheia

## 1. Legibilidade dos números

Aumentar contraste e peso dos contadores na tela de Sessão (`PraticaSessao.tsx` + `BreathingCircle.tsx`):

- **Segundos da fase** (dentro do círculo, hoje `text-sm opacity-80`): subir para `text-2xl sm:text-3xl font-semibold`, opacidade 100%, com `tabular-nums` (evita "pulinho" entre dígitos) e `drop-shadow` para destacar sobre o halo.
- **Label da fase** ("Inspire/Segure/Expire"): já é grande; manter, mas adicionar `font-semibold` e `tabular-nums` no `{secondsLeft}s`.
- **Tempo decorrido / total** (rodapé da barra de progresso): de `text-xs sm:text-sm opacity-80` para `text-base sm:text-lg font-medium tabular-nums opacity-95`, com leve `drop-shadow` para legibilidade sobre o gradiente.
- **Barra de progresso**: subir altura de `h-1.5` para `h-2` para acompanhar a tipografia maior.

## 2. Botão de tela cheia (qualquer dispositivo)

Novo botão no rodapé da sessão, ao lado dos botões de áudio:

- Ícone `Maximize2` / `Minimize2` (lucide).
- Usa a Fullscreen API padrão com fallback para iOS Safari (`webkitEnterFullscreen` no `<video>` não se aplica aqui — para iOS no iPhone a Fullscreen API do `documentElement` não existe, então fazemos um **fallback "imersivo"**: aplica classe que força `position: fixed; inset: 0; z-index: 9999` + esconde a barra de URL via `scrollTo(0,1)` e bloqueia scroll do body).
- Detecta suporte: `document.fullscreenEnabled || document.webkitFullscreenEnabled`. Se nenhum, usa apenas o fallback CSS.
- Escuta `fullscreenchange` / `webkitfullscreenchange` para sincronizar estado quando o usuário sair com ESC.
- Ao sair da rota/desmontar: garante `exitFullscreen()` e remove a classe de fallback.
- `aria-label` dinâmico: "Entrar em tela cheia" / "Sair da tela cheia".
- Atalho de teclado: `F` alterna fullscreen.

### Detalhes técnicos

- Implementação inline no `PraticaSessao.tsx` (hook local `useFullscreen` com `useState` + `useEffect`); sem nova dependência.
- Alvo do fullscreen: `document.documentElement` (cobre toda a aplicação enquanto na sessão).
- Fallback iOS: classe `pratica-fullscreen-fallback` adicionada no `<html>` com `overflow: hidden; height: 100dvh` definida em `index.css`.

## Fora de escopo
- Outras telas de Práticas (índice, detalhe, conclusão).
- Mudanças no áudio ou no halo respirante.
