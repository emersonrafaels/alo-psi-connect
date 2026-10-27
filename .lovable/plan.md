# Visão Geral: remover Feed de alertas e histórico do Resumo executivo

## O que muda para o usuário
1. **Feed de alertas removido** da Visão Geral. O "Resumo executivo do Buddy" passa a ocupar a largura toda da linha.
2. **Resumo executivo com histórico**
   - Ao abrir a Visão Geral, o cartão já mostra o **último resumo gerado** (sem precisar clicar), com data/hora e quem gerou.
   - Botão **"Atualizar resumo"**: gera um novo resumo na hora (ignora o cache de 24h) e ele passa a ser o atual.
   - Seção **"Resumos anteriores"** (lista recolhível) com os últimos 10 resumos: data/hora, autor e título. Clicar em um item abre esse resumo no cartão, com um aviso "Visualizando resumo de DD/MM" e um link para voltar ao mais recente.
   - Se nunca houve resumo, mantém o botão "Gerar resumo semanal" atual.

## Detalhes técnicos
- `src/components/institution/InstitutionExecutiveHeader.tsx`: remover o Card "Feed de alertas" e ajustar o grid; substituir o `useQuery` do brief por:
  - query de histórico (`action: 'history'`) carregada ao montar;
  - mutação de atualização (`force: true`) que invalida o histórico;
  - estado do item selecionado.
  `summary.alerts` e `goToTriage` continuam usados pelo diálogo de KPI.
- `supabase/functions/institution-weekly-brief/index.ts`:
  - nova ação `history`: depois da mesma checagem de acesso à instituição, retorna os últimos 10 registros `buddy_insights` do tipo `institution_weekly_brief` (id, created_at, brief, autor) — tudo pelo servidor, sem precisar mudar as regras de acesso da tabela;
  - ao gerar, gravar `generated_by` (id do usuário) no payload; no histórico, resolver o primeiro nome via `profiles.nome`. Resumos antigos sem autor aparecem como "Buddy (automático)".
- Nada muda no banco (o histórico já é salvo hoje em `buddy_insights`); modelo e prompt permanecem iguais.
