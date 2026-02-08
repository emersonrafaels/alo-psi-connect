

## Plano: Adicionar campos de Link do Meet e WhatsApp nos formularios de encontros

### Problema Atual
Os formularios de criacao/edicao de encontros (tanto admin quanto facilitador) nao possuem campos para informar links de videoconferencia (Google Meet) e grupo de WhatsApp.

### Mudancas Necessarias

#### 1. Migracao de Banco de Dados
Adicionar coluna `whatsapp_group_link` na tabela `group_sessions` (a coluna `meeting_link` ja existe).

| Tabela | Coluna | Tipo | Descricao |
|--------|--------|------|-----------|
| group_sessions | whatsapp_group_link | text | Link do grupo do WhatsApp |

#### 2. Atualizar tipos TypeScript
Adicionar `whatsapp_group_link` na interface `GroupSession` em `src/hooks/useGroupSessions.tsx`.

#### 3. Formulario Admin (`GroupSessionForm.tsx`)
Adicionar nova seção "Links" com dois campos:
- **Link da Reunião (Meet)**: campo de URL para Google Meet ou similar (campo `meeting_link`)
- **Link do Grupo do WhatsApp**: campo de URL para grupo do WhatsApp (campo `whatsapp_group_link`)

Ambos opcionais, com placeholders orientando o formato esperado.

#### 4. Formulario Facilitador (`FacilitatorSessionForm.tsx`)
Adicionar a mesma secao "Links" com os mesmos dois campos, tambem opcionais.

#### 5. Hook useGroupSessions
Garantir que os campos `meeting_link` e `whatsapp_group_link` sejam incluidos no `createSession` e `updateSession`.

### Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| Migracao SQL (nova) | Adicionar coluna `whatsapp_group_link` |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente |
| `src/hooks/useGroupSessions.tsx` | Adicionar `whatsapp_group_link` na interface e nas mutations |
| `src/components/group-sessions/admin/GroupSessionForm.tsx` | Adicionar secao "Links" com dois campos |
| `src/components/group-sessions/facilitator/FacilitatorSessionForm.tsx` | Adicionar secao "Links" com dois campos |

### Detalhes Tecnicos

**Secao "Links" nos formularios:**
```
Card: "Links"
  - Label: "Link da Reunião (Google Meet, Zoom, etc.)"
    Input type="url" placeholder="https://meet.google.com/xxx-xxxx-xxx"
  - Label: "Link do Grupo do WhatsApp"
    Input type="url" placeholder="https://chat.whatsapp.com/..."
```

**SQL da migracao:**
```sql
ALTER TABLE group_sessions
  ADD COLUMN IF NOT EXISTS whatsapp_group_link text;
```

**Interface atualizada:**
```typescript
interface GroupSession {
  // ... campos existentes
  meeting_link?: string;
  whatsapp_group_link?: string;
}
```

