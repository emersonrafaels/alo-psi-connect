# Jornada Emocional alinhada ao protótipo V11

Atualizar a experiência atual para reproduzir de perto o HTML V11 enviado, adotando exatamente seu vocabulário emocional, sua ordem de telas, seus estados e sua linguagem visual, sem perder o salvamento já existente.

## Experiência que será entregue

1. **Estrutura visual e navegação**
   - Aproximar cabeçalho interno, apresentação da jornada, indicador das cinco fases, cartões, tipografia, espaçamentos, cores, sombras e adaptação para celular do protótipo.
   - Manter as cinco fases: **Perceber, Compreender, Regular, Agir e Registro**.
   - Transformar o indicador de fases em acompanhamento visual, sem permitir saltos que quebrem a sequência.
   - Incluir “Ouvir esta etapa” como recurso opcional usando leitura do navegador, com iniciar/parar e respeito às preferências de acessibilidade.

2. **Perceber: roda V11 completa**
   - Substituir o vocabulário atual pelo conteúdo exato da V11: **Raiva, Tristeza, Medo, Alegria, Força e Tranquilidade**, com todos os níveis e palavras definidos no HTML.
   - Refazer a roda para manter os três anéis visíveis e exploráveis, com legenda, destaque por foco, busca, caminho completo e navegação acessível.
   - A intensidade só será solicitada ao selecionar a nuance final, nunca ao tocar apenas a família ou o segundo nível.
   - Preservar registro de múltiplas emoções, remoção, reinício, revisão e “Adicionar outra emoção”, seguindo a orientação progressiva da V11.
   - Manter intensidade de 1 a 5 e mostrar o caminho completo da emoção no modal e nos registros.

3. **Pausa opcional e reavaliação**
   - Aplicar a regra exata da V11: oferecer a pausa automática somente quando a **primeira emoção** for desagradável e estiver em **5/5**; 4/5 não interrompe.
   - Reproduzir a respiração breve, reavaliação da mesma ocorrência e os caminhos para repetir, continuar, ver apoios ou salvar para depois.
   - Limitar a repetição da pausa como no protótipo e permitir acesso aos caminhos de apoio durante a reavaliação.

4. **Compreender e Mapa Corporal**
   - Manter as quatro dimensões: situação, corpo, comportamento/impulso e pensamentos/diálogo interno.
   - Incluir a experiência completa do Mapa Corporal: emoções e sensações em camadas, intensidade, figuras de frente e costas, várias regiões por camada, sobreposição, observação opcional, remoção e limpeza.
   - Preservar as alternativas “Ainda não consigo identificar” e “Prefiro não registrar agora”.

5. **Regular**
   - Aproximar a apresentação do recurso recomendado, motivo da sugestão, passos, modo guiado ou silencioso, outras práticas e avaliação de utilidade.
   - Manter a regra já adotada de aprendizagem progressiva, sem prescrever uma técnica por emoção.
   - Após uma prática, quando houver Mapa Corporal, mostrar a comparação opcional das sensações corporais.

6. **Agir**
   - Reproduzir as três áreas da V11: **Depende de mim**, **Posso influenciar** e **Não depende de mim**.
   - Manter as explicações sobre controle sem culpa, o menor próximo passo, o prazo e as alternativas para quem ainda não sabe, não quer definir ou precisa de ajuda.

7. **Registro e Paisagem Emocional**
   - Recriar a apresentação final com Buddy, resumo em linguagem humana, privacidade, tempo total automático e visão compacta do check-in.
   - Adicionar áreas expansíveis para rever emoções, contexto, prática, ação e Mapa Corporal.
   - Enriquecer a Paisagem Emocional com abas **Emoções** e **Corpo**, bolhas, intensidade típica, frequência por família, emoções de hoje e sinais corporais históricos.
   - Manter os caminhos de apoio, novo registro e salvamento na Minha Jornada.
   - Incluir a seção “Conheça-se melhor” e a separação explícita dos instrumentos de aprofundamento profissional, como na V11.

8. **Orientações em prévia**
   - Adicionar convites de orientação nas etapas correspondentes.
   - Ao abrir, mostrar a prévia “Conteúdo em produção”, sem incorporar vídeos reais agora.

## Detalhes técnicos

- Evoluir os estados e o reducer da jornada para mapa corporal em camadas, comparação corporal, repetição da pausa, orientação atual e duração da sessão.
- Atualizar a taxonomia emocional para os IDs, famílias, valências e três níveis exatos da V11; manter leitura segura de rascunhos antigos sem quebrar a tela.
- Reestruturar a roda SVG e os componentes das cinco fases, usando os componentes e tokens visuais do projeto.
- Persistir os novos dados dentro dos campos JSON já existentes da sessão, de forma compatível com registros anteriores; não será necessária uma nova tabela.
- Expandir a leitura da Paisagem para combinar o histórico emocional existente com mapas corporais registrados pela própria pessoa.
- Usar o modal de apoio já existente também na reavaliação de intensidade alta.

## Validação

- Testar o percurso completo em computador e celular: roda, busca, três níveis, modal de intensidade, múltiplas emoções, pausa 5/5, reavaliação, foco, quatro dimensões, Mapa Corporal, prática, comparação corporal, ação, registro e salvamento.
- Confirmar especificamente que 4/5 não interrompe, que uma emoção agradável em 5/5 não oferece pausa e que apenas a primeira emoção desagradável em 5/5 ativa essa oferta.
- Verificar navegação por teclado, leitura da etapa, movimento reduzido, textos sem corte e ausência de sobreposição.
- Confirmar compilação e ausência de erros na prévia antes da entrega.
