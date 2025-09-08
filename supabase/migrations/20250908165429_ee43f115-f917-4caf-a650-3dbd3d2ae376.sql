-- Cancelar agendamentos vencidos não pagos
UPDATE agendamentos 
SET status = 'cancelado', 
    payment_status = 'failed',
    updated_at = now()
WHERE status = 'pendente' 
  AND payment_status = 'pending_payment'
  AND data_consulta < CURRENT_DATE
  AND mercado_pago_preference_id IS NOT NULL;