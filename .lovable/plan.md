

## Editar Encontros Criados pelo Facilitador

### Objetivo

Permitir que o criador de um encontro edite suas informacoes (titulo, descricao, data, horario, links, capacidade) diretamente na aba "Meus Encontros Criados".

### Mudanca no Banco de Dados

**Nova politica RLS** para permitir que criadores editem encontros com status `pending_approval` ou `scheduled`:

```sql
CREATE POLICY "Creators can update own editable sessions"
  ON group_sessions FOR UPDATE
  USING (
    auth.uid() = created_by 
    AND status IN ('pending_approval', 'scheduled')
  );
```

Observacao: ja existe uma politica para facilitadores atualizarem sessoes `pending_approval`, mas ela exige a role `facilitator`. A nova politica cobre qualquer criador e tambem inclui sessoes `scheduled`. A politica antiga pode ser mantida sem conflito (RLS e permissivo com OR entre politicas).

### Arquivos a Modificar

**1. `src/components/group-sessions/facilitator/FacilitatorSessionForm.tsx`**

Adicionar suporte a valores iniciais para modo de edicao:
- Novo prop opcional `initialData` com os dados existentes da sessao
- Usar `defaultValues` do `useForm` preenchidos com `initialData` quando fornecido
- Alterar texto do botao de submit: "Salvar Alteracoes" quando em modo edicao, "Enviar para Aprovacao" quando criando

**2. `src/components/group-sessions/MyCreatedSessionsTab.tsx`**

Adicionar funcionalidade de edicao:
- Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` e icone `Pencil`
- Adicionar state `editingSession` para controlar qual sessao esta sendo editada
- Adicionar mutation `updateMutation` que faz `supabase.from('group_sessions').update(...)` com o id da sessao
- Adicionar botao "Editar" (icone Pencil) ao lado do botao "Excluir" para sessoes com status `pending_approval` ou `scheduled`
- Renderizar o `Dialog` com `FacilitatorSessionForm` passando `initialData` da sessao selecionada
- Ao salvar, invalidar query `facilitator-sessions`

### Fluxo do Usuario

1. Na aba "Meus Encontros Criados", sessoes com status "Aguardando Aprovacao" ou "Aprovado" mostram botao "Editar"
2. Ao clicar, abre um dialog com o formulario preenchido com os dados atuais
3. O usuario edita os campos desejados e clica "Salvar Alteracoes"
4. Os dados sao atualizados no banco e a lista e atualizada automaticamente

### Detalhes tecnicos

Campos editaveis: `title`, `description`, `session_type`, `session_date`, `start_time`, `duration_minutes`, `max_participants`, `meeting_link`, `whatsapp_group_link`

O formulario ja possui todos esses campos -- a unica mudanca e aceitar `initialData` e ajustar o texto do botao.

