## Ajustes de Resolução/Reabertura de Triagem

### 1. Data futura na resolução (bug)
- **Seed demo** (`supabase/functions/seed-demo-data/index.ts`): fixar `resolvedAt = min(createdAt + rand(1..min(7, daysAgo)), now())` para nunca cair no futuro.
- **Correção retroativa**: rodar `UPDATE public.student_triage SET resolved_at = now(), updated_at = now() WHERE resolved_at > now()` para os 44 registros demo da UNIFAGOC (via `supabase--insert`).
- **Garantia futura** no hook `useStudentTriage` (`updateTriageStatus`): quando `status = 'resolved'`, sempre gravar `resolved_at = now()` no cliente (já faz), e no seed nunca gerar futuro.

### 2. Modal ao clicar "Resolver" (aba Em Andamento)
Novo componente `TriageResolutionDialog.tsx` (reutilizável):
- Campo **Tipo de resolução** (obrigatório, `Select`):
  - `encaminhado_profissional` — "Encaminhado a profissional"
  - `acompanhamento_interno` — "Acompanhamento interno realizado"
  - `contato_familia` — "Contato com família/responsável"
  - `melhora_espontanea` — "Melhora espontânea observada"
  - `sem_necessidade` — "Sem necessidade de intervenção"
  - `outro` — "Outro"
- Campo **Descrição** (`Textarea`, opcional, até 500 chars).
- Botões: Cancelar / Confirmar resolução.
- Ao confirmar: chama `updateTriageStatus.mutate({ triageId, status: 'resolved', resolvedAt: new Date().toISOString(), resolutionType, resolutionNotes })`.

### 3. Modal ao clicar "Reabrir" (aba Concluídos)
Novo componente `TriageReopenDialog.tsx` (mesmo padrão):
- Campo **Motivo da reabertura** (obrigatório, `Select`):
  - `nova_ocorrencia` — "Nova ocorrência identificada"
  - `piora_quadro` — "Piora do quadro do aluno"
  - `resolucao_incompleta` — "Resolução anterior incompleta"
  - `solicitacao_familia` — "Solicitação da família/aluno"
  - `outro` — "Outro"
- Campo **Descrição** (opcional, até 500 chars).
- Ao confirmar: `updateTriageStatus.mutate({ triageId, status: 'triaged', reopenReason, reopenNotes })` e limpa `resolved_at`.

### 4. Persistência (migração)
Adicionar colunas em `public.student_triage`:
- `resolution_type text`
- `resolution_notes text`
- `reopen_reason text`
- `reopen_notes text`
- `reopened_at timestamp with time zone`

E, no evento de reabertura, definir `resolved_at = NULL`, `reopened_at = now()`.

### 5. Atualizações no hook e UI
- `useStudentTriage.updateTriageStatus`: aceitar os novos campos e persistir; ao reabrir, `resolved_at = null`, `reopened_at = now()`.
- `StudentTriageTab.tsx`: substituir os `onClick` diretos de "Resolver" (linha 1442) e "Reabrir" (linha 1510) pela abertura dos respectivos modais; guardar `selectedTriage` em estado local.
- Mostrar o `resolution_type` (badge) e `resolution_notes` (texto italic) no card da aba Concluídos, quando existirem.

### Detalhes técnicos
- Modais em `src/components/institution/` usando `Dialog` + `Select` + `Textarea` do shadcn.
- Validação com `zod` no submit (tipo obrigatório).
- Toasts via `sonner`/`use-toast` seguindo padrão do projeto.
- Sem mudanças em outras telas.
