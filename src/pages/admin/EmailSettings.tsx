import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  EMAIL_CATALOG, SITE_ADMIN_KEY, type EmailDef, type EmailSettingRow,
} from "../../../supabase/functions/_shared/email-catalog.ts";

const db = supabase as any;
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

function EmailChips({ emails, onChange }: { emails: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim().toLowerCase();
    if (!isEmail(v) || emails.includes(v)) return;
    onChange([...emails, v]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {emails.map((e) => (
          <Badge key={e} variant="secondary" className="gap-1 font-normal">
            {e}
            <button aria-label={`Remover ${e}`} onClick={() => onChange(emails.filter((x) => x !== e))}><X className="h-3 w-3" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="email@exemplo.com" className="h-8 text-sm" />
        <Button size="sm" variant="outline" onClick={add} disabled={!isEmail(draft)}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

export default function EmailSettings() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-email-settings"],
    queryFn: async () => {
      const { data, error } = await db.from("email_settings").select("email_key, enabled, site_admin_receives, extra_recipients");
      if (error) throw error;
      return data as EmailSettingRow[];
    },
  });

  const get = (def: EmailDef): EmailSettingRow =>
    rows.find((r) => r.email_key === def.key) ?? { email_key: def.key, enabled: true, site_admin_receives: !!def.defaultAdmin, extra_recipients: [] };
  const site = rows.find((r) => r.email_key === SITE_ADMIN_KEY);

  const save = async (row: EmailSettingRow) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await db.from("email_settings").upsert({ ...row, updated_by: user?.id }, { onConflict: "email_key" });
    if (error) return toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" });
    qc.invalidateQueries({ queryKey: ["admin-email-settings"] });
    toast({ title: "Configuração salva" });
  };

  const groups = useMemo(() => {
    const m = new Map<string, EmailDef[]>();
    EMAIL_CATALOG.forEach((d) => m.set(d.group, [...(m.get(d.group) ?? []), d]));
    return [...m.entries()];
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Emails do site</h1>
        <p className="text-sm text-muted-foreground">Controle quem recebe cada email, se o admin do site recebe cópia e adicione outros emails admin.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4" /> Email admin do site</CardTitle>
          <CardDescription>Recebe cópia oculta dos emails marcados com "Admin do site recebe".</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailChips emails={site?.extra_recipients ?? []}
            onChange={(v) => save({ email_key: SITE_ADMIN_KEY, enabled: true, site_admin_receives: true, extra_recipients: v })} />
        </CardContent>
      </Card>

      {groups.map(([group, defs]) => (
        <Card key={group}>
          <CardHeader><CardTitle className="text-base">{group}</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {defs.map((def) => {
              const row = get(def);
              return (
                <div key={def.key} className="grid gap-4 p-4 md:grid-cols-[1.4fr_1fr_auto_1.3fr]">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      {def.name}
                      {def.essential && <Badge variant="outline" className="gap-1 text-xs"><Lock className="h-3 w-3" /> Essencial</Badge>}
                      {!def.essential && !row.enabled && <Badge variant="destructive" className="text-xs">Desativado</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{def.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Switch checked={def.essential || row.enabled} disabled={def.essential}
                        onCheckedChange={(v) => save({ ...row, enabled: v })} aria-label="Envio ativo" />
                      <span className="text-muted-foreground">{def.essential ? "Sempre enviado" : row.enabled ? "Envio ativo" : "Envio desativado"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Quem recebe</div>
                    <div className="text-sm">{def.recipients}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Admin do site recebe</div>
                    <div className="mt-1 flex items-center gap-2">
                      <Switch checked={row.site_admin_receives} onCheckedChange={(v) => save({ ...row, site_admin_receives: v })} aria-label="Admin do site recebe" />
                      <span className="text-sm">{row.site_admin_receives ? "Sim" : "Não"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs uppercase text-muted-foreground">Emails admin extras</div>
                    <EmailChips emails={row.extra_recipients} onChange={(v) => save({ ...row, extra_recipients: v })} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
