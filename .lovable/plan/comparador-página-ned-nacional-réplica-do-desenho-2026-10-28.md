# Comparador — página "NED Nacional" (réplica do desenho)

Ativar o item "NED Nacional" (hoje "Em breve") no menu do Comparador, com seletor de semestre e filtro por região, botão de ampliar cada ficha e visual fiel ao desenho. Só dados do serviço de cada NED, nunca de estudantes.

## NEDs exibidos
10 NEDs demonstrativos da Afya: Contagem, Itajubá e Montes Claros (as 3 unidades reais) + 7 unidades fictícias em outros estados (Sudeste, Nordeste e Norte), usadas somente nesta página.

## Seções (na ordem do desenho)
1. Cabeçalho "Como estão os NEDs da Afya, lado a lado" e escopo "10 NEDs · Afya".
2. Quatro números nacionais e o bloco "Pede atenção agora" (NEDs com alertas).
3. Painel dos NEDs: tabela com cada indicador comparado à mediana nacional (melhor / perto / pede atenção), ordenação por coluna, filtro por região e linha da mediana.
4. Ficha do NED: abas, troca de NED, indicadores vs mediana, pontos fortes e de atenção, equipe frente ao regulamento (coordenação, psicopedagogia, psicologia, apoio), como o NED funciona (rotina de gestão), principais demandas com traço da mediana, leitura e botão "Registrar plano de ação com o NED".
5. Procura x tamanho da equipe: dispersão com quatro quadrantes, cor pela espera (até 7 dias / acima), medianas nacionais.
6. Boas práticas: lista de práticas de origem, resultado antes/depois, o que precisa para replicar e onde pode ajudar (com traço da mediana).
7. De onde vem cada número: proposta de indicadores agrupados por fonte, marcada "Proposta · a validar com a Afya".

## Dados
A plataforma não registra equipe, regulamento nem rotina de gestão dos NEDs. Vou criar um registro próprio por NED e semestre (região/UF, matriculados, atendidos, horas de equipe, espera, equipe por função vs regulamento, rotina de gestão, demandas) e as boas práticas, preenchidos com dados demonstrativos inventados para a Afya. Nenhum aluno é tocado e nada é enviado. O botão "Registrar plano de ação" salva um plano simples (NED, texto, autor, data) visível só à equipe da instituição.

## Detalhes técnicos
- Tabelas `institution_ned_snapshots`, `institution_ned_practices` e `institution_ned_action_plans`, com GRANTs e RLS (equipe da instituição lê; admin altera snapshots/práticas; equipe cria planos).
- UI em `src/features/institution/comparator/ned/` (`NedView.tsx` + regras puras `nedLogic.ts` com testes: mediana, classificação vs mediana com direção do indicador, quadrante, alertas, ordenação por atenção).
- Registrar a decisão no AGENTS.md.
