# Refinamento da página “Como funciona”

## Objetivo
Melhorar a experiência da página pública e aproximá-la ainda mais das seis imagens anexadas, preservando a ordem, o conteúdo, a identidade da Rede Bem-Estar e os destinos atuais dos botões.

## Direção visual definida
- Paleta fiel à referência: roxo `#56208A`, rosa `#F58AC8`, turquesa `#A8E8EC` e lavanda `#F4E5FA`, convertidos em tokens semânticos com equivalentes para modo escuro.
- Títulos em Outfit e textos em Figtree.
- Composição igual às imagens: sequência contínua de faixas narrativas, sem substituir a estrutura por uma grade genérica.
- Cantos discretos, sombras suaves, ícones circulares e contraste acessível.

## Melhorias de UX/UI
1. **Abertura**
   - Ajustar proporções, alinhamento e respiro para reproduzir melhor a referência.
   - Dar mais protagonismo à fotografia e reposicionar os três cartões informativos sem cobrir o rosto.
   - Refinar título, texto e botão para melhorar leitura e hierarquia em computador e celular.

2. **Pilares do funcionamento**
   - Reequilibrar o texto lateral e os três cartões de Escalas, Diário Emocional e Buddy.
   - Uniformizar alturas, alinhamentos, ícones e etiquetas, reduzindo espaços vazios.

3. **Inteligência e jornada do Buddy**
   - Refinar o gráfico longitudinal com melhor leitura dos meses, pontos e tendência.
   - Aproximar a linha do tempo das cinco fases da referência, com conexão visual clara.
   - Melhorar os cartões de mensagens para parecerem comunicações reais, mantendo conteúdo e horários.
   - Dar mais impacto e legibilidade ao destaque de `+78%`.

4. **Escalas e apoios**
   - Ajustar densidade, proporções e hierarquia das grades conforme as referências.
   - Manter cada item clicável, com interação sutil e foco visível por teclado.
   - Reorganizar a grade de nove apoios para manter ritmo equilibrado em diferentes larguras.

5. **Dados, segurança e privacidade**
   - Reproduzir com mais fidelidade o comparativo entre leitura individual e visão institucional.
   - Melhorar o agrupamento dos quatro compromissos de segurança.
   - Refinar o encerramento com escudo, garantias e botão de privacidade na mesma composição da referência.

6. **Experiência responsiva e movimento**
   - Reduzir a altura excessiva da página no celular sem remover conteúdo.
   - Evitar cortes, sobreposições e textos apertados em todas as larguras.
   - Adicionar entradas discretas por seção e respostas suaves nos itens interativos, respeitando a preferência por movimento reduzido.

## Detalhes técnicos
- Concentrar o refinamento visual em `src/pages/HowItWorks.tsx` e nos tokens globais específicos da página.
- Usar somente cores, gradientes e sombras definidos como tokens semânticos no sistema visual.
- Carregar Outfit e Figtree pelo mecanismo global já adotado pelo projeto, sem importação remota no CSS.
- Preservar cabeçalho, rodapé, rotas padrão e `/medcos`, conteúdo, acessibilidade e navegação por tenant.
- Manter as capturas anexadas como referência visual, sem incorporá-las dentro da página.

## Validação
- Comparar visualmente a página completa com a sequência das seis referências.
- Validar computador e celular, incluindo largura, leitura, ritmo vertical e menu.
- Testar todos os links, foco por teclado, modo escuro e redução de movimento.
- Confirmar ausência de erros visuais, de execução e de compilação.
