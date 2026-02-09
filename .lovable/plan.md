

## Plano: Tornar Titulos Clicaveis na Pagina "Meus Encontros"

### Problema

Na pagina `/meus-encontros`, os titulos dos encontros (tanto nos proximos quanto nos passados) sao texto estatico (`CardTitle`), sem link para a pagina de detalhes (`/encontros/:sessionId`). O usuario nao tem como navegar para os detalhes a partir dessa tela.

### Solucao

Envolver os titulos dos cards com `Link` do React Router, apontando para `/encontros/:sessionId`, com estilo de hover (underline + cor primary).

### Mudancas

**Arquivo:** `src/pages/MyGroupSessions.tsx`

- **Linha 249 (Proximos):** Envolver `CardTitle` com `<Link to={/encontros/${session.id}}>`, adicionando classes `hover:underline hover:text-primary cursor-pointer transition-colors`
- **Linha 378 (Passados):** Mesma mudanca para os cards de sessoes passadas
- **Import:** Adicionar `Link` ao import de `react-router-dom` (ja importa `useNavigate`, basta adicionar `Link`)

### Resultado

O usuario podera clicar no titulo de qualquer encontro (proximo ou passado) para ver a pagina completa de detalhes com todas as informacoes, links e opcoes de compartilhamento.

