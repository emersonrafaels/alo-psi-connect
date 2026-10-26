# Portal institucional com menu lateral

## O que muda para o usuário
- As opções hoje em abas horizontais (Visão Geral, Cupons, Alunos, Apoios, Comparador, Métricas, Diário Emocional, Triagem, Notas, Buddy, Buddy dos Alunos) passam a ficar num **menu lateral fixo à esquerda**, no mesmo estilo das páginas Comparador e Triagem.
- Menu agrupado por seções para leitura rápida:
  - **Painel**: Visão Geral, Métricas, Diário Emocional
  - **Cuidado**: Triagem, Notas, Buddy, Buddy dos Alunos (quando permitido)
  - **Gestão**: Alunos, Profissionais, Apoios, Cupons
  - **Análises**: Comparador
- Item ativo destacado; itens que abrem página própria (Alunos, Apoios, Comparador, Triagem, Profissionais) mostram um pequeno ícone de "abrir".
- Topo da área de conteúdo com título e descrição curta da seção atual (ex.: "Cupons — gere e acompanhe códigos de acesso").
- Cards de números ficam só na Visão Geral, com grid mais limpo e hierarquia mais clara (número grande, legenda curta), mantendo os efeitos de hover atuais.
- Celular/tablet: o menu vira um botão "Menu" que abre uma gaveta lateral; o conteúdo ocupa a largura toda.
- Ao trocar de seção, a página volta ao topo.

## Detalhes técnicos
- Em `src/pages/InstitutionPortal.tsx`, substituir o `TabsList` por um componente novo `src/features/institution/portal/PortalSidebar.tsx` (config de itens em array: id, rótulo, ícone, grupo, `href` opcional).
- Manter `Tabs`/`TabsContent` controlados por `activeTab` (sem mudar dados nem hooks); links externos usam `buildTenantPath`.
- Sincronizar `activeTab` com `?tab=` na URL para deep links e voltar do navegador.
- Mobile usa `Sheet` do shadcn; apenas tokens semânticos.
- Preservar `data-tour="tabs"`/`wellbeing-tab` no menu para o tour guiado.
- Registrar no `AGENTS.md` a regra do menu lateral do portal.
