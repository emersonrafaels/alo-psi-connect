import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkles, Percent, Tag, Copy, Check } from "lucide-react"
import { useState } from "react"

interface CouponInfo {
  couponId: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  potentialDiscount: number;
  finalAmount: number;
}

interface CouponBadgeWithDetailsProps {
  coupon: CouponInfo;
  originalPrice: number | null;
}

export const CouponBadgeWithDetails = ({ coupon, originalPrice }: CouponBadgeWithDetailsProps) => {
  const [copied, setCopied] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isPercentage = coupon.discountType === 'percentage';
  const discountText = isPercentage 
    ? `${coupon.discountValue}% OFF` 
    : `R$ ${coupon.discountValue} OFF`;

  // Calculate final price based on original price if available
  const calculatedFinalPrice = originalPrice 
    ? Math.max(originalPrice - coupon.potentialDiscount, 0)
    : coupon.finalAmount;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="animate-pulse-subtle cursor-pointer">
            <Badge 
              className={`
                ${isPercentage 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
                } 
                text-white border-0 shadow-lg flex items-center gap-1.5 px-3 py-1.5 w-fit hover:scale-105 transition-transform
              `}
            >
              {isPercentage ? <Percent className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
              <span className="font-semibold">
                🎉 {discountText}
              </span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="p-0 bg-card border-2 border-primary/20 shadow-xl max-w-xs"
        >
          <div className="p-4 space-y-3">
            {/* Coupon Header */}
            <div className="flex items-center gap-2">
              <div className={`
                p-2 rounded-full 
                ${isPercentage ? 'bg-emerald-500/10' : 'bg-amber-500/10'}
              `}>
                <Sparkles className={`h-4 w-4 ${isPercentage ? 'text-emerald-600' : 'text-amber-600'}`} />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{coupon.name}</p>
                <p className="text-xs text-muted-foreground">Cupom institucional</p>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
              <code className="font-mono font-bold text-primary tracking-wider">
                {coupon.code}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Copiar código"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>

            {/* Price Preview */}
            {originalPrice && originalPrice > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-lg p-3 border border-emerald-200/50 dark:border-emerald-800/50">
                <p className="text-xs text-muted-foreground mb-1">Preço com desconto:</p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-sm">
                    {formatPrice(originalPrice)}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(calculatedFinalPrice)}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  Economia de {formatPrice(coupon.potentialDiscount)}
                </p>
              </div>
            )}

            {/* Apply hint */}
            <p className="text-xs text-muted-foreground text-center">
              Aplique no momento do agendamento
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
