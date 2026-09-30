# Página “Como funciona”

## Objetivo
Criar uma página pública em `/como-funciona`, reproduzindo fielmente o visual, os textos e a ordem das seis referências anexadas, adaptada para computador, tablet e celular.

## Estrutura da página
1. **Cabeçalho e abertura**
   - Usar o cabeçalho existente da Rede Bem-Estar.
   - Reproduzir a abertura “Mensuração contínua da saúde mental”, com foto principal, cartões flutuantes e botão “Conheça nossa solução”.
   - Logo abaixo, apresentar “Como funciona” com os três pilares: Escalas validadas, Diário Emocional e Buddy sempre por perto.

2. **Inteligência ao longo da jornada**
   - Bloco “Inteligência que reconhece cada jornada”.
   - Gráfico ilustrativo de evolução individual, período de seis meses e indicação de tendência.

3. **Acompanhamento pelo Buddy**
   - Linha do tempo nas cinco fases do semestre: início, durante o semestre, check-ins, momentos críticos e final do semestre.
   - Quatro exemplos visuais de mensagens do Buddy.
   - Indicador de impacto “+78% de aumento na adesão”.

4. **Escalas validadas**
   - Grade com WHO-5, PHQ-9, GAD-7, PSS-10, MHC-SF e ISI.
   - Manter títulos, descrições, ícones e setas conforme a referência.

5. **Rede de apoios**
   - Grade de Psicologia, Psiquiatria, Psicopedagógico, Mentoria, Grupos, Tutoria acadêmica, Apoio pedagógico, Serviço social e Acessibilidade.
   - Reproduzir a hierarquia, cores e ícones da referência.

6. **Dados, segurança e privacidade**
   - Comparativo “Leitura individual” e “Visão institucional”.
   - Bloco de confiança com anonimização, LGPD, infraestrutura segura e governança.
   - Encerramento “Confidencialidade em todas as etapas”, com ilustração de escudo/cadeado, três garantias e botão para a Política de Privacidade.
   - Usar o rodapé existente ao final.

## Navegação e ações
- Adicionar “Como funciona” no menu superior imediatamente após “Práticas”, tanto no computador quanto no menu móvel.
- Criar a rota pública principal e a rota equivalente com prefixo de tenant, seguindo o padrão atual.
- Ligar os botões às páginas reais: solução/contato, escalas, recursos de apoio e Política de Privacidade.
- Incluir a nova página no sitemap público e restaurar o topo ao entrar nela.

## Fidelidade visual
- Reproduzir o fundo claro, tipografia forte, destaques em roxo/rosa/turquesa, cartões compactos e sequência exata das referências.
- Criar os recursos visuais necessários para a foto de abertura e o escudo de privacidade; reutilizar o Buddy oficial já existente.
- Construir gráfico, linha do tempo, cartões e ícones como elementos nativos da página, sem inserir as capturas anexas como imagens.
- Manter proporções e composição próximas às referências em telas largas; no celular, reorganizar os mesmos blocos sem cortes, sobreposições ou texto ilegível.
- Respeitar os temas e as cores institucionais já definidos no projeto.

## Detalhes técnicos
- Criar a página em um componente próprio e separar blocos repetidos em componentes locais e listas de dados.
- Reutilizar Header, Footer, Button, ícones e utilitários de navegação existentes.
- Definir tokens semânticos específicos da página no sistema global de estilos, incluindo equivalentes para modo escuro.
- Atualizar título e descrição da página durante a navegação.
- Registrar a decisão estrutural no arquivo de arquitetura e acompanhar a entrega no roadmap.

## Validação
- Conferir a sequência completa contra as seis imagens.
- Testar links e botões.
- Validar visualmente em desktop e celular, incluindo menu móvel, legibilidade, alinhamentos e ausência de sobreposição.
- Confirmar compilação sem erros e revisar os registros de execução do preview.
