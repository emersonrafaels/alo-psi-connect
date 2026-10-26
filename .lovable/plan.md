# Radar Institucional: trocar "Rascunho" por checkpoint recuperável

## O que muda para o usuário
- Some a palavra "Rascunho" da página (selo, histórico e aviso "Rascunho salvo automaticamente").
- O preenchimento continua sendo guardado sozinho enquanto a pessoa responde, agora chamado de **checkpoint**.
- Ao entrar no Radar, se existir um preenchimento não concluído da instituição, abre logo uma janela:
  - "Encontramos um preenchimento em andamento"
  - Quando: "Salvo em 26/10/2026 às 18:40 (há 2 horas)"
  - Quem: nome de quem estava preenchendo (ou e-mail, se não houver nome)
  - Etapa em que parou (ex.: "Etapa 4 de 7")
  - Botões: **Continuar de onde parou** e **Começar do zero**
- "Continuar" abre o formulário já com as respostas e na etapa salva.
- "Começar do zero" pede confirmação, descarta aquele checkpoint e abre o formulário vazio.
- O histórico passa a listar só diagnósticos concluídos.
- Durante o preenchimento, um indicador discreto mostra "Checkpoint salvo às 18:42".

## Detalhes técnicos
- `useInstitutionRadar.tsx`: renomear `useSaveRadarDraft` para `useSaveRadarCheckpoint` (mesmo comportamento, status interno `draft` mantido no banco). Adicionar `useRadarCheckpoint(institutionId)` que busca o registro `status='draft'` mais recente, com nome/e-mail de quem preencheu via `profiles` (`filled_by_user_id`), e `useDiscardRadarCheckpoint` (marca `archived`). Salvar também a etapa atual dentro de `adaptive_answers`.
- `RadarForm.tsx`: aceitar `initial` (id, respostas, etapa), trocar o texto do indicador, salvar a etapa.
- Novo `RadarCheckpointDialog.tsx` com data (date-fns pt-BR, relativa + absoluta), autor, etapa e as duas ações.
- `InstitutionRadar.tsx`: abrir o diálogo ao carregar quando houver checkpoint; botão "Iniciar/Atualizar diagnóstico" também passa pelo diálogo; filtrar histórico para `submitted`; remover o cartão "Rascunho".
- Sem mudança de esquema; verificar se a policy de UPDATE permite arquivar o checkpoint de outro membro da instituição e ajustar se necessário.
