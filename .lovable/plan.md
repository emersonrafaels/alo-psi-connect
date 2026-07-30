## Problema

O QueryClient global (`src/App.tsx`) usa `staleTime: 5 minutos` e `refetchOnWindowFocus: false`. Vários dados exibidos no Buddy são alterados **fora** das páginas do Buddy (perfil, diário emocional, escalas, práticas, encontros, privacidade), então o Buddy mostra cache antigo até o usuário recarregar a página manualmente. O caso reportado (contato de emergência salvo no Perfil não aparecendo no Buddy) é um sintoma desse padrão.

## Objetivo

Nenhuma tela do Buddy deve exigir refresh manual: os dados se atualizam por invalidação de cache e refetch ao montar.

## O que fazer

1. **Chaves de cache padronizadas** (`src/hooks/useBuddy.tsx`)
   - Centralizar as chaves do Buddy (`portrait`, `insight`, `patient-id`, `emergency`, `privacy`, etc.) em um objeto exportado, para que qualquer tela possa invalidá-las sem duplicar strings.
   - Expor um helper `invalidateBuddyData(queryClient)` que invalida o namespace `["buddy"]` inteiro.

2. **Dados frescos ao entrar em qualquer página do Buddy**
   - Nas queries de leitura das páginas do Buddy (`BuddyHome`, `BuddyStrengths`, `BuddyPatterns`, `BuddyJourney`, `BuddyKnows`, `BuddyPortrait`, `BuddyPrivacy`), aplicar `staleTime: 0` e `refetchOnMount: "always"` para consultas que dependem de dados editáveis em outros lugares (contatos de emergência, perfil/paciente, entradas de humor, escalas, práticas, encontros, preferências de privacidade).
   - Manter `staleTime` alto apenas onde o custo é relevante e o dado é gerado por IA sob demanda (retrato/insights gerados), que já têm invalidação explícita após geração.

3. **Invalidação nas telas que escrevem esses dados**
   - `EmergencyContactsEditor` (usado no Perfil e no modal do Buddy): invalidar `["buddy"]` após salvar.
   - Fluxos de salvamento do Diário Emocional, escalas emocionais, práticas concluídas, inscrição em encontros e preferências de privacidade do Buddy: invalidar o namespace `["buddy"]` no sucesso, usando o helper.

4. **Botão de atualizar visível**
   - Manter/garantir na `BuddyLayout` (ou no cabeçalho de cada página) um botão "Atualizar" que chama o helper de invalidação, dando ao usuário controle explícito sem recarregar a página.

## Detalhes técnicos

- Sem mudanças de banco de dados, RLS ou edge functions.
- Sem `window.location.reload()`: tudo por invalidação do React Query, preservando a navegação SPA.
- Alterações restritas a `src/hooks/useBuddy.tsx`, às páginas em `src/pages/buddy/`, ao `EmergencyContactsEditor` e aos hooks de escrita dos módulos relacionados (diário, escalas, práticas, encontros).
