

## Tour Guiado para a Pagina de Encontros

### Objetivo

Adicionar um tour guiado na pagina `/meus-encontros` seguindo exatamente o mesmo padrao ja implementado no portal institucional (`useInstitutionTour` + `InstitutionTour`).

### Arquivos a criar

**1. `src/hooks/useGroupSessionsTour.tsx`**

Hook generico reutilizando o mesmo padrao do `useInstitutionTour`, com storage key proprio (`group-sessions-tour-completed`) e passos contextuais:

| Passo | Titulo | Descricao |
|-------|--------|-----------|
| 1 - welcome | Bem-vindo aos seus Encontros! | Aqui voce gerencia inscricoes, cria novos encontros e acompanha seus indicadores. |
| 2 - tabs | Navegacao por Abas | Alterne entre Encontros Inscritos, Meus Encontros Criados e Criar Encontro. |
| 3 - my-sessions | Encontros Inscritos | Veja seus proximos encontros, acesse links de reuniao e gerencie inscricoes. |
| 4 - created-sessions | Meus Encontros Criados | Acompanhe indicadores como inscritos, taxa de ocupacao e status dos encontros que voce criou. |
| 5 - create-session | Criar Encontro | Crie novos encontros em grupo preenchendo o formulario com titulo, data, formato e descricao. |

**2. `src/components/group-sessions/GroupSessionsTour.tsx`**

Componente de dialog identico ao `InstitutionTour` -- reutiliza o mesmo layout com icone Sparkles, barra de progresso, botoes Pular/Anterior/Proximo/Comecar.

### Arquivo a modificar

**3. `src/pages/MyGroupSessions.tsx`**

- Importar o hook e o componente do tour
- Chamar `useGroupSessionsTour()` no componente principal
- Renderizar `<GroupSessionsTour ...props />` dentro do JSX
- Adicionar atributos `data-tour` nos elementos-alvo das abas (TabsList, TabsTriggers) para referencia visual futura
- O tour so aparece para usuarios com `canCreateSessions` (facilitadores), pois as abas extras so existem para eles

### Comportamento

- O tour aparece automaticamente na primeira visita (com delay de 1s)
- Fica salvo no localStorage apos conclusao ou skip
- Pode ser reiniciado programaticamente via `resetTour()`

