# 🎟️ Sistema de Cupons e Promoções para Instituições Parceiras

## Visão Geral

Sistema completo e flexível de cupons de desconto para instituições de ensino parceiras. Permite criar promoções com diversos tipos de descontos, condições e validações.

## Estrutura do Banco de Dados

### Tabela `institution_coupons`
Armazena os cupons/promoções:

- **Informações Básicas**: código, nome, descrição
- **Desconto**: tipo (percentual/fixo), valor, limite máximo
- **Aplicabilidade**: todos, profissionais específicos, especialidades, primeira consulta
- **Condições**: valor mínimo, limites de uso (total e por usuário)
- **Validade**: data início/fim, status ativo/inativo
- **Metadados**: campo JSONB flexível para expansões futuras

### Tabela `coupon_usage`
Rastreia cada uso de cupom:
- Cupom usado
- Usuário
- Agendamento relacionado
- Valores (original, desconto, final)
- Data/hora do uso

### Função `validate_coupon`
Valida cupons considerando:
- ✅ Cupom ativo e dentro da validade
- ✅ Limites de uso não excedidos
- ✅ Valor mínimo atingido
- ✅ Aplicabilidade ao profissional/especialidade
- ✅ Retorna valores calculados do desconto

## Interface de Gerenciamento

### Na Página de Instituições (`/admin/instituicoes`)

Instituições **com parceria** (`has_partnership = true`) terão um botão de **Ticket** (ícone 🎟️) na coluna de ações.

### Modal de Gerenciamento de Cupons

Ao clicar no botão Ticket, abre modal com:

#### Criar/Editar Cupom:
- Código do cupom (pode gerar automaticamente)
- Nome e descrição da promoção
- Tipo de desconto (percentual ou valor fixo)
- Valor do desconto
- Desconto máximo (para percentuais)
- Aplicabilidade (todos, profissionais específicos, especialidades, primeira consulta)
- Valor mínimo de compra
- Limites de uso (total e por usuário)
- Período de validade
- Status ativo/inativo

#### Lista de Cupons:
- Visualização de todos os cupons cadastrados
- Código, status, valor, uso atual/limite
- Ações: editar, copiar código, deletar

## Integração no Agendamento

### 1. Importar Componentes

```tsx
import { CouponValidator } from '@/components/CouponValidator';
import { useCouponTracking } from '@/hooks/useCouponTracking';
```

### 2. No Componente de Agendamento

```tsx
const [appliedCoupon, setAppliedCoupon] = useState<{
  couponId: string;
  code: string;
  discountAmount: number;
  finalAmount: number;
} | null>(null);

const { recordCouponUsage } = useCouponTracking();

// Renderizar componente de cupom
<CouponValidator
  professionalId={selectedProfessional.id}
  amount={consultationPrice}
  tenantId={tenant.id}
  onCouponApplied={(discount) => {
    setAppliedCoupon(discount);
    // Atualizar valor final do agendamento
  }}
  onCouponRemoved={() => {
    setAppliedCoupon(null);
    // Restaurar valor original
  }}
/>
```

### 3. Após Confirmação do Agendamento

```tsx
// Registrar uso do cupom se foi aplicado
if (appliedCoupon && appointmentId) {
  recordCouponUsage({
    couponId: appliedCoupon.couponId,
    appointmentId: appointmentId,
    originalAmount: consultationPrice,
    discountAmount: appliedCoupon.discountAmount,
    finalAmount: appliedCoupon.finalAmount,
  });
}
```

## Exemplos de Cupons

### 1. Desconto Percentual Simples
```
Código: PROMO20
Tipo: Percentual
Valor: 20%
Desconto Máximo: R$ 50
Aplica-se: Todos
```

### 2. Primeira Consulta
```
Código: BEMVINDO
Tipo: Valor Fixo
Valor: R$ 30
Aplica-se: Primeira Consulta
Usos por Usuário: 1
```

### 3. Especialidade Específica
```
Código: ANSIEDADE10
Tipo: Percentual
Valor: 10%
Aplica-se: Especialidades Específicas
Especialidades: ["Ansiedade", "Síndrome do Pânico"]
```

### 4. Profissional Específico
```
Código: DRJOAO15
Tipo: Percentual
Valor: 15%
Aplica-se: Profissionais Específicos
IDs: [42, 67]
Limite Total: 100 usos
```

### 5. Campanha com Valor Mínimo
```
Código: BLACK50
Tipo: Valor Fixo
Valor: R$ 50
Valor Mínimo: R$ 200
Validade: 24/11/2024 a 30/11/2024
Limite Total: 500 usos
```

## Validações Automáticas

O sistema valida automaticamente:

1. ✅ **Expiração**: Cupom dentro da validade
2. ✅ **Limite Total**: Não excedeu máximo de usos
3. ✅ **Limite por Usuário**: Usuário não excedeu limite pessoal
4. ✅ **Valor Mínimo**: Compra atinge valor mínimo exigido
5. ✅ **Profissional**: Se aplicável, profissional está na lista
6. ✅ **Especialidade**: Se aplicável, profissional tem especialidade correta
7. ✅ **Status**: Cupom está ativo

## Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Admins podem gerenciar todos os cupons
- ✅ Instituições podem ver apenas seus cupons
- ✅ Usuários veem apenas cupons ativos e válidos
- ✅ Validação server-side através de função SQL SECURITY DEFINER
- ✅ Rastreamento completo de uso para auditoria

## Relatórios e Analytics

### Dados Disponíveis:
- Total de cupons criados
- Uso por cupom (atual/limite)
- Histórico de uso com valores
- Economia gerada para pacientes
- Profissionais mais beneficiados
- Períodos de maior uso

### Queries Úteis:

```sql
-- Cupons mais usados
SELECT code, name, current_usage_count, maximum_uses
FROM institution_coupons
WHERE institution_id = 'uuid-da-instituição'
ORDER BY current_usage_count DESC;

-- Total economizado por usuário
SELECT user_id, SUM(discount_amount) as total_saved
FROM coupon_usage
WHERE coupon_id IN (
  SELECT id FROM institution_coupons 
  WHERE institution_id = 'uuid-da-instituição'
)
GROUP BY user_id
ORDER BY total_saved DESC;

-- Uso por período
SELECT DATE(used_at) as date, COUNT(*) as uses, SUM(discount_amount) as total_discount
FROM coupon_usage
WHERE used_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(used_at)
ORDER BY date DESC;
```

## Expansões Futuras

O campo `metadata` (JSONB) permite adicionar:
- Regras de combinação com outros cupons
- Categorias de cupons
- Notificações personalizadas
- Integração com programas de fidelidade
- Cupons gerados automaticamente
- Gamificação (conquistas desbloqueiam cupons)

## Suporte

Para dúvidas ou problemas, verificar:
1. Logs da função `validate_coupon` no Supabase
2. Tabela `coupon_usage` para histórico
3. Campos `error_message` nas respostas de validação
