# Ajustar telefone de contato do site para (11) 97587-2447

## Objetivo
Atualizar o telefone de contato exibido no site (incluindo o rodapé) para **(11) 97587-2447**, mantendo o número atual **5511956850046** apenas no botão flutuante "iniciar conversa no WhatsApp".

## Situação atual (verificada)
- O rodapé (`src/components/ui/footer.tsx`) e a página de Contato (`src/pages/Contact.tsx`) exibem `tenant.contact_phone`, que vem do banco de dados.
- No banco, ambos os tenants (Rede Bem Estar e Medcos) têm `contact_phone = '(11) 95685-0046'` e `contact_whatsapp = '5511956850046'`.
- `PrivacyPolicy.tsx` e `TermsOfService.tsx` já exibem "(11) 97587-2447" hardcoded.
- `Contact.tsx` tem fallback default "(11) 97587-2447" (já correto).
- O botão flutuante `whatsapp-float.tsx` usa hardcoded `5511956850046` (manter).
- `WorkWithUs.tsx` usa `tenant?.contact_whatsapp` (manter, é o WhatsApp).

## Mudanças
1. **Banco de dados (run_sql)**: Atualizar `tenants.contact_phone` de `'(11) 95685-0046'` para `'(11) 97587-2447'` em todos os tenants que ainda têm o número antigo. **Não** alterar `contact_whatsapp`, que permanece `5511956850046`.
2. **Sem alterações de código**: os componentes já leem `contact_phone` dinamicamente do tenant, e os fallbacks hardcoded já estão corretos. O número do WhatsApp flutuante permanece inalterado.

## Resultado
- Rodapé e página de Contato passam a mostrar **(11) 97587-2447**.
- Botão flutuante de WhatsApp continua abrindo conversa com **5511956850046**.
- Política de Privacidade e Termos de Uso já estão corretos.
