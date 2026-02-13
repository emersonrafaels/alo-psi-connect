
## Corrigir erro 400 na query de "Meus Encontros Criados"

### Causa raiz

A query tenta fazer um join aninhado `profiles:user_id(nome, foto_perfil_url)` dentro de `group_session_registrations`. Isso falha com erro 400 porque:

- `group_session_registrations.user_id` tem FK para `auth.users(id)`
- `profiles.user_id` tambem tem FK para `auth.users(id)`
- Nao existe FK direta entre `group_session_registrations` e `profiles`
- O PostgREST (API do Supabase) nao consegue resolver esse join indireto

### Solucao

Separar em duas queries:

1. Buscar as sessoes com registrations (sem join de profiles)
2. Buscar os profiles dos user_ids dos inscritos separadamente
3. Combinar os dados no frontend

### Detalhes tecnicos

**Arquivo: `src/components/group-sessions/MyCreatedSessionsTab.tsx`**

1. Alterar a query principal para:
   ```typescript
   .select('*, group_session_registrations(id, user_id, status, registered_at)')
   ```
   (removendo o join com profiles)

2. Apos obter as sessoes, coletar todos os `user_id` unicos dos registrations

3. Fazer uma segunda query:
   ```typescript
   supabase.from('profiles').select('user_id, nome, foto_perfil_url').in('user_id', userIds)
   ```

4. Criar um mapa `user_id -> profile` e usa-lo na renderizacao dos inscritos

5. Atualizar a renderizacao para buscar o perfil pelo `reg.user_id` no mapa em vez de `reg.profiles`
