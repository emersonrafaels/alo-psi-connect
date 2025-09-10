-- Update the chat AI payload template to have correct structure
UPDATE system_configurations 
SET value = '{
  "event": "ai_chat_message",
  "timestamp": "{{timestamp}}",
  "session_id": "{{session_id}}",
  "user": {
    "message": "{{user_message}}",
    "context": "{{context}}",
    "page": "{{page}}",
    "filters": {{filters}}
  },
  "professionals": {{professionals}},
  "platform": "alopsi"
}'
WHERE category = 'n8n' AND key = 'chat_payload_template';