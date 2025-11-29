import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Lock } from 'lucide-react';

interface ChatPayloadBuilderProps {
  channel: string;
  onChannelChange: (value: string) => void;
  medcosMatch: boolean;
  onMedcosMatchChange: (value: boolean) => void;
}

const requiredFields = [
  { key: 'user_id', label: 'User ID', description: 'ID do usuário autenticado' },
  { key: 'session_id', label: 'Session ID', description: 'ID da sessão de conversa' },
  { key: 'tenant_id', label: 'Tenant ID', description: 'ID do tenant (UUID)' },
  { key: 'tenant_slug', label: 'Tenant Slug', description: 'Slug do tenant (ex: medcos)' },
  { key: 'message', label: 'Message', description: 'Mensagem enviada pelo usuário' },
  { key: 'timestamp', label: 'Timestamp', description: 'Data e hora ISO 8601' }
];

export const ChatPayloadBuilder = ({
  channel,
  onChannelChange,
  medcosMatch,
  onMedcosMatchChange
}: ChatPayloadBuilderProps) => {
  const generatePreview = () => {
    const payload: any = {
      user_id: "uuid-do-usuario",
      session_id: "uuid-da-sessao",
      tenant_id: "uuid-do-tenant",
      tenant_slug: "medcos",
      message: "texto da mensagem do usuário",
      timestamp: new Date().toISOString()
    };

    if (channel) {
      payload.channel = channel;
    }
    
    if (medcosMatch) {
      payload.medcos_match = true;
    }

    return JSON.stringify(payload, null, 2);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Configuration */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campos do Payload</CardTitle>
            <CardDescription className="text-xs">
              Configure os campos adicionais enviados ao N8N
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Required Fields */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Campos Obrigatórios
              </div>
              <div className="space-y-2 pl-6">
                {requiredFields.map(field => (
                  <div key={field.key} className="p-2 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-xs font-mono">{field.key}</code>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Auto
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Fields */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Campos Adicionais</div>
              
              <div className="space-y-2">
                <Label htmlFor="chat_channel">Canal (channel)</Label>
                <Input
                  id="chat_channel"
                  value={channel}
                  onChange={(e) => onChannelChange(e.target.value)}
                  placeholder="medcos_match"
                />
                <p className="text-xs text-muted-foreground">
                  Nome do canal para identificação no N8N
                </p>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="chat_medcos_match" className="text-sm font-medium">
                    Medcos Match
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Ativar flag para matching avançado
                  </p>
                </div>
                <Switch
                  id="chat_medcos_match"
                  checked={medcosMatch}
                  onCheckedChange={onMedcosMatchChange}
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                O N8N é responsável por consultar o Supabase, manter contexto da conversa e processar com modelos de IA.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Preview */}
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-base">Preview do Payload</CardTitle>
          <CardDescription className="text-xs">
            Estrutura JSON enviada ao webhook do N8N
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
            {generatePreview()}
          </pre>
          
          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              <strong>Resposta esperada:</strong>
              <pre className="mt-2 bg-background p-2 rounded overflow-x-auto">
{`{
  "response": "texto da resposta",
  "session_id": "uuid-da-sessao",
  "professionals": []
}`}
              </pre>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
