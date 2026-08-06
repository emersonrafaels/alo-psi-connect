# Melhoria de design: abas do Portal Institucional e Buddy dos Alunos

## Problema
A aba **"Buddy dos Alunos"** no Portal Institucional está com o texto comprimido/cortado próximo à palavra "Alunos" (print anexado). Isso acontece porque a `TabsList` usa `md:grid-cols-8` com largura igual para todas as abas, forçando o rótulo longo em um espaço apertado.

## Objetivo
1. Corrigir o layout das abas para que "Buddy dos Alunos" respire e fique legível em todos os breakpoints.
2. Aproveitar para dar um polimento visual geral na área do Buddy dos Alunos (lista lateral + painel do aluno).

## O que será alterado

### 1. Layout das abas (`src/pages/InstitutionPortal.tsx`)
- Substituir o grid rígido de 8 colunas por um layout flexível/scrollável ou `auto-fit` que respeite o tamanho do conteúdo.
- Garantir que as abas não quebrem palavras e mantenham espaçamento interno confortável (`px-3`/`px-4`, `gap-1`).
- Preservar o comportamento responsivo: mobile continua em 2 colunas; desktop passa a usar `inline-flex` com scroll horizontal automático ou grid `minmax` maior.
- Manter o emoji 🧠 ao lado do rótulo "Buddy dos Alunos".

### 2. Polimento do `StudentBuddyPanel.tsx`
- Revisar espaçamentos, tipografia e hierarquia visual da lista lateral e do painel de detalhes.
- Garantir que o nome do aluno e os badges de atenção não fiquem colados.
- Ajustar o card "O que fazer agora" e os botões de atalho para melhor proporção.
- Verificar contraste e consistência com os tokens do projeto (sem cores hardcoded).

## Critério de aceitação
- O rótulo "Buddy dos Alunos" aparece completo e com respiro visual na largura desktop (~1280 px).
- Nenhuma aba fica com texto cortado ou quebrado em linha de forma estranha.
- O painel do Buddy dos Alunos mantém todas as funcionalidades atuais com aparência mais moderna e espaçada.
