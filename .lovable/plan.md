## Problema

O botão "Gerar resumo semanal" **funciona** (chama a edge function `institution-weekly-brief`), mas o card fica visualmente vazio depois — dando a impressão de que "nada aconteceu".

Causa: incompatibilidade de contrato entre a edge function e o componente.

- **Edge function retorna:** `{ brief: "<texto em prosa>", metrics, generated_at, model }` — `brief` é uma **string** de até 220 palavras gerada pelo Gemini em texto corrido.
- **Frontend (`InstitutionExecutiveHeader.tsx`) espera:** `brief.headline`, `brief.highlights[]`, `brief.focus` — um **objeto estruturado**.

Como `brief.headline` é `undefined` e `highlights` não existe, o card renderiza vazio depois do loading.

## Correção

### 1. `supabase/functions/institution-weekly-brief/index.ts`
- Trocar o prompt para pedir **JSON estruturado** com `headline`, `highlights[]` e `focus`, usando `response_format: { type: "json_object" }` (suportado pelo Gemini via Lovable AI Gateway).
- Fazer parse do `content` como JSON e salvar `payload.brief` como objeto (não string).
- Manter fallback: se o parse falhar, colocar o texto cru em `headline` e `highlights: []` para o card ainda mostrar algo.
- Preservar linguagem executiva: "Panorama da semana / Sinais de atenção / O que celebrar / Próximo passo" viram os `highlights`, e `focus` recebe a sugestão de próximo passo.
- Invalidar o cache antigo bumping a checagem para exigir shape novo (se `typeof cached.payload.brief !== 'object'`, ignorar cache e regenerar).

### 2. `src/components/institution/InstitutionExecutiveHeader.tsx`
- Manter o shape esperado (`Brief { headline, highlights[], focus }`), já compatível com o novo payload.
- Adicionar tratamento defensivo: se `brief` vier como string (payload legado ainda em cache), exibir como parágrafo único.
- Mostrar toast de erro quando `supabase.functions.invoke` falhar (hoje o erro some silenciosamente porque o `useQuery` engole no estado `error` e o card não renderiza nada).

## Validação
- Clicar em "Gerar resumo semanal" → skeleton → card preenchido com headline + bullets + foco.
- Testar com cache antigo (string) → cai no fallback e mostra o texto.
- Testar com instituição sem dados → mensagem "Ainda não há dados suficientes".
