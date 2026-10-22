# Triagem: corrigir números e abrir como página própria

## 1. Cards zerados ("1000 Sem Dados")
Causa encontrada no carregamento dos dados da Triagem:
- A lista de alunos para em 1.000 (a Afya tem 2.806).
- Os diários e triagens desses alunos são buscados numa única consulta com mais de mil IDs e limitada a 1.000 linhas. A consulta falha ou volta incompleta, por isso todos os alunos aparecem como "Sem Dados".

Correção: carregar alunos, diários e triagens em páginas e lotes, com o mesmo método já usado nas outras telas do portal. Assim os cards Crítico, Alerta, Atenção, Estável e Sem Dados mostram os números reais.

## 2. Triagem como página própria, igual ao Comparador
- Nova página em tela cheia `/portal-institucional/triagem` (e a versão Medcos), com:
  - botão "Voltar ao portal institucional" no topo;
  - menu lateral à esquerda com as seções: Visão de risco (cards), Fila de triagem (lista de alunos), Métricas da triagem e Follow-ups vencidos. Clicar rola até a seção correspondente.
- A aba "Triagem" do portal passa a abrir essa página, como já acontece com o Comparador.
- Nomes dos alunos continuam anonimizados (`Aluno #N`).

## Detalhes técnicos
- `useStudentTriage.tsx`: trocar consultas de `patient_institutions`, `mood_entries` e `student_triage` por paginação (`supabasePaging`) e `.in()` em lotes.
- Novo `src/pages/institution/InstitutionTriage.tsx` reutilizando `StudentTriageTab` e `TriageMetricsDashboard`, com layout lateral no padrão de `InstitutionComparator.tsx`; rotas em `App.tsx`; aba em `InstitutionPortal.tsx` vira link.
