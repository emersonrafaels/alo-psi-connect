# Documentação de Pagamentos + Diagrama do Fluxo

Salvar a documentação de pagamentos como arquivo no projeto e incluir um diagrama visual do fluxo.

## O que será criado

`docs/PAGAMENTOS_SISTEMA.md` — mesmo conteúdo já apresentado no chat, seguindo o padrão do `docs/CUPONS_SISTEMA.md`:

1. Visão geral (Mercado Pago, Checkout Pro)
2. Componentes e páginas envolvidas no fluxo de agendamento e pagamento
3. Edge Functions (criação de preferência, webhook, confirmação)
4. Tabelas e campos usados para registrar pagamentos e status
5. Estados do pagamento (aprovado, pendente, recusado) e efeitos no agendamento
6. Cupons de desconto e interação com o valor final
7. Secrets/variáveis necessárias
8. Observações e limitações conhecidas (débito/boleto excluídos, parcelamento até 12x, página de sucesso compartilhada para aprovado e pendente)

## Diagrama do fluxo

Dois diagramas dentro do mesmo arquivo:

- **Fluxo principal** em Mermaid (`sequenceDiagram`): estudante → agendamento → criação da preferência → Checkout Pro → retorno → webhook → atualização de status.
- **Máquina de estados** em Mermaid (`stateDiagram`) dos status de pagamento e do agendamento.

Também será adicionada uma versão ASCII simplificada, para leitura em ambientes que não renderizam Mermaid.

## Detalhes técnicos

- Apenas criação de arquivo markdown em `docs/`. Nenhuma alteração em código, banco de dados ou edge functions.
- Links internos referenciando os arquivos reais do projeto (componentes, hooks e edge functions) para facilitar manutenção.
