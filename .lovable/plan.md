

## Plano: Melhorias de Experiencia do Usuario nos Encontros

### Visao Geral

Aprimorar a experiencia do usuario na feature de Encontros em Grupo, focando em: exibicao de links importantes nos cards, pagina de detalhes do encontro, melhorias na pagina "Meus Encontros" e micro-interacoes que aumentam engajamento.

---

### Melhoria 1 -- Exibir Links do WhatsApp e Compartilhamento nos Cards

Atualmente os cards (`GroupSessionCard` e `NextSessionHighlight`) mostram apenas o indicador "Online" quando ha link do Meet, mas nao exibem o link do WhatsApp nem o botao de compartilhar (que ja existe como componente `ShareSessionButton`).

**Mudancas:**

| Componente | O que adicionar |
|------------|-----------------|
| `GroupSessionCard.tsx` | Icone do WhatsApp ao lado do indicador "Online" quando `whatsapp_group_link` existir; botao `ShareSessionButton` no rodape do card |
| `NextSessionHighlight.tsx` | Mesmas adicoes: indicador WhatsApp e botao de compartilhar |

---

### Melhoria 2 -- Pagina de Detalhes do Encontro

Criar uma pagina dedicada `/encontros/:sessionId` que exibe todas as informacoes do encontro em formato expandido, ideal para compartilhamento em redes sociais e para quem quer saber mais antes de se inscrever.

**Conteudo da pagina:**

- Titulo, descricao completa (sem truncamento)
- Foto e bio do organizador/facilitador
- Data, horario, duracao
- Tipo de sessao (Palestra, Workshop, Roda de Conversa)
- Barra de vagas (`VacancyProgressBar`)
- Botao de inscricao
- Link do WhatsApp (visivel apenas para inscritos)
- Botao de compartilhar
- Botao "Adicionar ao Calendario" (`AddToCalendarButton`)
- Tag LIBRAS se aplicavel
- Sessoes relacionadas (mesmo tipo ou mesmo organizador)

**Implementacao:**

| Arquivo | Acao |
|---------|------|
| `src/pages/GroupSessionDetail.tsx` | Criar -- Pagina de detalhes |
| `src/hooks/useGroupSessionById.tsx` | Criar -- Hook para buscar sessao individual por ID |
| `src/App.tsx` | Editar -- Adicionar rotas `/encontros/:id` e `/medcos/encontros/:id` |
| `GroupSessionCard.tsx` | Editar -- Titulo clicavel com link para pagina de detalhes |
| `NextSessionHighlight.tsx` | Editar -- Adicionar link "Ver detalhes" |

---

### Melhoria 3 -- Links de Acesso na Pagina "Meus Encontros"

A pagina `MyGroupSessions` atualmente mostra o botao de acesso ao Meet mas nao exibe o link do grupo do WhatsApp.

**Mudancas em `MyGroupSessions.tsx`:**

- Adicionar botao "Grupo WhatsApp" ao lado do botao "Acessar Encontro" (visivel quando `whatsapp_group_link` existir)
- Icone do WhatsApp (MessageCircle) com cor verde
- Link abre em nova aba
- Disponivel a qualquer momento (sem restricao de horario, diferente do Meet)

---

### Melhoria 4 -- Confirmacao antes de Cancelar Inscricao

Atualmente o cancelamento de inscricao em `MyGroupSessions` acontece com um clique, sem confirmacao. Adicionar um `AlertDialog` pedindo confirmacao.

**Mudancas em `MyGroupSessions.tsx`:**

- Envolver o botao "Cancelar" com `AlertDialog` do Radix
- Titulo: "Cancelar inscricao?"
- Descricao: "Voce tem certeza que deseja cancelar sua inscricao neste encontro? Sua vaga sera liberada para outros participantes."
- Botoes: "Manter Inscricao" e "Sim, Cancelar"

---

### Melhoria 5 -- Card do Encontro Clicavel

Tornar o titulo do encontro no `GroupSessionCard` um link clicavel que leva a pagina de detalhes, adicionando uma interacao natural de navegacao.

**Mudancas:**

| Componente | O que mudar |
|------------|-------------|
| `GroupSessionCard.tsx` | Titulo `h3` vira link para `/encontros/:id`; cursor pointer; hover underline |
| `NextSessionHighlight.tsx` | Titulo clicavel + link "Ver detalhes completos" abaixo da descricao |

---

### Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/GroupSessionDetail.tsx` | Criar -- Pagina de detalhes do encontro |
| `src/hooks/useGroupSessionById.tsx` | Criar -- Hook para buscar sessao por ID |
| `src/App.tsx` | Editar -- Adicionar rotas de detalhes |
| `src/components/group-sessions/GroupSessionCard.tsx` | Editar -- Adicionar WhatsApp, Share, link clicavel |
| `src/components/group-sessions/NextSessionHighlight.tsx` | Editar -- Adicionar WhatsApp, Share, link detalhes |
| `src/pages/MyGroupSessions.tsx` | Editar -- Adicionar botao WhatsApp e AlertDialog de cancelamento |

### Ordem de Implementacao

1. Melhoria 1 (WhatsApp + Share nos cards) -- rapida e de impacto visual imediato
2. Melhoria 3 (WhatsApp em Meus Encontros) -- complementa a melhoria 1
3. Melhoria 4 (Confirmacao de cancelamento) -- previne erros do usuario
4. Melhoria 2 (Pagina de detalhes) -- a mais complexa, mas agrega muito valor
5. Melhoria 5 (Cards clicaveis) -- depende da melhoria 2 existir

