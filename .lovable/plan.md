
## Notificacoes por Email para Acoes Institucionais

### Objetivo
Criar uma edge function que envia emails para os administradores da instituicao quando acoes importantes acontecem (triagem, mudanca de status, notas criadas, etc).

### Abordagem
Criar uma unica edge function `notify-institution-action` que recebe o tipo de acao e dados relevantes, busca os admins da instituicao, e envia um email formatado com branding do tenant. No frontend, invocar essa funcao nos hooks existentes (`useStudentTriage` e `useInstitutionNotes`) apos cada acao bem-sucedida (fire-and-forget, sem bloquear a UI).

### Acoes que disparam email
1. **Aluno triado** (createTriage) - inclui nome do aluno, nivel de risco, prioridade
2. **Triagem em andamento** (updateTriageStatus -> in_progress)
3. **Triagem concluida** (updateTriageStatus -> resolved)
4. **Triagem reaberta** (updateTriageStatus -> triaged, vindo de resolved)
5. **Nota institucional criada** (createNote)
6. **Nota institucional excluida** (deleteNote)

### Arquitetura

```text
Frontend (hook onSuccess)
  |
  v  (fire-and-forget, nao bloqueia UI)
Edge Function: notify-institution-action
  |
  +-- Busca admins da instituicao (institution_users WHERE role='admin')
  +-- Busca emails dos admins (profiles.email)
  +-- Busca branding do tenant (tenants table)
  +-- Busca BCC emails (system_configurations)
  +-- Envia email via Resend para todos os admins
```

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/notify-institution-action/index.ts` | Nova edge function que recebe action_type, institution_id, e metadata; busca admins e envia email formatado com Resend |
| `src/hooks/useStudentTriage.tsx` | Nos callbacks onSuccess de createTriage e updateTriageStatus, invocar a edge function (fire-and-forget) |
| `src/hooks/useInstitutionNotes.tsx` | Nos callbacks onSuccess de createNote e deleteNote, invocar a edge function (fire-and-forget) |

### Conteudo do email por acao

- **Aluno triado**: "O aluno [Nome] foi triado com risco [Nivel] e prioridade [Prioridade]. Acao recomendada: [texto]"
- **Em andamento**: "A triagem do aluno [Nome] foi movida para Em Andamento"
- **Concluida**: "A triagem do aluno [Nome] foi concluida/resolvida"
- **Reaberta**: "A triagem do aluno [Nome] foi reaberta"
- **Nota criada**: "Uma nova nota '[Titulo]' foi criada na instituicao [Nome]"
- **Nota excluida**: "A nota '[Titulo]' foi excluida da instituicao [Nome]"

### Seguranca
- Edge function valida autenticacao via Authorization header
- Usa service role key internamente para buscar admins
- Emails enviados apenas para admins ativos da instituicao
- Falha no envio de email nao bloqueia a acao principal (fire-and-forget)

### Sem mudancas no banco de dados
Nenhuma migracao necessaria. Usa tabelas existentes: `institution_users`, `profiles`, `tenants`, `system_configurations`.
