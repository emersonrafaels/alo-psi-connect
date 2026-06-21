## Parte 1 — Ícone de áudio inativo

Hoje, quando a trilha está **mutada**, mostramos `VolumeX` (lucide). Quando o **som ambiente** está desligado, mostramos `Music` com `opacity-50`. Os dois ficam ambíguos: o `Music` esmaecido parece "carregando" e não comunica "desligado".

### Alteração

`src/pages/praticas/PraticaSessao.tsx`

- **Trilha mutada**: trocar `VolumeX` por `VolumeOff` (lucide) — desenho com um "X" mais explícito sobre o alto‑falante. Manter `Volume2` para o estado ativo.
- **Som ambiente desligado**: trocar `Music` + `opacity-50` por `Waves` (ativo) e `WavesOff` (inativo, sem opacity). Ambos comunicam "som ambiente" melhor que a clave de Sol (música). 
- Acrescentar um pequeno indicador visual de estado: borda do botão usa `border-white/60` quando ativo e `border-white/20 line-through-like` (riscado horizontal sutil via pseudo-elemento `after`) quando inativo, para reforçar a leitura.
- Atualizar `aria-label` e `title` correspondentes.

Remover o import `Music`/`Music2` e adicionar `VolumeOff`, `Waves`, `WavesOff`.

---

## Parte 2 — Plano de melhorias e configurações para a imersão

Lista priorizada para evoluir a tela `/praticas/:slug/sessao`. Cada item indica escopo e arquivos prováveis. Nada é implementado neste plano — só elencado para você escolher o próximo passo.

### A. Configurações que aparecem antes da sessão (na tela de detalhe)

1. **Padrão de respiração customizado** — sliders para inspirar / segurar / expirar / segurar (Box, 4‑7‑8, Coerência 5‑5, custom). Já existe `padrao_respiracao` no banco; falta UI.
2. **Voz‑guia (TTS)** — gerar com Lovable AI (`gpt-4o-mini-tts`) a contagem das fases ("Inspire… 4, 3, 2, 1… Segure…") com vozes selecionáveis (alloy, sage, shimmer) e idioma pt‑BR. Cacheável.
3. **Catálogo de trilhas** — em vez de uma única faixa fallback, oferecer 4–6 opções (chuva, oceano, floresta, drone, piano lento, silêncio). Pré‑visualização de 5 s.
4. **Modo "sem tela"** — escurece quase totalmente o display após N segundos, mantendo só o círculo respirando (economia de bateria + foco).
5. **Lembrete diário** — agendar notificação local/email para repetir a prática no mesmo horário.

### B. Durante a sessão (controles e feedback)

6. **Sino/gong de transição** — som curto opcional a cada mudança de fase (inspirar→segurar→expirar).
7. **Vibração háptica** em mobile nas trocas de fase (`navigator.vibrate`).
8. **Indicador de ciclo** — "Ciclo 3 de 12" abaixo do círculo, ajuda a perceber progresso além da barra.
9. **Brilho/intensidade do visual** — slider 1–5 reaproveitando a config já existente no banco para controlar partículas, aurora e blur em tempo real.
10. **Tema da cena** — Aurora (atual), Oceano, Floresta, Pôr do sol, Noturno. CSS variables alternáveis.
11. **Pausa inteligente** — ao perder foco da aba, pausa automaticamente; ao voltar, retoma com fade‑in de 2 s.
12. **Botão "Estender +1 min"** quando faltam <15 s, para continuar sem reconfigurar.

### C. Pós‑sessão (checkout)

13. **Mini check‑in de humor** (1 emoji + slider 1–5) gravado no `mood_entries` para ligar a prática ao diário emocional.
14. **Resumo do ciclo respiratório** — ciclos completos, tempo total, FC estimada (se houver wearable).
15. **Compartilhar selo de prática** — gera card ("Hoje pratiquei 5 min de respiração lenta") para download/compartilhar.
16. **Streak / histórico** — contador de dias consecutivos, calendário de práticas.

### D. Acessibilidade e robustez

17. **Modo reduzido de movimento** — respeitar `prefers-reduced-motion`: substituir aurora animada por gradiente estático e remover partículas.
18. **Alto contraste opcional** — toggle que aumenta opacidade do texto e adiciona overlay escuro para legibilidade.
19. **Legendas das fases** sempre visíveis em letra grande para usuários com baixa visão.
20. **Persistência de progresso** — se o usuário sair antes do fim, registrar parcial e oferecer continuar de onde parou.

### E. Conteúdo e personalização

21. **Biblioteca de práticas guiadas** com áudio próprio (Supabase Storage) por psicólogo da rede — campo `audio_url` já existe.
22. **Recomendação contextual** — se a triagem indicou ansiedade alta, sugerir respiração 4‑7‑8; se sono ruim, body scan.
23. **Sessões em sequência** — encadear 2–3 práticas curtas como "rotina matinal".

---

## Como prosseguir

Confirme:
- Se posso aplicar agora a **Parte 1** (ícones).
- Quais itens do plano (A–E, por número) devo detalhar e implementar em seguida.