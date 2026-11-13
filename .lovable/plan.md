# Mais variedade de níveis de sinal nos alunos Afya (últimos 30 dias)

## Situação atual (últimos 30 dias, análises do diário Afya)
- Sem sinais prioritários: 819
- Atenção: 322
- Alerta: 100
- Sinal elevado: 40
- Muitos alunos sem análise recente caem em "Dados insuficientes".

## O que será feito
1. Redistribuir os níveis de sinal dos alunos fictícios da Afya nos últimos 30 dias, seguindo o storytelling de cada um:
   - ~55% Sem sinais prioritários, ~25% Atenção, ~12% Alerta, ~5% Sinal elevado, ~3% Dados insuficientes (sem registros no período).
   - Cada aluno terá trajetória coerente (ex.: piora gradual, melhora após apoio, oscilação), não valores aleatórios dia a dia.
2. Ajustar as notas do diário (humor, ansiedade, sono, energia) para combinar com o nível atribuído, e criar análises onde faltam.
3. Manter intactos os três casos de estudo protegidos (A/B/C) e os alunos com login real.
4. Não enviar emails, notificações nem abrir pedidos de apoio automáticos (registros marcados como sintéticos).

## Resultado
Triagem, Comparador, Visão geral e o Meu espaço da Coordenação clínica passam a mostrar os cinco níveis com volumes realistas.

## Detalhes técnicos
- Script em `scripts/` seguindo o padrão de `afya-pending-storytelling.ts`, em transação com guardas só-sintéticos e suprimindo o gatilho `mood_analysis_care_request` para essas linhas.
- Upsert em `mood_entries` (onConflict `user_id,date`) e `mood_entry_analyses` (risk_level, source sintético).
- Teste da distribuição/trajetórias e verificação final por consulta agregada.
