-- Corrigir o template de chat AI malformado e renomear para ser consistente com o código
UPDATE system_configurations 
SET 
  key = 'chat_payload_template',
  value = '{
    "event": "ai_chat_message",
    "timestamp": "{{timestamp}}",
    "session_id": "{{session_id}}",
    "user": {
      "message": "{{user_message}}",
      "context": "{{context}}",
      "page": "{{page}}",
      "filters": "{{filters}}",
      "professionals": "{{professionals}}"
    },
    "platform": "alopsi"
  }'::jsonb,
  description = 'Template do payload para webhook N8N do chat AI - JSON válido',
  updated_at = now(),
  updated_by = auth.uid()
WHERE category = 'n8n_chat' AND key = 'payload_template';

-- Atualizar categoria para ser consistente
UPDATE system_configurations 
SET category = 'n8n'
WHERE category = 'n8n_chat';

-- Garantir que os templates de booking e payment estão com JSON válido
UPDATE system_configurations 
SET 
  value = '{
    "event": "appointment_created",
    "appointment": {
      "id": "{{appointment.id}}",
      "patient_name": "{{appointment.nome_paciente}}",
      "patient_email": "{{appointment.email_paciente}}",
      "professional_name": "{{professional.display_name}}",
      "date": "{{appointment.data_consulta}}",
      "time": "{{appointment.horario}}",
      "value": "{{appointment.valor}}"
    }
  }'::jsonb,
  updated_at = now(),
  updated_by = auth.uid()
WHERE category = 'n8n' AND key = 'booking_payload_template';

UPDATE system_configurations 
SET 
  value = '{
    "event": "payment_updated",
    "appointment": {
      "id": "{{appointment.id}}",
      "payment_status": "{{appointment.payment_status}}",
      "patient_email": "{{appointment.email_paciente}}"
    }
  }'::jsonb,
  updated_at = now(),
  updated_by = auth.uid()
WHERE category = 'n8n' AND key = 'payment_payload_template';