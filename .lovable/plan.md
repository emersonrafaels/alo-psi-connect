# Triagem – Fase 1 (orientações do documento)

Mesma navegação e mesmas listas; mudam nomes, regras de cálculo, motivos e a separação entre "nível dos sinais" e "situação do atendimento".

## 1. Nomes e textos
- "Em Risco" -> **Sinal elevado** (valor interno continua `critical`); "Em Risco em acompanhamento" -> "Sinal elevado · acompanhamento ativo".
- "Saudável"/"Estável" -> **Sem sinais prioritários**; "Sem Dados" -> **Dados insuficientes**. Alerta e Atenção mantidos, com novas descrições.
- Aplicado em todas as telas da triagem (Resumo, Prioridades, Fila, Todos os alunos, Métricas, funil, modelos de nota).
- Botão "Como a criticidade é calculada" -> **"Como os sinais são identificados e priorizados"**, abrindo uma janela maior e rolável (fecha com Esc) com o texto da seção 4: os cinco níveis com suas cores, os fatores complementares e o aviso fixo "não representam diagnóstico...".
- Botão de ação: "Triar" para quem nunca foi triado, "Revisar" quando já existe triagem anterior.

## 2. Regras de cálculo
- Mesmos limites atuais (seção 2). Prevalece o nível mais alto atingido; os outros motivos continuam como etiquetas.
- **Queda de humor não eleva mais sozinha para Sinal elevado.** Vira só a etiqueta "Queda relevante de humor", e só quando houver registros comparáveis nos dois períodos (nunca "0%" ou porcentagem sobre base vazia).
- Valores ausentes não contam como zero (corrige o cálculo atual de tendência, que hoje trata humor vazio como 0).
- Sem nenhuma métrica válida -> Dados insuficientes (nunca "Sem sinais prioritários"). Se faltar humor mas houver ansiedade/energia/sono, classificar pelo que existe.
- Um único registro: mostra o valor com etiqueta "Registro isolado" e ressalva de base limitada, sem esconder o sinal.
- Cada aluno mostra nº de registros válidos e data do último registro.

## 3. Etiquetas por aluno (três perguntas)
- Nível: as cinco categorias.
- Motivos reais acionados: Humor médio baixo, Ansiedade elevada, Energia muito baixa, Sono baixo, Queda relevante de humor, Registros insuficientes para tendência.
- Situação do atendimento, em etiqueta separada da cor: Ainda não triado, Em acompanhamento, Retorno vencido, Triagem concluída. A cor nunca muda por retorno vencido.

## 4. Palavras sensíveis do diário separadas da cor
- A cor passa a depender só das notas. Os termos detectados viram um marcador próprio **"Sinal textual sensível: revisão pendente"**, sem mostrar texto do diário.
- Para não desligar uma proteção silenciosamente: esses alunos continuam aparecendo em Prioridades, num bloco próprio e identificado, acima da fila numérica. Nenhum envio novo de alerta é criado.

## 5. Ordem da fila e filtro de período
- Prioridades: bloco de sinais textuais (se houver), depois agrupado por Sinal elevado, Alerta, Atenção; dentro de cada nível, pendências (retorno vencido, não triado) primeiro, ordenadas pela data da pendência. Uma linha curta explica a ordenação.
- O filtro de 30 dias muda só os indicadores; triagens e acompanhamentos abertos de antes continuam visíveis, com aviso "pendência anterior ao período".

## 6. Testes
Testes para: precedência dos níveis; humor 2,5 + queda de 50% continua Alerta; sem dados -> Dados insuficientes; vazio não vira zero; registro isolado; queda sem base comparável não aparece; retorno vencido não muda a cor; pendência antiga aparece com filtro de 30 dias; ordenação; Triar x Revisar.

## Fora desta fase (precisa de decisão da coordenação)
Aprovação clínica dos textos e limites, quem pode ver o marcador textual, revisão de permissões por perfil e novos registros de auditoria. Vou apenas listar o que já é registrado hoje (quem triou, quando, motivos) e apontar lacunas, sem mudar permissões.

## Detalhes técnicos
- `calculateRiskLevel`/`calculateTrend` em `useStudentTriage.tsx`: remover `moodTrend <= -40` do nível crítico, filtrar `mood_score` nulos, classificar por métricas disponíveis; extrair para módulo puro testável (`src/features/triage/signalRules.ts`) com motivos e contagens.
- `escalateRisk` (`criticalTerms.ts`) deixa de alterar o nível; resultado vai para um campo `textSignal` separado.
- Rótulos centralizados num único mapa usado por StudentTriageTab, PendingQueue, AllStudents, TriageViews, TriageFunnel, métricas e `triageNoteTemplates`.
- Consulta de pendências abertas sem o filtro de período.
- Atualizar a memória "Em Risco" -> "Sinal elevado" e registrar a regra de separação no AGENTS.md.
