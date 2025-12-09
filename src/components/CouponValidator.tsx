import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ticket, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useInstitutionCoupons } from '@/hooks/useInstitutionCoupons';

interface CouponValidatorProps {
  professionalId: number;
  amount: number;
  tenantId: string;
  onCouponApplied: (discount: {
    couponId: string;
    code: string;
    discountAmount: number;
    finalAmount: number;
  }) => void;
  onCouponRemoved: () => void;
  autoApplyCode?: string; // Código para aplicar automaticamente
  hideWhenApplied?: boolean; // Ocultar quando cupom já está aplicado (para evitar duplicação)
}

export const CouponValidator = ({
  professionalId,
  amount,
  tenantId,
  onCouponApplied,
  onCouponRemoved,
  autoApplyCode,
  hideWhenApplied = false,
}: CouponValidatorProps) => {
  const { validateCoupon } = useInstitutionCoupons();
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    couponId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-aplicar cupom quando autoApplyCode é fornecido
  useEffect(() => {
    if (autoApplyCode && !appliedCoupon && !isValidating) {
      setCouponCode(autoApplyCode);
      // Trigger validation
      (async () => {
        setIsValidating(true);
        setError(null);

        try {
          const result = await validateCoupon(autoApplyCode.toUpperCase(), professionalId, amount, tenantId) as any;

          if (result.is_valid) {
            const couponData = {
              couponId: result.coupon_id,
              code: autoApplyCode.toUpperCase(),
              discountAmount: result.discount_amount,
              finalAmount: result.final_amount,
            };
            
            setAppliedCoupon(couponData);
            onCouponApplied(couponData);
            setError(null);
          } else {
            setError(result.message || result.error_message || 'Cupom inválido');
            setAppliedCoupon(null);
          }
        } catch (err: any) {
          setError(err.message || 'Erro ao validar cupom');
          setAppliedCoupon(null);
        } finally {
          setIsValidating(false);
        }
      })();
    }
  }, [autoApplyCode, appliedCoupon, isValidating]);

  const handleValidate = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setError(null);

    try {
      const result = await validateCoupon(couponCode.toUpperCase(), professionalId, amount, tenantId) as any;

      if (result.is_valid) {
        const couponData = {
          couponId: result.coupon_id,
          code: couponCode.toUpperCase(),
          discountAmount: result.discount_amount,
          finalAmount: result.final_amount,
        };
        
        setAppliedCoupon(couponData);
        onCouponApplied(couponData);
        setError(null);
      } else {
        setError(result.message || result.error_message || 'Cupom inválido');
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao validar cupom');
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError(null);
    onCouponRemoved();
  };

  // Se hideWhenApplied e cupom já está aplicado, mostrar versão compacta apenas para trocar/remover
  if (hideWhenApplied && appliedCoupon) {
    return (
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ticket className="h-4 w-4" />
              <span>Cupom aplicado</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRemove} className="text-xs">
              Trocar cupom
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="h-5 w-5" />
          Cupom de Desconto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!appliedCoupon ? (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleValidate()}
                disabled={isValidating}
              />
              <Button
                onClick={handleValidate}
                disabled={isValidating || !couponCode.trim()}
              >
                {isValidating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Cupom aplicado com sucesso!
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{appliedCoupon.code}</Badge>
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Economia: R$ {appliedCoupon.discountAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemove}>
                Remover
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor original:</span>
            <span className="font-medium">R$ {amount.toFixed(2)}</span>
          </div>
          {appliedCoupon && (
            <>
              <div className="flex justify-between text-emerald-600">
                <span>Desconto:</span>
                <span className="font-medium">- R$ {appliedCoupon.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Valor final:</span>
                <span>R$ {appliedCoupon.finalAmount.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
