import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { FlaskConical, KeyRound, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

const definitions = [
  { key:'A', title:'Estudante A', description:'Bons indicadores, rotina equilibrada e práticas voluntárias.' },
  { key:'B', title:'Estudante B', description:'Oscilações de bem-estar e melhora com apoios pertinentes.' },
  { key:'C', title:'Estudante C', description:'Maior necessidade de acompanhamento, com atenção simulada.' },
  { key:'D', title:'Estudante D', description:'Padrão A · Contagem. Bons indicadores e práticas voluntárias, com dados próprios.' },
  { key:'E', title:'Estudante E', description:'Padrão B · Montes Claros. Oscilações e recuperação com apoios, com dados próprios.' },
  { key:'F', title:'Estudante F', description:'Padrão C · Itajubá. Maior necessidade de acompanhamento simulado, com dados próprios.' },
];
type CaseRow = {case_key:string; credentials_assigned:boolean; profiles:{email:string}|null};
const credentials = z.object({email:z.string().trim().email().max(255),password:z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/)});
export function AfyaStudyCases() {
  const client = useQueryClient();
  const [selected,setSelected] = useState<string|null>(null);
  const [email,setEmail] = useState(''); const [password,setPassword] = useState('');
  const [saving,setSaving] = useState(false); const [error,setError] = useState('');
  const query = useQuery({queryKey:['afya-study-cases'],queryFn:async()=>{
    const result = await supabase.functions.invoke('afya-study-cases',{body:{action:'list'}});
    if(result.error||result.data?.error) throw new Error('Não foi possível carregar os casos.');
    return result.data.cases as CaseRow[];
  },retry:false});
  const save = async (event:React.FormEvent) => {
    event.preventDefault();
    if(!selected) return;
    const parsed = credentials.safeParse({email,password});
    if(!parsed.success) {setError('Use email válido e senha de 12 a 128 caracteres, com maiúscula, minúscula e número.');return;}
    setSaving(true);setError('');
    try {
      const result = await supabase.functions.invoke('afya-study-cases',{body:{action:'assign',caseKey:selected,...parsed.data}});
      if(result.error||result.data?.error) throw new Error(result.data?.error||'Não foi possível salvar. Verifique se o email já está em uso e tente novamente.');
      setSelected(null);setPassword('');setEmail('');
      await client.invalidateQueries({queryKey:['afya-study-cases']});
      toast.success('Acesso e histórico sintético preparados.');
    } catch(e) {setError(e instanceof Error?e.message:'Não foi possível salvar o acesso.');}
    finally {setSaving(false);}
  };
  return <section aria-labelledby="afya-cases-title" className="space-y-4 border-b border-border pb-6">
    <div className="flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary"/><h2 id="afya-cases-title" className="text-xl font-bold">Afya · Estudos de caso</h2><Badge variant="outline">Dados sintéticos</Badge></div>
    <Alert><AlertDescription>Casos fictícios A, B, C, D, E e F. Notificações institucionais e mensagens de agendamento são bloqueadas. Nenhum contato de emergência foi cadastrado. A primeira atribuição de acesso prepara 45 dias de diário, três coletas das seis escalas, jornadas e práticas.</AlertDescription></Alert>
    {query.isPending?<Loader2 className="h-5 w-5 animate-spin"/>:query.isError?<Alert variant="destructive"><AlertDescription>Não foi possível carregar os casos. <Button variant="link" onClick={()=>query.refetch()}>Tentar novamente</Button></AlertDescription></Alert>:<div className="grid gap-4 md:grid-cols-3">{definitions.map(def=>{
      const row = query.data?.find(r=>r.case_key===def.key);
      return <article key={def.key} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2"><h3 className="font-bold">{def.title}</h3><Badge variant={row?.credentials_assigned?'secondary':'outline'}>{row?.credentials_assigned?'Acesso ativo':'Sem acesso'}</Badge></div>
        <p className="text-sm text-muted-foreground">{def.description}</p>
        {row?.credentials_assigned&&<p className="break-all text-sm">{row.profiles?.email}</p>}
        <Button className="mt-auto" variant="outline" disabled={!row} onClick={()=>{setSelected(def.key);setEmail(row?.credentials_assigned?row.profiles?.email||'':'');setPassword('');setError('');}}><KeyRound className="mr-2 h-4 w-4"/>{row?.credentials_assigned?'Editar acesso':'Atribuir email e senha'}</Button>
      </article>;
    })}</div>}
    <Dialog open={selected!==null} onOpenChange={open=>{if(!open&&!saving){setSelected(null);setPassword('');setEmail('');setError('');}}}>
      <DialogContent onInteractOutside={event=>{if(saving)event.preventDefault();}}><DialogHeader><DialogTitle>Acesso do Estudante {selected}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="case-email">Email</Label><Input id="case-email" type="email" autoComplete="off" maxLength={255} required value={email} onChange={e=>setEmail(e.target.value)} disabled={saving}/></div>
          <div className="space-y-2"><Label htmlFor="case-password">Nova senha</Label><Input id="case-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} disabled={saving}/><p className="text-xs text-muted-foreground">Mínimo de 12 caracteres, com maiúscula, minúscula e número. A senha não será exibida novamente.</p></div>
          {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={saving} className="w-full">{saving?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<KeyRound className="mr-2 h-4 w-4"/>}{saving?'Preparando caso…':'Salvar acesso'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  </section>;
}