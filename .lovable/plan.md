

## Notas Institucionais no Portal Admin

### Objetivo
Permitir que administradores adicionem notas/anotacoes vinculadas a uma instituicao, como datas de semana de provas, eventos importantes, avisos, etc.

### 1. Nova tabela no banco: `institution_notes`

Criar tabela com as colunas:
- `id` (uuid, PK)
- `institution_id` (uuid, FK para educational_institutions)
- `title` (text) - titulo curto da nota (ex: "Semana de Provas")
- `content` (text) - descricao detalhada
- `note_type` (text) - tipo: "event", "info", "alert", "reminder"
- `start_date` (date, nullable) - data de inicio (para eventos com periodo)
- `end_date` (date, nullable) - data de fim
- `is_pinned` (boolean, default false) - fixar nota no topo
- `created_by` (uuid, FK para auth.users)
- `created_at`, `updated_at` (timestamps)

RLS: apenas admins podem CRUD (usando `is_admin(auth.uid())`).

### 2. Nova aba "Notas" no portal

Adicionar uma 6a aba no `AdminInstitutionPortal.tsx` com icone `StickyNote`:

- Lista de notas ordenada por pinned primeiro, depois por data
- Cada nota mostra: titulo, tipo (badge colorido), datas (se houver), conteudo, quem criou e quando
- Botao "Nova Nota" abre dialog para criar
- Acoes por nota: editar, fixar/desafixar, excluir
- Notas com datas futuras/atuais destacadas visualmente

### 3. Novo componente: `InstitutionNotesTab.tsx`

Componente dedicado que recebe `institutionId` e implementa:
- Listagem com cards para cada nota
- Badges por tipo: Evento (azul), Info (cinza), Alerta (laranja), Lembrete (amarelo)
- Datas formatadas com date-fns
- Dialog para criar/editar nota com campos: titulo, tipo, datas (opcionais), conteudo
- Confirmacao para excluir

### 4. Hook: `useInstitutionNotes.tsx`

Hook com react-query para:
- `useQuery` para listar notas da instituicao
- `useMutation` para criar, atualizar e excluir notas

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Criar tabela `institution_notes` com RLS |
| `src/hooks/useInstitutionNotes.tsx` | Novo hook para CRUD de notas |
| `src/components/admin/InstitutionNotesTab.tsx` | Novo componente da aba de notas |
| `src/pages/admin/AdminInstitutionPortal.tsx` | Adicionar aba "Notas" com icone StickyNote |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente pela migration |

