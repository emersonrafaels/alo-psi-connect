# Melhorias no modal de detalhe dos indicadores (Meu espaço da Coordenação clínica)

## Problemas observados no print
- Lista longa de instituições com 0% sem destaque: Afya (63%) se perde entre várias linhas vazias.
- Texto diz que instituições com menos de 10 alunos aparecem como "Dados protegidos", mas elas aparecem como "0%". Isso confunde: parece que ninguém respondeu.
- Não há contexto de quantos alunos responderam ("63% de quantos?") nem comparação com a média da rede.
- O número grande (59%) não tem leitura rápida (bom/atenção) nem período claro.
- Muito texto corrido; seções sem ícones e sem hierarquia visual.
- Não há ação direta (ex.: "Divulgar Radar por mensagem" ou "Abrir no portal").

## O que vamos mudar
1. Cabeçalho mais rico: valor grande + selo de leitura (ex.: "Abaixo da meta"), período ("Semestre atual") e contagem agregada ("1.650 de 2.800 alunos").
2. Trocar a taxa por instituição pela distribuição: dos alunos que compõem o indicador (ex.: os que responderam o Radar), quantos são de cada instituição, com quantidade e participação somando 100%. Ex.: "Afya — 1.650 alunos · 100%".
   A taxa interna de cada instituição fica só como informação secundária (opcional, ao passar o mouse).
3. Por instituição em três grupos:
   - Com dados (ordenadas do maior para o menor, com marca da média da rede na barra e respondentes/total).
   - Sem participação ainda (0%, recolhida em "Ver N instituições sem respostas").
   - Dados protegidos (menos de 10 alunos), exibidas com selo cinza em vez de 0%.
4. Busca e ordenação na lista quando houver muitas instituições.
5. Cada instituição clicável para abrir o portal já filtrado (mesmo link usado no Meu espaço).
6. Seções "Como é calculado" e "Como interpretar" com ícones e em formato mais compacto (recolhível).
7. Rodapé fixo com ações: "Divulgar por mensagem" (abre mensageria com público pré-selecionado) e "Fechar".
8. Mesmo padrão aplicado a todos os indicadores que usam este modal.

## Detalhes técnicos
- Arquivo: `src/features/staff-home/clinical/IndicatorDetailDialog.tsx` (+ lógica pura em `clinicalHomeLogic.ts` com testes para agrupar protegidas/zero/com dados e ordenar).
- Usar o flag de "protegido" já devolvido pela RPC (n<10) para não converter em 0%; se a RPC não diferenciar, ajustar para retornar `protected: true`.
- Nenhum dado individual novo; só agregados existentes.
