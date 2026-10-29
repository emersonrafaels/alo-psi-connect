# Radar de Permanência no Comparador

Novo item no menu lateral do Comparador, logo após "Conteúdos e práticas", com a página reproduzida a partir do arquivo enviado (cores, espaçamentos, cartões, botão de tela cheia e animações do modelo).

## Seções da página (na ordem do modelo)
- **Topo:** título "O que acontece fora da sala e pesa na decisão de ficar", seletor de recorte (toda a instituição ou unidade), semestres 2025.2 / 2026.1 / 2026.2 e cartões de indicadores.
- **01 · Quem são os estudantes:** de cada 100 respondentes, quem trabalha muitas horas, cuida de alguém ou tem trajeto longo; perfis selecionáveis com destaque.
- **02 · Intenção de permanência:** quatro cartões separados (rematrícula, trancamento, abandono, mudança de curso) com distribuição e comparação entre unidades; bloco "Permanência recuperável" e principais ameaças.
- **03 · O que pesa fora da sala:** barras a partir do centro por barreira (últimos 30 dias) e apoios materiais pedidos.
- **04 · Demanda oculta**, **05 · Vínculo com o curso e a instituição**, **07 · Voz dos estudantes** e **08 · Ficha técnica**, como no modelo.
- Aviso de leitura protegida: só tendências coletivas, grupos com menos de 10 pessoas ocultos, sem previsão de evasão.

## Dados
A plataforma ainda não coleta o questionário de permanência. Os números virão de uma tabela agregada por unidade e semestre (sem respostas individuais), preenchida com dados demonstrativos para a Afya, seguindo os valores do modelo para 2026.2 e semestres anteriores ligeiramente diferentes. Outras instituições verão "Ainda sem dados".

## Detalhes técnicos
- Pasta `src/features/institution/comparator/permanence/` com `PermanenceView.tsx` e regras puras em `permanenceLogic.ts` (agregação por recorte, ocultar n<10, comparações) com testes.
- Tabela `institution_permanence_snapshots` (institution_id, unit, semester, respondents, payload jsonb), leitura pela equipe da instituição via RLS; seed Afya.
- Registro do item no menu e roteamento do Comparador; regra adicionada em `AGENTS.md`.
