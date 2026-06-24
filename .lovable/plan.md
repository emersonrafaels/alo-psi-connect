## Diagnóstico

As escalas não aparecem para visitantes (não logados) porque as tabelas `emotional_scales` e `emotional_scale_items` têm policies de RLS e GRANTs restritos apenas ao papel `authenticated`. Quando o usuário está deslogado (papel `anon`), o `SELECT` retorna vazio silenciosamente — por isso as seções "Saúde mental positiva" e "Sintomas e risco" aparecem sem nenhum card.

Policies atuais:
- `emotional_scales` → SELECT só para `authenticated`
- `emotional_scale_items` → SELECT só para `authenticated`
- Sem GRANTs para `anon` no schema public

A página `EmotionalScales.tsx` e o fluxo de resposta para visitantes já estão prontos no frontend — falta apenas liberar a leitura no banco.

## Plano

**Migração SQL** liberando leitura anônima apenas do catálogo de escalas (metadados públicos, sem dados pessoais):

1. `GRANT SELECT ON public.emotional_scales TO anon;`
2. `GRANT SELECT ON public.emotional_scale_items TO anon;`
3. Criar policy `"Anyone reads active scales"` em `emotional_scales` para role `anon` com `USING (active = true)`.
4. Criar policy `"Anyone reads scale items"` em `emotional_scale_items` para role `anon` com `USING (true)` (itens só fazem sentido junto da escala ativa).

**Não alterado:**
- `emotional_scale_responses` continua restrita ao próprio usuário autenticado (visitantes usam scoring client-side via `scaleScoring.ts`, sem persistência).
- `iseu_scores` permanece privado.
- Frontend não muda.

## Validação

Após aplicar a migração: abrir `/escalas` deslogado deve listar as escalas WHO5, MHCSF, PHQ9, GAD7, PSS10, ISI; clicar em "Responder agora" abre o questionário; ao finalizar, o resultado aparece com o CTA de cadastro/login.
