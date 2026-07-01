## Plano de Evolução do Buddy e Integrações com a Rede Bem-Estar

Objetivo: elevar a percepção de valor do Buddy — que ele deixe de parecer um "assistente extra" e passe a ser o **fio condutor inteligente** que conecta todos os módulos da Rede Bem-Estar (Diário, Escalas, Práticas, Encontros, Profissionais, Blog). Cada melhoria abaixo é desenhada para gerar sensação de "esse app me entende, cuida de mim e me ajuda de forma única".

---

### 1. Buddy Onipresente (widget global)
Hoje o Buddy só aparece nas rotas `/buddy/*`. Torná-lo um **companheiro sempre presente**.

- **Buddy Floating Companion**: botão flutuante (canto inferior direito) em todo o app autenticado, com balão contextual que muda conforme a página:
  - Diário → "Quer que eu resuma como foi sua semana?"
  - Escalas → "Posso te explicar o que esse resultado significa?"
  - Profissionais → "Quer que eu sugira quem combina com você?"
  - Práticas → "Sugestão do dia: prática de respiração de 3 min"
- **Modo passivo (ícone)** vs **modo ativo (bubble expandida)** — usuário controla.
- Micro-animação do mascote (piscar, respirar) para dar vida.

### 2. Feed Diário "Momento com o Buddy"
Card fixo no topo da Home logada (`Index.tsx`) com **conteúdo dinâmico diário**:
- Saudação personalizada (bom dia/tarde/noite + nome)
- 1 insight fresco baseado nos últimos 7 dias
- 1 ação sugerida (check-in, prática, escala pendente, encontro próximo)
- 1 "descoberta": frase curta do que o Buddy percebeu de novo hoje
- CTA único e direto ("Fazer meu check-in de 30 segundos")

### 3. Check-in Rápido do Buddy (30 segundos)
Fluxo ultra-leve, alternativo ao Diário completo:
- Modal minimalista disparado pelo Buddy 1x/dia
- 3 perguntas com sliders/emojis: humor, energia, uma palavra livre
- Resposta imediata do Buddy com validação emocional + próximo passo
- Alimenta o mesmo pipeline de insights (aumenta densidade de dados sem esforço)

### 4. Conexões Inteligentes entre Módulos
O Buddy passa a **traduzir dados de um módulo em ações de outro**:

- **Diário → Práticas**: "Notei ansiedade alta nos últimos 3 dias. Que tal a prática 'Respiração 4-7-8'?" (deep-link direto)
- **Escalas → Profissionais**: "Seu PHQ-9 subiu. Selecionei 3 profissionais com experiência nesse tema."
- **Práticas → Diário**: após concluir prática, Buddy pergunta "Como você está agora?" e cria entrada relâmpago.
- **Encontros → Buddy**: após participar de encontro, Buddy oferece "quer conversar sobre como foi?"
- **Blog → Buddy**: em cada post relevante, badge "O Buddy recomenda esse conteúdo para você" (baseado em tags do retrato).

### 5. Linha do Tempo Emocional Unificada
Nova seção em `BuddyJourney`: **timeline visual** cronológica misturando todos os eventos (diário, escalas, práticas, sessões, encontros, insights do Buddy) em um único fluxo navegável.
- Ícones distintos por tipo, cor pela intensidade emocional
- Filtros por período e tipo
- Buddy comenta trechos ("Aqui você teve uma virada importante")
- Exportável em PDF ("Meu diário emocional dos últimos 3 meses")

### 6. Buddy Preditivo e Proativo
- **Alertas gentis**: quando padrão de risco é detectado (ex: 4 dias seguidos de humor baixo), Buddy envia notificação in-app + e-mail: "Percebi algo. Podemos conversar?"
- **Antecipação**: "Amanhã é seu dia de terapia com Dra. X. Quer preparar 3 tópicos para levar?"
- **Celebração**: reconhece marcos ("30 dias registrando emoções", "melhor semana de sono do trimestre") com micro-recompensas visuais.

### 7. Voz do Buddy (áudio bidirecional)
Aproveitando `buddy-transcribe-audio` já existente:
- Usuário pode **falar** com o Buddy em vez de digitar (botão de microfone em qualquer entrada de texto do Buddy)
- Buddy pode **responder em áudio** (TTS via Lovable AI Gateway) com voz calma, opcional
- Diferencial forte: acessibilidade + intimidade

