# Melhorias na etapa Registro da Jornada Emocional

## Ajustes de texto
- Trocar **Próxima Dimensão** por **Próxima Etapa** na navegação da etapa Corpo.
- Manter o comportamento atual de avanço e a preservação das respostas.

## Novo visual da página de Registro
- Aplicar a direção escolhida **Zen reporting suite**, adaptada aos componentes e às cores institucionais já existentes da Rede Bem-Estar.
- Dar mais destaque ao retrato do momento, ao Buddy e aos principais indicadores, com leitura mais leve e acolhedora.
- Reorganizar o conteúdo em três níveis claros:
  1. síntese da jornada e indicadores;
  2. emoções e detalhes do registro;
  3. próximos caminhos e conteúdos complementares.
- Reduzir a sensação de caixas dentro de caixas, usando seções mais abertas, bordas discretas e melhor espaçamento.
- Transformar as emoções registradas em blocos mais fáceis de comparar, destacando nome, intensidade antes/depois e classificação.
- Agrupar panorama, prática, próximo passo e mapa corporal com hierarquia mais clara.
- Preservar todas as ações atuais: salvar, buscar apoio, abrir a Paisagem Emocional e iniciar uma nova jornada.
- Adaptar o novo visual para computador e celular, sem alterar regras ou dados da jornada.

## Correção dos nomes das emoções
- Na área **Emoções deste check-in**, converter identificadores internos como `raiva_magoado` e `tristeza_desanimado` para os nomes visíveis escolhidos na roda, como **Magoado** e **Desanimado**.
- Usar o catálogo de emoções como fonte principal do nome, inclusive antes de o registro aparecer no histórico carregado.
- Aplicar fallback legível para registros antigos ou identificadores que não existam mais no catálogo, evitando mostrar códigos com sublinhados.
- Revisar a página de Registro para garantir que nenhum outro identificador técnico fique visível.

## Validação
- Percorrer uma jornada com duas emoções de níveis diferentes e confirmar os nomes corretos no resumo e em **Emoções deste check-in**.
- Conferir intensidades antes/depois, prática, próximo passo e mapa corporal no novo layout.
- Testar expansão e recolhimento dos detalhes e todas as ações finais.
- Validar em computador e celular, incluindo textos longos e ausência de sobreposição.

## Detalhes técnicos
- Alterações concentradas nos componentes da etapa Registro, da Paisagem Emocional e no texto de navegação da etapa Corpo.
- Reutilização dos tokens visuais e componentes existentes; nenhuma mudança em banco de dados, permissões ou regras de persistência.
