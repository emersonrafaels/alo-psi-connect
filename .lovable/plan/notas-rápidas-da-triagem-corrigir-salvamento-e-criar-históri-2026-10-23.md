# Notas rápidas da triagem: corrigir salvamento e criar histórico

## Causa confirmada
O botão "Salvar nota" grava numa tabela de notas (`student_triage_notes`) que não existe no banco. Toda gravação falha, e a tela não mostra nenhum erro, então parece que "nada acontece".

## O que será feito
1. **Criar a tabela de notas** com instituição, aluno, autor, texto, nível de risco e data. Permissões: apenas membros/admins da instituição (e admins da plataforma) leem e criam notas da própria instituição; o autor pode editar/excluir as suas.
2. **Avisar no salvamento**: mensagem "Nota salva" ao concluir e mensagem de erro clara se falhar (o texto digitado não é perdido).
3. **Histórico de notas no próprio popover**: abaixo do campo, lista das notas anteriores daquele aluno (mais recentes primeiro), com autor, data/hora e nível de risco no momento. Cada nova nota é acrescentada, nunca substitui a anterior.
4. **Contador na fila**: o ícone de nota na linha do aluno mostra quantas notas existem (usa o contador que a fila já prevê).
5. Notas continuam internas: não alteram o status da triagem, e o aluno permanece na fila.

## Detalhes técnicos
- Migração: `CREATE TABLE public.student_triage_notes` + GRANTs (authenticated, service_role) + RLS usando `user_belongs_to_institution`/`is_admin`; índice em `(institution_id, patient_id, created_at desc)`.
- `QuickNotePopover`: nova prop `history` (notas do aluno vindas de `useTriageNotes`), toast em sucesso/erro via `try/catch`.
- `StudentTriageTab`/`PendingQueue`: agrupar notas por `patient_id` e repassar ao popover e ao `noteCount`.
- Teste: o salvamento de uma nota não muda o status de triagem do aluno.