### 8. Ponte com Profissionais (com consentimento)
Aumenta valor percebido tanto por pacientes quanto por profissionais:
- Paciente pode gerar **"Resumo para meu terapeuta"** — PDF de 1 página com narrativa do Buddy dos últimos 30 dias
- Compartilhamento controlado: paciente escolhe o que enviar antes da consulta
- Profissional vê no portal um card "Contexto do Buddy" (quando compartilhado)
- Buddy sugere ao profissional pontos-chave para abordar na sessão

### 9. Onboarding Encantador (primeiro contato)
Refazer a experiência inicial do Buddy para ser memorável:
- Boas-vindas animadas do mascote (5-7 segundos)
- Retrato em micro-etapas conversacionais (não formulário) — 1 pergunta por tela, com transições suaves
- Ao final, "primeira leitura" do Buddy em 3 frases personalizadas → gera efeito wow imediato
- Progresso visível ("Você já compartilhou 40% do seu retrato — quanto mais eu souber, mais posso ajudar")

### 10. Gamificação Sutil e Significativa
Sem virar app de pontos infantil:
- **Selos de autoconhecimento** ("Explorador do sono", "Constância de 21 dias", "Aberto ao novo") — reconhecimento qualitativo, não numérico
- Barra do "quanto o Buddy te conhece" na Home do Buddy (0-100%)
- Cada seção preenchida do retrato = novo poder desbloqueado ("Buddy agora pode identificar padrões de sono")

### 11. Insights Compartilháveis (viralidade orgânica)
- Cards visuais bonitos (estilo Spotify Wrapped) das descobertas do Buddy
- Ex: "Nas últimas 4 semanas, sua palavra mais frequente foi 'gratidão'"
- Botão "compartilhar" que gera imagem shareable, com marca Rede Bem-Estar discreta
- Aumenta boca-a-boca sem parecer marketing invasivo

### 12. Personalização de Tom e Personalidade
Já existe `preferred_tone` no retrato — usar de verdade:
- 3 tons: **Acolhedor** (padrão), **Direto e prático**, **Reflexivo e profundo**
- Buddy adapta linguagem em todas as saídas geradas por IA
- Configurável a qualquer momento

---

### Priorização sugerida (ordem de impacto x esforço)

**Quick wins (alto impacto, baixo/médio esforço)**
1. Feed diário "Momento com o Buddy" na Home
2. Check-in rápido de 30 segundos
3. Conexões inteligentes entre módulos (deep-links contextuais)
4. Personalização de tom funcionando de verdade

**Médio prazo**
5. Buddy Floating Companion global
6. Linha do tempo emocional unificada
7. Onboarding conversacional encantador
8. Insights compartilháveis (Wrapped)

**Alto impacto, maior esforço**
9. Voz bidirecional (STT + TTS)
10. Buddy preditivo e proativo (com notificações)
11. Ponte com profissionais (resumo compartilhável)
12. Gamificação de autoconhecimento

---

### Detalhes técnicos

- **Backend**: novas edge functions `buddy-daily-brief` (feed diário), `buddy-quick-checkin` (check-in relâmpago), `buddy-share-summary` (PDF para terapeuta), `buddy-tts` (voz). Reutilizar `buddy-generate-insights` como pipeline central.
- **Frontend**: novo componente `<BuddyFloatingCompanion />` montado em `App.tsx` dentro de rotas autenticadas; novo hook `useBuddyContext(page)` que retorna balão contextual.
- **Dados**: tabela `buddy_events` (timeline unificada) alimentada por triggers dos módulos existentes; tabela `buddy_shared_summaries` para consentimento.
- **IA**: usar Lovable AI Gateway (google/gemini-2.5-flash para tempo real, gemini-2.5-pro para narrativas longas).
- **Design**: manter tokens semânticos existentes, adicionar `--buddy-glow` e keyframes de "respiração" do mascote.

Não escrevo código nesta fase. Ao aprovar o plano, sugiro começarmos pelos **quick wins 1–4** (uma entrega por vez, validando com você) e depois avançarmos.
