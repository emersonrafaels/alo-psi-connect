# Dados fictícios Afya — últimos 7 dias (28/out a 03/nov/2026)

Hoje os registros fictícios da Afya param em 27/out. O plano estende as histórias até hoje, sem mudar o que já existe.

## O que será criado
- **Diário emocional:** novas entradas por dia para os alunos fictícios que já registram com frequência, seguindo o padrão recente de cada um (humor, ansiedade, energia, sono, estresse). Quem escreve pouco continua escrevendo pouco.
- **Alunos com história definida** (os 10 casos de "storytelling" já cadastrados): textos curtos novos, coerentes com o tema de cada um (ex.: ansiedade nas provas, solidão na cidade nova, sobrecarga trabalho+estudo), com a mesma tendência de pontuação. Nenhuma "melhora mágica" ou piora brusca.
- **Práticas e Jornada Emocional:** algumas novas sessões nos 7 dias, usando as práticas que cada história já usa.
- **Radar de Permanência e escalas:** não mudam (são coletas de semestre, não diárias).

## O que fica protegido
- Os 6 casos de estudo com login (Caso A e demais) **também recebem** os 7 dias novos, seguindo a história de cada caso (A/B/C e os derivados), sem mudar login, senha ou registros antigos.
- Nenhum email, WhatsApp ou notificação é enviado.
- Os nomes seguem anonimizados como "Aluno #N" no portal.

## Como confiro
- Contagem de registros por dia nos 7 dias e comparação com a média das semanas anteriores.
- Verificar que Triagem, Métricas e Comparador (Diário emocional) mostram os dias novos.

## Detalhes técnicos
- Estender `scripts/afya-pending-storytelling.ts` (ou script irmão) com geração para a janela 2026-10-28..2026-11-03, com trajetória derivada dos últimos 14 dias de cada aluno + ruído limitado; textos dos STORIES por tema.
- Inserção em uma transação, só para perfis Afya sintéticos, excluindo `synthetic_student_cases`; `upsert` em `mood_entries` com `onConflict: 'user_id,date'`; `journey_sessions`/`praticas_checkouts` com datas na janela.
- Teste pequeno das trajetórias (pontuação dentro de 1–5 e tendência coerente com a história).
