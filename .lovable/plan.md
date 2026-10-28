# Corrigir confirmação de pagamento dos agendamentos do Buddy

## O que encontrei
- **Os agendamentos estão sendo gravados.** Os 7 mais recentes (Vitor, Juliana, Cleiton, Fernando etc., criados em 27–28/10) estão na tabela com link do Mercado Pago. Na imagem, a tabela está ordenada por data da consulta (agosto) e mostra a página 1 de 3 — os novos ficam nas últimas páginas. Ordenando por `created_at` decrescente eles aparecem.
- **Todos continuam como "pendente / pending_payment"**, mesmo pagos. Dois motivos no retorno automático do Mercado Pago:
  1. Não há nenhum registro de chamada recebida pelo retorno do Mercado Pago — o aviso de pagamento não está chegando ou está sendo descartado. Ele só aceita o formato `{ type: "payment", data: { id } }`; avisos no formato `?topic=payment&id=...` / `action: "payment.updated"` / `merchant_order` são ignorados.
  2. Mesmo quando processa, ele só muda `status` para "confirmado" e **nunca atualiza `payment_status`** para `paid` — e é esse campo que o portal admin usa para mostrar "Pagamento pendente".

## O que vou fazer
1. **Retorno do Mercado Pago**: aceitar todos os formatos de aviso (payment, topic/id na URL, payment.created/updated, merchant_order), registrar logs claros e responder 200 sempre para o Mercado Pago não desistir.
2. **Atualizar os dois campos**: aprovado → `status = confirmado` + `payment_status = paid`; recusado/cancelado → `cancelado` + `failed`; pendente → mantém `pending_payment`. Não rebaixar um agendamento já pago.
3. **Sincronização de segurança**: na função de verificação existente (`check-webhook-status`), consultar no Mercado Pago os pagamentos pela referência do agendamento, para corrigir os pendentes que já foram pagos (incluindo os de ontem), e evitar que o cancelamento automático de 24h cancele um agendamento pago.
4. **Corrigir os já pagos**: rodar essa sincronização para os agendamentos recentes e confirmar no banco que passaram para `paid`.
5. Teste pequeno da regra de conversão de status do Mercado Pago.

## O que pode precisar de você
- Confirmar no painel do Mercado Pago (Suas integrações → Webhooks) se há uma URL configurada diferente; a URL correta é `.../functions/v1/mercadopago-webhook`.
- Confirmar que o token do Mercado Pago usado no Supabase é da mesma conta que recebe os pagamentos.

## Detalhes técnicos
- Arquivos: `supabase/functions/mercadopago-webhook/index.ts`, `supabase/functions/check-webhook-status/index.ts`, regra pura de mapeamento em arquivo compartilhado com teste.
- Busca de pagamentos: `GET /v1/payments/search?external_reference=<agendamentoId>`.
- O fluxo n8n não precisa mudar.
