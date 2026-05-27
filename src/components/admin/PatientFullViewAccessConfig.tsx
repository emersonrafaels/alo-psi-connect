import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, X, Search, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useAllUsers } from '@/hooks/useAllUsers';

const CATEGORY = 'admin_access';
const KEY = 'patient_full_view_allowed_users';

export function PatientFullViewAccessConfig() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const { data: searchResults } = useAllUsers(debouncedSearch);

  const { data: allowed, isLoading } = useQuery({
    queryKey: ['patient-full-view-allowed-list'],
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

  const { data: allowedProfiles } = useQuery({
    queryKey: ['patient-full-view-allowed-profiles', allowed?.list],
    enabled: !!allowed && allowed.list.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, nome, email, foto_perfil_url')
        .in('user_id', allowed!.list);
      return data || [];
    },
  });

  const save = async (newList: string[]) => {
    if (allowed?.id) {
      const { error } = await supabase
        .from('system_configurations')
        .update({ value: JSON.stringify(newList), updated_at: new Date().toISOString() })
        .eq('id', allowed.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('system_configurations')
        .insert({
          category: CATEGORY,
          key: KEY,
          value: JSON.stringify(newList),
          tenant_id: null,
          description: 'Usuários autorizados a acessar a página de listagem completa de pacientes',
        });
      if (error) throw error;
    }
    qc.invalidateQueries({ queryKey: ['patient-full-view-allowed-list'] });
    qc.invalidateQueries({ queryKey: ['patient-full-view-access'] });
  };

  const addUser = async (userId: string) => {
    if (!allowed) return;
    if (allowed.list.includes(userId)) {
      toast({ title: 'Já está na lista' });
      return;
    }
    try {
      await save([...allowed.list, userId]);
      toast({ title: 'Acesso concedido' });
      setSearch('');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const removeUser = async (userId: string) => {
    if (!allowed) return;
    try {
      await save(allowed.list.filter((u) => u !== userId));
      toast({ title: 'Acesso removido' });
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
          Usuários listados aqui podem acessar a página oculta{' '}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">/admin/pacientes-completo</code>{' '}
          com a visão completa de todos os pacientes. Super admins têm acesso automático.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Adicionar usuário</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {debouncedSearch && (searchResults?.length ?? 0) > 0 && (
          <div className="mt-2 border rounded-md max-h-64 overflow-y-auto">
            {searchResults!.map((u) => (
              <button
                key={u.user_id}
                onClick={() => addUser(u.user_id)}
                className="w-full flex items-center justify-between p-2 hover:bg-muted/50 text-left"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={u.foto_perfil_url || undefined} />
                    <AvatarFallback>{u.nome?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{u.nome}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <Plus className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">
          Usuários autorizados ({allowed?.list.length || 0})
        </h4>
        {allowed?.list.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhum usuário adicional autorizado. Apenas super admins têm acesso.
          </p>
        ) : (
          <div className="space-y-2">
            {(allowedProfiles || []).map((p) => (
              <div
                key={p.user_id}
                className="flex items-center justify-between p-2 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.foto_perfil_url || undefined} />
                    <AvatarFallback>{p.nome?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUser(p.user_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {allowed?.list
              .filter((id) => !(allowedProfiles || []).some((p) => p.user_id === id))
              .map((id) => (
                <div key={id} className="flex items-center justify-between p-2 border rounded-md">
                  <Badge variant="outline" className="text-xs">{id}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => removeUser(id)}>
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
