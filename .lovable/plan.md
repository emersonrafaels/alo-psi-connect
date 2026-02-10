
## Plano: Adicionar "pending_approval" ao check constraint de status

### Problema

O check constraint `group_sessions_status_check` na tabela `group_sessions` aceita apenas: `draft`, `scheduled`, `live`, `completed`, `cancelled`. O fluxo de facilitador tenta inserir com status `pending_approval`, que nao esta na lista permitida.

### Solucao

Alterar o check constraint para incluir `pending_approval` na lista de valores validos.

### Mudanca

**Migracao SQL:**

```sql
ALTER TABLE group_sessions DROP CONSTRAINT group_sessions_status_check;
ALTER TABLE group_sessions ADD CONSTRAINT group_sessions_status_check 
  CHECK (status = ANY (ARRAY['draft', 'pending_approval', 'scheduled', 'live', 'completed', 'cancelled']));
```

Nenhuma mudanca de codigo necessaria. Apenas o constraint do banco precisa ser atualizado.
