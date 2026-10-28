# Comparador — página "Jornada de cuidado" (Método AME)

Criar a leitura "Jornada de cuidado" no Comparador, seguindo o arquivo enviado, e passar a registrar as etapas de cada pedido de apoio para alimentar a página com dados reais.

## 1. Registro das etapas do pedido

Cada pedido de apoio de um aluno passa a ter:
- **Porta de entrada**: Conversa com o Buddy, Direto na área de apoio, Diário ou check-in, Conteúdo ou prática, Indicação do núcleo.
- **Etapas com data**: Pedido iniciado, Triagem realizada, Encaminhamento enviado, Contato realizado, 1ª consulta realizada, Em acompanhamento.
- **Encaminhamento**: Psicologia, Núcleo da unidade, Psiquiatria, Mentoria, Serviço externo (ou ainda sem encaminhamento).
- **Situação hoje**: 1ª consulta realizada, Em andamento, Sem retorno ao contato, Orientadas a outro recurso.

Como os pedidos são criados e avançam:
- O pedido é aberto automaticamente quando o aluno pede apoio pelo Buddy, pela área de apoio (botões "Ver horários"/WhatsApp), pelo Diário ou por uma prática.
- A equipe da instituição avança as etapas na Triagem: no histórico do aluno aparece um bloco "Jornada do pedido" com as etapas, o encaminhamento e a situação, para marcar cada passo.
- Ao concluir uma triagem, a etapa "Triagem realizada" é marcada sozinha; ao confirmar uma consulta paga, "1ª consulta realizada" também.

## 2. Página Jornada de cuidado

Rota própria dentro do Comparador; no menu lateral, "Jornada de cuidado" deixa de ser "Em breve" e passa a ter a etiqueta "Nova". Mesmo seletor de unidade e de coleta semestral.

Blocos, na ordem do arquivo:
1. Cabeçalho "Método AME · Acolher, Mapear, Encaminhar" e "Do pedido de apoio ao atendimento".
2. **Pilares AME**: Acolher (usaram Buddy, Diário ou prática), Mapear (responderam escala ou Radar), Encaminhar (pediram apoio humano), com número e % dos elegíveis.
3. **Etapas do encaminhamento**: barras das seis etapas, quantos não seguiram entre etapas, tempo mediano até a próxima e destaque rosa na maior perda; distribuição de quem não chegou à consulta.
4. **De onde vêm e para onde vão os pedidos**: diagrama de faixas (porta de entrada ou unidade → encaminhamento → situação hoje), com explicação ao passar o mouse e filtro por origem.
5. **Comparação entre unidades**: curva por unidade (% do pedido inicial em cada etapa), cartões com taxa de atendimento e espera, e opção de tabela.
6. Botão de ampliar em cada bloco, como na Visão geral.

Cores, espaçamentos e textos seguem o arquivo, adaptados às cores do portal. Grupos com menos de 10 pedidos ficam ocultos e nenhum aluno é identificado.

## 3. Dados de demonstração

Gerar pedidos sintéticos para os alunos demonstrativos da Afya (e EBMSP), coerentes com o arquivo (cerca de 214 pedidos na Afya no semestre atual), sem enviar avisos e sem tocar nos casos de estudo protegidos.

## Detalhes técnicos

- Nova tabela `care_requests` (patient_id, institution_id, unit, origin, destination, outcome, timestamps por etapa) com GRANTs e RLS: aluno lê os próprios; equipe da instituição lê e atualiza os de seus alunos; admins tudo.
- Gatilhos: conclusão em `student_triage` marca triagem; agendamento pago marca 1ª consulta. Criação a partir dos pontos de pedido de apoio no app (Buddy, área de apoio, WhatsApp).
- RPC agregada `get_institution_care_journey(institution_id)` devolvendo contagens por semestre/unidade/origem/destino/situação e medianas de tempo, com corte n<10.
- Front em `src/features/institution/comparator/journey/` com regras puras (`journeyLogic.ts`: perdas entre etapas, maior perda, faixas do diagrama, curvas) e testes; menu lateral do Comparador compartilhado entre as leituras.
- Bloco "Jornada do pedido" em `StudentActivityModal` da Triagem.
