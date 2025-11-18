import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InstitutionCoupon } from '@/hooks/useInstitutionCoupons';
import { ArrowUpDown, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CouponDetailsModal } from './CouponDetailsModal';
import { EditCouponModal } from './EditCouponModal';

interface Props {
  coupons: InstitutionCoupon[];
  canManageCoupons: boolean;
  institutionId: string;
  tenantId?: string;
}

type SortField = 'code' | 'name' | 'discount' | 'usage' | 'valid_until';
type SortDirection = 'asc' | 'desc';

const getStatusVariant = (coupon: InstitutionCoupon): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!coupon.is_active) return 'secondary';
  const now = new Date();
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
  if (validUntil && validUntil < now) return 'destructive';
  if (coupon.maximum_uses && coupon.current_usage_count >= coupon.maximum_uses) return 'outline';
  return 'default';
};

const getStatusLabel = (coupon: InstitutionCoupon): string => {
  if (!coupon.is_active) return 'Inativo';
  const now = new Date();
  const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
  if (validUntil && validUntil < now) return 'Expirado';
  if (coupon.maximum_uses && coupon.current_usage_count >= coupon.maximum_uses) return 'Esgotado';
  return 'Ativo';
};

const getAudienceLabel = (audience: string): string => {
  const labels: Record<string, string> = {
    all: 'Todos',
    institution_students: 'Alunos',
    other_patients: 'Outros'
  };
  return labels[audience] || audience;
};

export const CouponsTableView = ({ coupons, canManageCoupons, institutionId, tenantId }: Props) => {
  const [selectedCouponForDetails, setSelectedCouponForDetails] = useState<InstitutionCoupon | null>(null);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState<InstitutionCoupon | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCoupons = useMemo(() => {
    return [...coupons].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'discount':
          comparison = a.discount_value - b.discount_value;
          break;
        case 'usage':
          comparison = a.current_usage_count - b.current_usage_count;
          break;
        case 'valid_until':
          const dateA = a.valid_until ? new Date(a.valid_until).getTime() : 0;
          const dateB = b.valid_until ? new Date(b.valid_until).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [coupons, sortField, sortDirection]);

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('code')}
                className="font-semibold"
              >
                Código
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('name')}
                className="font-semibold"
              >
                Nome
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('discount')}
                className="font-semibold"
              >
                Desconto
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('usage')}
                className="font-semibold"
              >
                Uso
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSort('valid_until')}
                className="font-semibold"
              >
                Validade
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Público</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCoupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{coupon.name}</div>
                  {coupon.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {coupon.description}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold">
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}%`
                    : `R$ ${coupon.discount_value}`}
                </span>
                {coupon.max_discount_amount && (
                  <div className="text-xs text-muted-foreground">
                    máx R$ {coupon.max_discount_amount}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {coupon.current_usage_count}
                </span>
                {coupon.maximum_uses && (
                  <span className="text-muted-foreground"> / {coupon.maximum_uses}</span>
                )}
              </TableCell>
              <TableCell>
                {coupon.valid_until ? (
                  format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  <span className="text-muted-foreground">Sem limite</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">{getAudienceLabel(coupon.target_audience)}</span>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(coupon)}>
                  {getStatusLabel(coupon)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setSelectedCouponForDetails(coupon);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={!canManageCoupons ? 'cursor-not-allowed' : ''}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (canManageCoupons) {
                                setSelectedCouponForEdit(coupon);
                                setIsEditModalOpen(true);
                              }
                            }}
                            disabled={!canManageCoupons}
                            className={cn(
                              !canManageCoupons && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!canManageCoupons && (
                        <TooltipContent>
                          <p className="text-sm">Edição desabilitada pelo administrador</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CouponDetailsModal
        coupon={selectedCouponForDetails}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCouponForDetails(null);
        }}
      />

      {canManageCoupons && (
        <EditCouponModal
          coupon={selectedCouponForEdit}
          institutionId={institutionId}
          tenantId={tenantId}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCouponForEdit(null);
          }}
          onSave={() => {
            setIsEditModalOpen(false);
            setSelectedCouponForEdit(null);
          }}
        />
      )}
    </div>
  );
};
