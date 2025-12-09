import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Check, ChevronDown, Tag } from "lucide-react";
import { CouponInfo, ProfessionalCouponData } from "@/hooks/useProfessionalsWithCoupons";

interface CouponSelectorProps {
  couponData: ProfessionalCouponData;
  selectedCoupon: CouponInfo;
  originalPrice: number;
  onCouponChange: (coupon: CouponInfo) => void;
}

export const CouponSelector = ({ 
  couponData, 
  selectedCoupon, 
  originalPrice, 
  onCouponChange 
}: CouponSelectorProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const hasMultipleCoupons = couponData.allCoupons.length > 1;
  const isPercentage = selectedCoupon.discountType === 'percentage';
  const discountText = isPercentage 
    ? `-${selectedCoupon.discountValue}%` 
    : `-R$ ${selectedCoupon.discountValue}`;

  const calculatedFinalPrice = Math.max(originalPrice - selectedCoupon.potentialDiscount, 0);

  if (!hasMultipleCoupons) {
    // Apenas 1 cupom - mostrar badge simples com tooltip
    return (
      <div className="flex items-center gap-2">
        <Badge 
          className={`
            ${isPercentage 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
            } 
            border-0 text-xs font-semibold
          `}
        >
          {discountText}
        </Badge>
      </div>
    );
  }

  // Múltiplos cupons - mostrar seletor
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 group">
          <Badge 
            className={`
              ${isPercentage 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
              } 
              border-0 text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity
            `}
          >
            {discountText}
            <ChevronDown className="h-3 w-3 ml-1 group-hover:translate-y-0.5 transition-transform" />
          </Badge>
          <span className="text-xs text-muted-foreground">
            +{couponData.allCoupons.length - 1} cupom{couponData.allCoupons.length > 2 ? 's' : ''}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-card border-2 border-primary/20 shadow-xl" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Cupons disponíveis</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione o cupom que deseja aplicar
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {couponData.allCoupons.map((coupon, index) => {
            const isCouponPercentage = coupon.discountType === 'percentage';
            const couponDiscountText = isCouponPercentage 
              ? `-${coupon.discountValue}%` 
              : `-R$ ${coupon.discountValue}`;
            const couponFinalPrice = Math.max(originalPrice - coupon.potentialDiscount, 0);
            const isSelected = selectedCoupon.couponId === coupon.couponId;
            const isBest = index === 0;

            return (
              <button
                key={coupon.couponId}
                onClick={() => onCouponChange(coupon)}
                className={`
                  w-full p-3 text-left transition-colors border-b border-border/50 last:border-b-0
                  ${isSelected 
                    ? 'bg-primary/5' 
                    : 'hover:bg-muted/50'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{coupon.name}</span>
                      {isBest && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                          Melhor
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {coupon.code}
                      </code>
                      <Badge 
                        variant="outline" 
                        className={`
                          text-[10px] px-1.5 py-0 border-0
                          ${isCouponPercentage 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                          }
                        `}
                      >
                        {couponDiscountText}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="text-muted-foreground line-through">
                        {formatPrice(originalPrice)}
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(couponFinalPrice)}
                      </span>
                      <span className="text-emerald-600/80 dark:text-emerald-400/80">
                        (economia {formatPrice(coupon.potentialDiscount)})
                      </span>
                    </div>
                  </div>
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                    ${isSelected 
                      ? 'border-primary bg-primary' 
                      : 'border-muted-foreground/30'
                    }
                  `}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
