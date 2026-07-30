import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { invalidateBuddyData } from '@/hooks/useBuddy';
import { Phone, Plus, Trash2 } from 'lucide-react';

export interface EmergencyContact {
  id?: string;
  nome: string;
  relacao: string;
  telefone: string;
  email: string;
}

const emptyContact: EmergencyContact = { nome: '', relacao: '', telefone: '', email: '' };

export const relationOptions = [
  { value: 'pai_mae', label: 'Pai/Mãe' },
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'irmao', label: 'Irmão/Irmã' },
  { value: 'filho', label: 'Filho/Filha' },
  { value: 'amigo', label: 'Amigo/Amiga' },
  { value: 'tutor', label: 'Tutor/Responsável' },
  { value: 'outro', label: 'Outro' },
];

const labelToValue = (label: string) => {
  const found = relationOptions.find(o => o.label === label || o.value === label);
  return found?.value || label;
};

interface Props {
  /** ID do registro em `pacientes`. Quando ausente, o editor fica em estado de carregamento. */
  patientId?: string | null;
  onSaved?: () => void;
  /** Rótulo do botão de salvar */
  saveLabel?: string;
}

export const EmergencyContactsEditor = ({ patientId, onSaved, saveLabel = 'Salvar contatos' }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    const { data } = await supabase
      .from('patient_emergency_contacts')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at');

    setContacts(
      (data ?? []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        relacao: labelToValue(c.relacao),
        telefone: c.telefone || '',
        email: c.email || '',
      }))
    );
    setLoading(false);
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setContacts(prev => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addContact = () => {
    setContacts(prev => (prev.length < 3 ? [...prev, { ...emptyContact }] : prev));
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!patientId) {
      toast({
        title: 'Não foi possível salvar',
        description: 'Não foi possível identificar seu cadastro de estudante. Recarregue a página e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    const validContacts = contacts.filter(c => c.nome && c.relacao && c.telefone);
    if (validContacts.length === 0) {
      toast({
        title: 'Preencha os campos obrigatórios',
        description: 'Informe nome, relação e telefone de pelo menos um contato.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from('patient_emergency_contacts')
        .delete()
        .eq('patient_id', patientId);
      if (deleteError) throw deleteError;

      const { error } = await supabase.from('patient_emergency_contacts').insert(
        validContacts.map(c => ({
          patient_id: patientId,
          nome: c.nome,
          relacao: c.relacao,
          telefone: c.telefone || null,
          email: c.email || null,
        }))
      );
      if (error) throw error;

      toast({ title: 'Contatos salvos', description: 'Contatos de emergência atualizados com sucesso.' });
      await load();
      // Mantém o Buddy sincronizado mesmo quando o formulário é usado no perfil
      await invalidateBuddyData(queryClient);
      onSaved?.();
    } catch (error: any) {
      console.error('[EmergencyContactsEditor] Erro ao salvar contatos:', error);
      toast({
        title: 'Erro ao salvar contatos',
        description: error?.message || 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4">Carregando contatos...</p>;
  }

  return (
    <div className="space-y-4">
      {contacts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum contato de emergência cadastrado</p>
          <Button variant="outline" size="sm" onClick={addContact} className="mt-3">
            <Plus className="h-4 w-4 mr-1" />Adicionar contato
          </Button>
        </div>
      ) : (
        <>
          {contacts.map((contact, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Contato {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(index)}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                  aria-label={`Remover contato ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label className="text-xs">Nome *</Label>
                  <Input value={contact.nome} onChange={(e) => updateContact(index, 'nome', e.target.value)} placeholder="Nome do contato" />
                </div>
                <div>
                  <Label className="text-xs">Relação *</Label>
                  <Select value={contact.relacao} onValueChange={(v) => updateContact(index, 'relacao', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {relationOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Telefone *</Label>
                  <Input value={contact.telefone} onChange={(e) => updateContact(index, 'telefone', e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={contact.email} onChange={(e) => updateContact(index, 'email', e.target.value)} placeholder="email@exemplo.com" />
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
            {contacts.length < 3 ? (
              <Button variant="outline" size="sm" onClick={addContact} className="sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />Adicionar contato ({contacts.length}/3)
              </Button>
            ) : <span />}
            <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Salvando...' : saveLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmergencyContactsEditor;
