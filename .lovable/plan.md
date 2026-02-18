

## Perfil de Atividades do Aluno ao Clicar no Nome

### O que muda
Ao clicar no nome de qualquer aluno na aba de triagem (em qualquer sub-aba), abre um modal mostrando as principais atividades dele no site: diarios emocionais recentes, sentimentos predominantes, e historico completo de triagens.

### Componentes do modal

**1. Cabecalho**: Avatar com iniciais, nome, nivel de risco atual (badge), e quantidade de registros nos ultimos 14 dias.

**2. Aba "Diario Emocional"**:
- Lista dos ultimos 14 dias de registros emocionais (data, humor, ansiedade, energia, sono)
- Sentimentos predominantes (top 3 emocoes mais registradas via `emotion_values`)
- Mini grafico sparkline de evolucao do humor
- Tags e texto do diario (se houver)

**3. Aba "Historico de Triagens"**:
- Todas as triagens desse aluno, com data, prioridade, acao recomendada, notas, quem triou, status
- Timeline visual com icones de status

**4. Aba "Consultas"** (reusa o `UserStorytellingModal` existente):
- Consultas agendadas/realizadas/canceladas
- Cupons utilizados

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/hooks/useStudentTriage.tsx` | Adicionar `profileId` e `userId` ao interface `StudentRiskData` e retorna-los no map de dados |
| `src/hooks/useStudentActivityData.tsx` | **Novo** - Hook que busca mood_entries recentes (com emotion_values, tags, journal_text), triagens do aluno, e calcula sentimentos predominantes |
| `src/components/institution/StudentActivityModal.tsx` | **Novo** - Modal com abas mostrando diario emocional, sentimentos, historico de triagens |
| `src/components/institution/StudentTriageTab.tsx` | Tornar nomes dos alunos clicaveis (cursor-pointer, underline on hover) em todas as 4 sub-abas. Adicionar state para o modal e renderiza-lo. Criar um map de patientId -> {profileId, userId} para as sub-abas de triagem. |

### Interacao do usuario
- Clicar no nome do aluno em qualquer sub-aba -> abre o modal
- O nome tera estilo de link (cursor pointer, hover underline, cor primary)
- O modal abre com a aba "Diario Emocional" como padrao
- Pode navegar entre as abas dentro do modal

### Dados buscados pelo novo hook
- `mood_entries` dos ultimos 30 dias (profile_id, mood_score, anxiety_level, energy_level, sleep_quality, sleep_hours, date, tags, journal_text, emotion_values)
- `student_triage` records para o patient_id
- Calculo de top emocoes a partir de emotion_values agregados

### Sem mudancas no banco de dados
Usa tabelas existentes: `mood_entries`, `student_triage`, `profiles`. Nenhuma migracao necessaria.

