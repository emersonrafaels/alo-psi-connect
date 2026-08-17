# Corrigir erro ao clicar em "Atualizar percepções"

## Diagnóstico (confirmado)

A edge function `buddy-generate-insights` retorna erro porque o usuário logado não possui registro de "paciente" no banco. Consulta feita agora:

- O perfil "Emerson R. - Carta Consulta" existe, mas não há linha correspondente em `pacientes` (mesmo caso do perfil "Emerson Vinicius Rafael da Silva").
- A função resolve o perfil e, ao não encontrar o paciente, aborta com `404 Paciente não encontrado` — que o frontend mostra como "Edge Function returned a non-2xx status code".
- Os logs da função só mostram boots, sem erro de IA nem de banco, coerente com essa saída antecipada.

O mesmo bloqueio afeta o resto do Buddy: `useCurrentPatientId` retorna `null`, então retrato, padrões, jornada e forças ficam vazios/desabilitados para esse usuário.

## Correção

1. **Criar o registro de paciente automaticamente (backend)**
   - Em `buddy-generate-insights`, quando não existir paciente para o perfil, criar a linha em `pacientes` (com o service role) e seguir o fluxo normalmente, em vez de retornar 404.
   - Manter 404 apenas quando o próprio perfil não existir.

2. **Mesma garantia no frontend**
   - Em `useCurrentPatientId` (`src/hooks/useBuddy.tsx`), se não houver paciente, criar a linha para o próprio usuário (a política de RLS `users_insert_own_patient_data` já permite) e retornar o id — evita telas vazias antes da primeira geração.

3. **Mensagens de erro mais claras**
   - No botão "Atualizar percepções", exibir a mensagem retornada pela função (ex.: limite de uso, créditos) em vez do texto genérico de non-2xx.

## Verificação

- Acessar `/buddy` com o usuário atual, clicar em "Atualizar percepções" e confirmar que o resumo é gerado sem toast de erro.
- Conferir nos logs da função que não há mais retorno 404 e que o insight foi inserido em `buddy_insights`.

## Notas técnicas

- Arquivos envolvidos: `supabase/functions/buddy-generate-insights/index.ts`, `src/hooks/useBuddy.tsx` e o componente da home do Buddy que dispara a mutação.
- Sem migrações de banco: apenas inserção de dados via código, usando políticas e grants já existentes.
