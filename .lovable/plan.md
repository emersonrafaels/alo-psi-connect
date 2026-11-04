# Ajustes no "Meu espaço" e atualização de dados

## 1. Buddy abre o WhatsApp
- No "Meu espaço" do aluno, o atalho "Buddy" passa a abrir a conversa do Buddy no WhatsApp em nova aba, com o mesmo número e mensagem pronta usados na página inicial.

## 2. Encontros e blog sempre abrem no topo
- Ao abrir qualquer encontro (`/encontros/...`) ou post do blog (`/blog/...`), a página sempre começa no topo — vindo do "Meu espaço" ou de qualquer outro lugar do site.

## 3. Dados sempre atualizados ao entrar
- Ao abrir o "Meu espaço" (aluno e profissional), os dados são recarregados na hora, e de novo quando a pessoa volta para a aba.
- O Portal Institucional já faz isso em Visão geral, Triagem e Comparador; passa a valer para todas as páginas do portal (Alunos, Profissionais, Apoios, Mensagens etc.).

## Detalhes técnicos
- Extrair o número/mensagem do Buddy de `HomeRedeBemEstar.tsx` para uma constante compartilhada e usá-la no atalho (`<a target="_blank">`).
- Estender `ScrollToTopOnPortalNavigation` para também rolar ao topo quando o caminho contém `/encontros/` ou `/blog/`.
- Mover `usePortalFreshData` para um hook genérico `useFreshDataOnEnter` e chamá-lo em `StudentHome` (cobre as duas versões), além de aplicá-lo uma vez no nível do portal (rota/layout `portal-institucional`) para todas as subpáginas.
