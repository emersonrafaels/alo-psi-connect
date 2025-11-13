import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvailableCoupons } from '@/hooks/useAvailableCoupons';

interface AvailableCouponsDisplayProps {
  professionalId: number;
  amount: number;
  tenantId: string;
  onCouponSelect: (code: string) => void;
}

export const AvailableCouponsDisplay = ({
  professionalId,
  amount,
  tenantId,
  onCouponSelect,
}: AvailableCouponsDisplayProps) => {
  const { data: availableCoupons, isLoading } = useAvailableCoupons(
    professionalId,
    amount,
    tenantId
  );

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availableCoupons || availableCoupons.length === 0) {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <Gift className="h-5 w-5" />
          Cupons Disponíveis para Você
          <Badge variant="secondary" className="ml-auto">
            {availableCoupons.length}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Clique em um cupom para aplicá-lo automaticamente
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {availableCoupons.map(coupon => (
            <div
              key={coupon.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-100 dark:hover:bg-green-950/40 cursor-pointer transition-all hover:shadow-md group"
              onClick={() => onCouponSelect(coupon.code)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {coupon.code}
                  </Badge>
                  <Sparkles className="h-4 w-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-medium text-sm">{coupon.name}</p>
                {coupon.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {coupon.description}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                <div className="text-green-600 dark:text-green-400 font-bold text-lg">
                  - R$ {coupon.potentialDiscount.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Final: R$ {coupon.finalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
