# 🎟️ Sistema de Cupons e Promoções para Instituições Parceiras

## Visão Geral

Sistema completo e flexível de cupons de desconto para instituições de ensino parceiras, totalmente integrado ao fluxo de agendamento de consultas. Permite criar promoções com diversos tipos de descontos, condições e validações, com aplicação automática no pagamento via Mercado Pago.

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

## Integração Completa no Agendamento

### Fluxo de Aplicação de Cupons

O sistema de cupons está totalmente integrado ao fluxo de agendamento em `src/pages/BookingConfirmation.tsx`:

#### 1. **Validação e Aplicação**

Os pacientes podem aplicar cupons de desconto na página de confirmação de agendamento, antes do pagamento:

```tsx
import { CouponValidator } from '@/components/CouponValidator';
import { useCouponTracking } from '@/hooks/useCouponTracking';

// Estado para armazenar cupom aplicado
const [appliedCoupon, setAppliedCoupon] = useState<{
  couponId: string;
  code: string;
  discountAmount: number;
  finalAmount: number;
} | null>(null);

// Hook para rastreamento de uso
const { recordCouponUsage } = useCouponTracking();

// Componente de validação (renderizado na coluna esquerda)
<CouponValidator
  professionalId={parseInt(bookingData.professionalId)}
  amount={parseFloat(bookingData.price)}
  tenantId={tenant?.id || ''}
  onCouponApplied={handleCouponApplied}
  onCouponRemoved={handleCouponRemoved}
/>
```

#### 2. **Callbacks de Cupom**

```tsx
const handleCouponApplied = (discount) => {
  setAppliedCoupon(discount);
  trackEvent({
    event_name: 'coupon_applied',
    event_data: { 
      coupon_code: discount.code,
      discount_amount: discount.discountAmount,
      final_amount: discount.finalAmount
    }
  });
  toast({
    title: "Cupom aplicado!",
    description: `Você economizou R$ ${discount.discountAmount.toFixed(2)}`,
  });
};

const handleCouponRemoved = () => {
  if (appliedCoupon) {
    trackEvent({
      event_name: 'coupon_removed',
      event_data: { coupon_code: appliedCoupon.code }
    });
  }
  setAppliedCoupon(null);
};
```

#### 3. **Criação do Agendamento com Cupom**

Ao criar o agendamento, o sistema inclui o `coupon_id` e o valor final com desconto:

```tsx
const finalAmount = appliedCoupon?.finalAmount || parseFloat(bookingData.price);
const agendamentoData = {
  // ... outros campos
  valor: finalAmount,
  coupon_id: appliedCoupon?.couponId || null
};

const { data: agendamento } = await supabase
  .from('agendamentos')
  .insert(agendamentoData)
  .select()
  .single();
```

#### 4. **Registro de Uso do Cupom**

Após criar o agendamento com sucesso, o sistema registra automaticamente o uso do cupom:

```tsx
if (appliedCoupon) {
  recordCouponUsage({
    couponId: appliedCoupon.couponId,
    appointmentId: agendamento.id,
    originalAmount: parseFloat(bookingData.price),
    discountAmount: appliedCoupon.discountAmount,
    finalAmount: appliedCoupon.finalAmount
  });
  
  trackEvent({
    event_name: 'booking_completed_with_coupon',
    event_data: { 
      coupon_code: appliedCoupon.code,
      discount_amount: appliedCoupon.discountAmount
    }
  });
}
```

#### 5. **Integração com Gateway de Pagamento**

O valor com desconto é automaticamente enviado ao Mercado Pago:

```tsx
const paymentAmount = appliedCoupon?.finalAmount || parseFloat(bookingData.price);
const paymentDescription = appliedCoupon 
  ? `Consulta agendada para ${date} às ${time} (Cupom ${appliedCoupon.code} aplicado - Economia: R$ ${appliedCoupon.discountAmount.toFixed(2)})`
  : `Consulta agendada para ${date} às ${time}`;

await supabase.functions.invoke('create-mercadopago-payment', {
  body: {
    agendamentoId: agendamento.id,
    valor: paymentAmount,
    title: `Consulta com ${professionalName}`,
    description: paymentDescription
  }
});
```

### Exibição Visual

O resumo do agendamento exibe claramente o desconto aplicado:

- **Valor original** (riscado quando há cupom)
- **Desconto aplicado** (badge verde com valor)
- **Valor final** (destaque em verde)
- **Total a pagar** (com indicação de economia)

```tsx
{appliedCoupon ? (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground line-through">
      {formatPrice(bookingData.price)}
    </p>
    <div className="flex items-center gap-2">
      <p className="text-lg font-bold text-green-600">
        {formatPrice(appliedCoupon.finalAmount.toString())}
      </p>
      <Badge variant="secondary" className="text-xs">
        -{formatPrice(appliedCoupon.discountAmount.toString())}
      </Badge>
    </div>
  </div>
) : (
  <p className="text-lg font-bold text-primary">
    {formatPrice(bookingData.price)}
  </p>
)}
```

### Tracking de Eventos

O sistema registra os seguintes eventos para análise:

- `coupon_applied` - Quando cupom é aplicado com sucesso
- `coupon_validation_failed` - Quando validação falha (não implementado no frontend)
- `coupon_removed` - Quando usuário remove cupom
- `booking_completed_with_coupon` - Agendamento finalizado com desconto

### Estrutura de Dados

A tabela `agendamentos` agora inclui:
- `coupon_id` (UUID): Referência ao cupom aplicado
- Índice em `coupon_id` para melhor performance de queries

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
