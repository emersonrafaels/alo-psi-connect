# Indicadores clicáveis no Meu espaço da Coordenação clínica

## O que muda
Cada indicador da página (cards de prioridade, níveis de sinal, médias da rede, fluxo de cuidado, Radar e próximos 7 dias) passa a ser clicável e abre um modal com:
- **O que significa**: explicação em linguagem simples (reaproveita os textos dos tooltips).
- **Como é calculado**: período considerado e regra usada, lembrando que não é diagnóstico.
- **Por instituição**: tabela com o valor do indicador em cada instituição, ordenada do maior para o menor, com mini barra; instituições com menos de 10 alunos aparecem como "Dados protegidos".
- **Como interpretar / próximo passo**: orientação curta e botão "Abrir no portal" que leva ao portal da instituição escolhida (ou à triagem quando fizer sentido).
- Alunos nunca são identificados; apenas números agregados.

Cards ganham cursor de clique, foco por teclado e o texto "Ver detalhes".

## Detalhes técnicos
- Novo `src/features/staff-home/clinical/IndicatorDetailDialog.tsx` (shadcn Dialog) e mapa de definições `INDICATOR_DETAILS` em `clinicalHomeLogic.ts` (título, significado, cálculo, chave do campo por instituição, rota de ação).
- Usa os dados por instituição já retornados por `get_clinical_home_summary`; onde algum indicador não tiver quebra por instituição, a RPC é estendida (agregada, com proteção n<10) para incluí-la.
- Testes Vitest para o mapeamento e a regra de proteção n<10.
