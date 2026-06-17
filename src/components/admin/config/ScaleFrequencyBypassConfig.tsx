import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Shield, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORY = 'emotional_scales';
const KEY = 'frequency_bypass_emails';

export function ScaleFrequencyBypassConfig() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');

  const { data: allowed, isLoading } = useQuery({
    queryKey: ['scale-frequency-bypass-emails'],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_configurations')
        .select('id, value')
        .eq('category', CATEGORY)
        .eq('key', KEY)
        .is('tenant_id', null)
        .maybeSingle();
      let list: string[] = [];
      if (data) {
        try {
          list = typeof data.value === 'string' ? JSON.parse(data.value as string) : (data.value as any);
        } catch {
          list = [];
        }
      }
      return { id: data?.id || null, list: Array.isArray(list) ? list : [] };
    },
  });

  const save = async (newList: string[]) => {
    const normalized = Array.from(new Set(newList.map((e) => e.trim().toLowerCase()).filter(Boolean)));
    if (allowed?.id) {
      const { error } = await supabase
        .from('system_configurations')
        .update({ value: JSON.stringify(normalized), updated_at: new Date().toISOString() })
        .eq('id', allowed.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('system_configurations')
        .insert({
          category: CATEGORY,
          key: KEY,
          value: JSON.stringify(normalized),
          tenant_id: null,
          description: 'Emails autorizados a responder escalas emocionais sem o bloqueio de frequência',
        });
      if (error) throw error;
    }
    qc.invalidateQueries({ queryKey: ['scale-frequency-bypass-emails'] });
  };

  const addEmail = async () => {
    if (!allowed) return;
    const value = email.trim().toLowerCase();
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast({ title: 'Email inválido', variant: 'destructive' });
      return;
    }
    if (allowed.list.includes(value)) {
      toast({ title: 'Email já está na lista' });
      return;
    }
    try {
      await save([...allowed.list, value]);
      toast({ title: 'Email adicionado' });
      setEmail('');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const removeEmail = async (value: string) => {
    if (!allowed) return;
    try {
      await save(allowed.list.filter((e) => e !== value));
      toast({ title: 'Email removido' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Emails listados aqui poderão responder as escalas emocionais (WHO-5, GAD-7, ISI, etc.) sem o bloqueio de frequência de 180 dias.
          Útil para contas de teste e administração.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Adicionar email</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="exemplo@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addEmail();
                }
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={addEmail}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">
          Emails autorizados ({allowed?.list.length || 0})
        </h4>
        {allowed?.list.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhum email adicionado. O bloqueio de 180 dias se aplica a todos os usuários.
          </p>
        ) : (
          <div className="space-y-2">
            {allowed?.list.map((value) => (
              <div
                key={value}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{value}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmail(value)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
