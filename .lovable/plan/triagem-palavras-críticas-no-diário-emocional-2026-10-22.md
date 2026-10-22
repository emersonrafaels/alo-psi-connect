# Triagem: palavras críticas no Diário Emocional

## O que muda para o usuário
- **Painel admin, nova página "Palavras críticas"**: lista de palavras e expressões que se pode editar. Cada termo tem:
  - **Gravidade**: Grave (sobe direto para Crítico) ou Moderada (sobe um nível, por exemplo de Atenção para Alerta).
  - Ativo/inativo, além de adicionar, editar e remover termos.
- A lista já vem com termos sugeridos em português:
  - **Grave**: suicídio, me matar, quero morrer, tirar minha vida, não aguento mais viver, me cortar, automutilação, acabar com tudo, sem razão para viver.
  - **Moderada**: morte, morrer, desesperado, sem saída, sozinho no mundo, ninguém se importa, inútil, vazio, não aguento mais, crise de pânico.
- A busca ignora acentos e maiúsculas. Uma palavra só conta quando aparece inteira, então "morte" não marca "mortadela".
- **Na Triagem**: quando o diário do aluno no período analisado tem um termo da lista, a criticidade sobe. O aluno ganha o selo "Palavra crítica no diário" e mostra quantas ocorrências teve e quando foi a última.
- **Privacidade**: a instituição não vê o texto do diário nem a palavra encontrada. Ela vê só o selo, a gravidade e a data. O aluno continua aparecendo como `Aluno #N`.
- Ninguém recebe aviso ou notificação automática nesta etapa.

## Detalhes técnicos
- Nova tabela `triage_critical_terms` (term, severity `grave|moderate`, is_active, created_by, timestamps). Somente admins da plataforma editam e o RPC lê no servidor. Antes de escrever o SQL, confiro as regras do esquema (GRANTs e RLS).
- Novo RPC `get_institution_critical_flags(institution_id, since date)`, com SECURITY DEFINER e o mesmo controle de acesso institucional dos outros RPCs do portal:
  - Junta os campos de texto do `mood_entries` dos alunos vinculados.
  - Normaliza o texto com `unaccent` + `lower` e compara palavra inteira por regex.
  - Devolve por paciente só `max_severity`, `hits` e `last_date`, nunca o texto.
- `useStudentTriage.tsx`:
  - Chama o RPC em paralelo com as outras consultas.
  - Depois de `calculateRiskLevel`, aplica o aumento: grave vira `critical`, moderada sobe um nível (o máximo é `critical`).
  - Adiciona `criticalKeywordFlag` ao objeto do aluno.
- UI:
  - Selo na lista e no detalhe da Triagem (`StudentTriageTab.tsx`).
  - Nova página admin (rota e link no menu admin) usando os componentes shadcn que já existem.
- Teste unitário para a regra de aumento: grave vira Crítico, moderada sobe um nível, e o nível nunca passa de Crítico.
