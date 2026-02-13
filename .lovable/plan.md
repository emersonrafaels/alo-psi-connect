

## Corrigir carregamento de "Meus Encontros Criados"

### Causa raiz

A query no componente `MyCreatedSessionsTab` tenta buscar colunas que nao existem na tabela `profiles`:

- `display_name` -- o nome correto e `nome`
- `avatar_url` -- o nome correto e `foto_perfil_url`

Isso faz a query do Supabase falhar silenciosamente, retornando resultado vazio.

### Correcao

**Arquivo: `src/components/group-sessions/MyCreatedSessionsTab.tsx`**

1. Na query do Supabase, trocar o join de:
   `profiles:user_id(display_name, avatar_url)` para `profiles:user_id(nome, foto_perfil_url)`

2. Atualizar as referencias no template para usar `profile?.nome` em vez de `profile?.display_name`

### Detalhes tecnicos

Linha da query (aproximadamente linha 56):
```
// DE:
.select('*, group_session_registrations(id, user_id, status, registered_at, profiles:user_id(display_name, avatar_url))')

// PARA:
.select('*, group_session_registrations(id, user_id, status, registered_at, profiles:user_id(nome, foto_perfil_url))')
```

Na renderizacao dos inscritos (aproximadamente linha 143):
```
// DE:
const name = profile?.display_name || 'Participante';

// PARA:
const name = profile?.nome || 'Participante';
```

Nenhuma outra mudanca e necessaria. A correcao e pontual e resolve o problema de carregamento.

