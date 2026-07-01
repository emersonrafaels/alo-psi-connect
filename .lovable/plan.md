## Objetivo
Substituir o card "Rotina / Ritual do Sono" da seção "O que o Buddy está priorizando para você" (em `/buddy`) por um card estático "Conheça nossos profissionais".

## Contexto
O card "Ritual do Sono" é uma recomendação gerada dinamicamente pela IA (categoria `rotina`) em `src/pages/buddy/BuddyHome.tsx`. Não existe string hardcoded — a lista vem de `insight.recommendations` + 1 card estático (`static-encontros`).

## Mudanças em `src/pages/buddy/BuddyHome.tsx`

1. Adicionar rota para profissionais no `CATEGORY_ROUTES`:
   - `profissional: "/profissionais"`
2. Adicionar label:
   - `profissional: "Ver profissionais"`
3. Filtrar recomendações dinâmicas do tipo "sono" (por título/descrição contendo "sono") para remover o "Ritual do Sono".
4. Adicionar um segundo card estático ao lado do `static-encontros`:
   ```
   {
     id: "static-profissionais",
     category: "profissional",
     title: "Conheça nossos profissionais",
     description: "Encontre psicólogos e terapeutas da Rede Bem-Estar prontos para te acompanhar.",
     cta: "Ver profissionais",
   }
   ```
5. O botão X (dismiss) já é ocultado para cards com id começando por `static-`.

## Fora do escopo
- Não altera geração de recomendações pela IA (o prompt do Buddy pode voltar a sugerir sono em outro contexto; o filtro no front garante que não apareça mais como card).
- Não mexe em `BuddyDailyBrief` na Home.
