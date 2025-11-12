-- Adicionar coluna coupon_id na tabela agendamentos
ALTER TABLE agendamentos 
ADD COLUMN coupon_id UUID REFERENCES institution_coupons(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX idx_agendamentos_coupon_id ON agendamentos(coupon_id);

-- Comentário explicativo
COMMENT ON COLUMN agendamentos.coupon_id IS 'Referência ao cupom de desconto aplicado no agendamento';