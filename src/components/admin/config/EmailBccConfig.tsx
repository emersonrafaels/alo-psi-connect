import { useState } from 'react';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Mail, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdminTenant } from '@/contexts/AdminTenantContext';
import { supabase } from '@/integrations/supabase/client';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailBccConfig() {
  const { getConfig, updateConfig, loading } = useSystemConfig(['email_bcc']);
  const [newEmail, setNewEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const { toast } = useToast();
  const { tenantFilter } = useAdminTenant();

  const bccEmails: string[] = (() => {
    const val = getConfig('email_bcc', 'bcc_recipients', []);
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return []; }
    }
    return [];
  })();

  const addEmail = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    if (!EMAIL_REGEX.test(email)) {
      toast({ title: 'Email inválido', description: 'Digite um email válido', variant: 'destructive' });
      return;
    }

    if (bccEmails.includes(email)) {
      toast({ title: 'Email duplicado', description: 'Este email já está na lista', variant: 'destructive' });
      return;
    }

    const updated = [...bccEmails, email];
    await updateConfig('email_bcc', 'bcc_recipients', JSON.stringify(updated));
    setNewEmail('');
  };

  const removeEmail = async (emailToRemove: string) => {
    const updated = bccEmails.filter(e => e !== emailToRemove);
    await updateConfig('email_bcc', 'bcc_recipients', JSON.stringify(updated));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-sm text-muted-foreground">
            Emails adicionados aqui serão copiados em oculto (BCC) em todos os emails enviados pela plataforma para o tenant selecionado.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Digite um email e pressione Enter"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={addEmail} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {bccEmails.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {bccEmails.map((email) => (
            <Badge key={email} variant="secondary" className="gap-1 py-1 px-3 text-sm">
              {email}
              <button
                onClick={() => removeEmail(email)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Nenhum email BCC configurado para este tenant.
        </p>
      )}

      {bccEmails.length > 0 && (
        <Button
          onClick={async () => {
            if (!tenantFilter) {
              toast({ title: 'Selecione um tenant', description: 'Selecione um tenant específico para enviar o teste.', variant: 'destructive' });
              return;
            }
            setSendingTest(true);
            try {
              const { data, error } = await supabase.functions.invoke('send-test-email', {
                body: {
                  emailType: 'newsletter_confirmation',
                  recipientEmail: bccEmails[0],
                  tenantId: tenantFilter,
                  variables: { recipientName: 'Teste BCC' }
                }
              });
              if (error) throw error;
              toast({ title: 'Email enviado!', description: `Email de teste enviado para ${bccEmails[0]}` });
            } catch (err: any) {
              toast({ title: 'Erro ao enviar', description: err.message || 'Erro desconhecido', variant: 'destructive' });
            } finally {
              setSendingTest(false);
            }
          }}
          variant="outline"
          size="sm"
          disabled={sendingTest}
          className="gap-2"
        >
          {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar Email de Teste
        </Button>
      )}
    </div>
  );
}
