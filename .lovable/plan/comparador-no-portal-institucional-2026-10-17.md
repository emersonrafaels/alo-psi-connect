# Comparador no Portal Institucional

## O que será criado
- Nova opção **Comparador** no Portal Institucional (aba/botão ao lado das demais), abrindo uma nova página `/portal-institucional/comparador` (e equivalente com prefixo do tenant).
- A página reproduz o artefato de referência ("Campus Vivo"), com duas abas: **Visão Geral** e **Análise Integrada**.

## Aba Visão Geral
- Cabeçalho "Como está o bem-estar da sua população", com seletor de coleta semestral (ex.: 2025.2 / 2026.1 / 2026.2) e filtro de unidade.
- Quatro cartões: População no recorte (ativos), Cobertura WHO-5, Participantes do Diário Emocional, Ações em curso.
- Tabela "Indicadores por instrumento": WHO-5, PSS-10, GAD-7, PHQ-9, ISI, MHC-SF e **IQoL** — com média, barra de posição na escala, variação (favorável/estável/desfavorável) e mini-gráfico de 3 coletas.
- **IQoL aparece zerado** (média 0, n=0, sem variação), com indicação "ainda não disponível".
- "Pede atenção": maiores mudanças desfavoráveis por curso (amostra mínima).
- "Mapa de unidades e cursos": matriz unidade x curso colorida em relação à média da rede, com seletor de escala; grupos com n < 10 ficam protegidos.
- Funil de "Participação" e lista "Planos de apoio em andamento".
- Aviso: rastreamento não é diagnóstico; nenhum resultado individual é exibido.

## Aba Análise Integrada
- Comparação lado a lado entre recortes (unidade, curso, turno, turma — respeitando a hierarquia escolhida pela instituição) para cada escala, cruzando escalas com Diário Emocional e participação ao longo das coletas.
- Mesmo padrão visual e proteção de grupos pequenos.

## Dados
- Usa os dados reais já existentes (escalas, diário, alunos vinculados e estrutura acadêmica), sempre agregados e anonimizados. Nada novo no banco nesta etapa.
- IQoL fixo em zero até a escala ser incluída na plataforma.

## Observação
O artefato só pôde ser lido parcialmente (a aba Análise Integrada não veio no conteúdo). Se puder, anexe um print dessa aba para que a reprodução fique fiel.

## Técnico
- Nova página `src/pages/institution/InstitutionComparator.tsx` + hook `useInstitutionComparator` agregando `scale_responses`/`mood_entries` por coleta semestral e por nível acadêmico.
- Rota registrada em `App.tsx` e em `knownRoutes`; link adicionado nas abas de `InstitutionPortal.tsx`.
- Estilo com tokens semânticos existentes; grupos com n < 10 suprimidos no cliente e consulta.
