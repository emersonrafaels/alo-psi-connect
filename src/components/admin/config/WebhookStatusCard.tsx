import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MinusCircle, HelpCircle, Loader2 } from 'lucide-react';

interface WebhookStatusCardProps {
  title: string;
  description: string;
  status: 'online' | 'offline' | 'not_configured' | 'unknown' | 'checking';
  count?: number;
}

export const WebhookStatusCard = ({ title, description, status, count }: WebhookStatusCardProps) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Online
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Offline
          </Badge>
        );
      case 'not_configured':
        return (
          <Badge variant="secondary">
            <MinusCircle className="h-3 w-3 mr-1" />
            Não configurado
          </Badge>
        );
      case 'unknown':
        return (
          <Badge variant="outline">
            <HelpCircle className="h-3 w-3 mr-1" />
            Verificando...
          </Badge>
        );
      case 'checking':
      default:
        return (
          <Badge variant="outline">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Verificando...
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            {count !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {count} chamadas (7d)
              </p>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardContent>
    </Card>
  );
};
