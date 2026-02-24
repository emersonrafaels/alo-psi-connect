

## Corrigir falha ao salvar entrada no Diario Emocional

### Problema

O erro no console e claro: `duplicate key value violates unique constraint "mood_entries_user_id_date_key"`.

A funcao `createOrUpdateEntry` faz um check-then-act:
1. Chama `getEntryByDate(date)` para verificar se ja existe entrada
2. Se existir, faz UPDATE; se nao, faz INSERT

Porem `getEntryByDate` tem um guard `if (!user || !profile || !tenantId) return null`. Se `tenantId` ainda nao carregou quando o usuario clica "Salvar", a funcao retorna `null` silenciosamente, a logica interpreta como "nao existe entrada", tenta INSERT e falha no constraint `UNIQUE (user_id, date)`.

### Solucao

Substituir o padrao check-then-act por **upsert** do Supabase, que e atomico e resolve a race condition:

**Arquivo: `src/hooks/useMoodEntries.tsx`**

1. Adicionar guard para `tenantId` em `createOrUpdateEntry` (linha 216):
   ```typescript
   if (!user || !profile || !tenantId) {
   ```

2. Substituir o bloco check-then-act (linhas 250-308) por upsert:
   ```typescript
   const { data, error } = await supabase
     .from('mood_entries')
     .upsert(
       {
         ...normalizedEntryData,
         user_id: user.id,
         profile_id: profile.id,
         tenant_id: tenantId,
       },
       { onConflict: 'user_id,date' }
     )
     .select()
     .single();

   if (error) {
     console.error('Supabase upsert error:', error);
     throw new Error(`Erro ao salvar entrada: ${error.message}`);
   }

   console.log('Entry saved successfully:', data.id);
   toast({
     title: "Sucesso",
     description: "Entrada do diario salva com sucesso!",
   });
   fetchEntries();
   return data;
   ```

### Por que upsert

- Atomico: nao ha janela entre o SELECT e o INSERT onde outra operacao pode interferir
- Mais simples: elimina a necessidade de `getEntryByDate` antes de salvar
- Resolve o bug: mesmo se `tenantId` demorar a carregar, o guard impede a execucao prematura

### Escopo

- 1 arquivo editado: `src/hooks/useMoodEntries.tsx`
- Nenhuma mudanca no banco de dados

