# Plano: Dataset Simulado de Pacientes para ML de Risco

## Objetivo

Gerar um arquivo `.csv` (e `.xlsx` opcional) com uma linha por paciente simulado, contendo todas as features que a plataforma coleta hoje, mais um rótulo `risk_label` (0 = sem risco, 1 = em risco) para treinar um modelo de classificação.

O dataset será **100% sintético** (não usa dados reais de pacientes da base), mas seguirá fielmente o schema e as distribuições reais do sistema (escalas 1-5, faixas etárias, padrões de engajamento, etc.).

## Tamanho e estrutura

- **N = 5.000 pacientes simulados** (configurável)
- ~30% rotulados como "em risco" para gerar uma base balanceada-ish
- Saída: `/mnt/documents/pacientes_ml_dataset.csv` + `pacientes_ml_dataset.xlsx`
- Bônus: `pacientes_ml_dictionary.csv` com descrição de cada coluna

## Features incluídas (≈60 colunas)

Agrupadas por origem na plataforma:

### Demografia (`profiles` + `pacientes`)
- `patient_id`, `idade`, `genero`, `estado`, `cidade_porte` (capital/interior)
- `tipo_usuario` (sempre paciente), `is_student`, `nivel_educacional`
- `dias_desde_cadastro`, `tem_foto_perfil`, `completou_onboarding`

### Vínculo institucional (`patient_institutions`, `educational_institutions`)
- `tem_instituicao`, `tipo_instituicao` (publica/privada), `enrollment_status`
- `instituicao_tem_parceria`, `dias_vinculado_instituicao`

### Contatos de emergência (`patient_emergency_contacts`)
- `qtd_contatos_emergencia` (0-3), `tem_contato_familiar`

### Diário emocional — agregados de `mood_entries` (últimos 30/90 dias)
- `total_entries_30d`, `total_entries_90d`, `dias_consecutivos_streak`
- `avg_mood_30d`, `avg_anxiety_30d`, `avg_energy_30d`, `avg_sleep_quality_30d`, `avg_sleep_hours_30d`
- `std_mood_30d`, `std_anxiety_30d` (volatilidade)
- `min_mood_30d`, `max_anxiety_30d`
- `tendencia_mood_30d` (slope linear), `tendencia_anxiety_30d`
- `dias_mood_baixo` (mood ≤ 2), `dias_anxiety_alta` (anxiety ≥ 4)
- `pct_dias_com_journal`, `avg_journal_length`
- `general_score_avg` (composite per memória do projeto)

### Emoções dinâmicas (`emotion_values`)
- `top_emocao_1`, `top_emocao_2`, `top_emocao_3`
- `pct_emocoes_negativas` (tristeza, raiva, medo, ansiedade)
- `diversidade_emocional` (entropia)

### Análises de IA (`mood_entry_analyses`, `mood_insight_analyses`)
- `qtd_analyses_risk_high`, `qtd_analyses_risk_medium`, `ultima_risk_level`
- `qtd_insights_gerados`

### Triagem institucional (`student_triage`)
- `ja_triado`, `qtd_triagens`, `ultima_triagem_risk_level`, `ultima_triagem_priority`
- `dias_desde_ultima_triagem`, `triagem_resolvida`

### Engajamento WhatsApp (`whatsapp_*`)
- `usa_whatsapp`, `qtd_msgs_whatsapp_30d`, `dias_desde_ultima_msg_wpp`
- `tem_lembretes_ativos`, `solicitou_especialista`

### Agendamentos (`agendamentos`)
- `qtd_agendamentos_total`, `qtd_realizados`, `qtd_cancelados`, `qtd_no_show`
- `dias_desde_ultimo_agendamento`, `tem_proximo_agendamento`

### Conteúdo / blog (`blog_post_views_tracking`, `blog_saved_posts`, `comments`)
- `qtd_posts_lidos_30d`, `qtd_posts_salvos`, `qtd_comentarios`
- `tempo_medio_leitura`

### Sessões em grupo (`group_session_registrations`)
- `qtd_inscricoes_grupos`, `qtd_grupos_compareceu`, `taxa_no_show_grupos`

### Cupons e financeiro (`coupon_usage`, `user_booking_tracking`)
- `usou_cupom`, `qtd_bookings_iniciados`, `taxa_conversao_booking`

### Rótulo
- `risk_label` (0/1) — gerado a partir de uma função-verdade que combina pesadamente: anxiety alto, mood baixo, tendência negativa, triagem prévia, baixo engajamento, ausência de contatos de emergência. Adiciona ~10% de ruído para ser realista.

## Lógica de geração

Script Python único (`/tmp/gen_dataset.py`):
1. Define distribuições por feature (gaussianas truncadas, categorias com pesos baseados na realidade RBE)
2. Gera correlações realistas (ex: alta ansiedade ↔ baixo sono ↔ mood baixo)
3. Cria dois "modos": pacientes saudáveis vs em risco, com sobreposição
4. Aplica função de risco (regra + ruído) → `risk_label`
5. Salva CSV, XLSX e dicionário de dados

Sem dependências extras — usa `numpy`, `pandas`, `openpyxl` (já disponíveis).

## Entregáveis

- `/mnt/documents/pacientes_ml_dataset.csv` (~5000 linhas × 60 colunas)
- `/mnt/documents/pacientes_ml_dataset.xlsx` (mesmo conteúdo)
- `/mnt/documents/pacientes_ml_dictionary.csv` (nome, tipo, descrição, range)
- Resumo no chat: estatísticas básicas e distribuição do `risk_label`

## Pontos a confirmar

- N = 5.000 está bom? (posso fazer 1k, 10k, 50k)
- Quer apenas CSV ou também XLSX?
- Quer que eu inclua dados reais agregados/anonimizados em vez de 100% sintético? (Mais realista, mas requer cuidado com privacidade — recomendo sintético)
