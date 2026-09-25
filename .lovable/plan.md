# Corpo desenhado na Paisagem Emocional

## Implementação
- Manter as silhuetas de **Frente** e **Costas** sempre visíveis na aba **Corpo**, inclusive quando o check-in atual não tiver marcações.
- Recuperar, nos registros da própria pessoa, as camadas corporais salvas na Jornada Emocional e combiná-las com as marcações do check-in atual.
- Representar as regiões recorrentes diretamente sobre as silhuetas, preservando as cores das sensações e variando a intensidade visual conforme os registros.
- Organizar o painel conforme a referência: corpos lado a lado e, ao lado, o resumo **Padrões que vêm aparecendo**.
- Quando ainda não houver histórico, mostrar os corpos sem destaques e uma mensagem curta, em vez de substituir o desenho por uma caixa vazia.

## Validação
- Conferir a aba Corpo com histórico, somente com marcações atuais e sem nenhuma marcação.
- Validar frente, costas, regiões movidas e nomes das sensações.
- Testar a composição no computador e no celular, garantindo que corpos e textos não se sobreponham.

## Detalhes técnicos
- Reutilizar o catálogo corporal e o componente de silhueta já compartilhados pela Jornada.
- Manter a consulta restrita aos registros do usuário autenticado e sem alterar os dados salvos.
