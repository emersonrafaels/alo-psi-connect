import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminPatientDetail } from '@/hooks/useAdminPatientsOverview';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  profileId: string | null;
  onClose: () => void;
}

const fmt = (iso?: string | null) => {
  if (!iso) return '—';
  try { return format(parseISO(iso), "dd/MM/yyyy HH:mm", { locale: ptBR }); } catch { return iso; }
};
const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  try { return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR }); } catch { return iso; }
};

export function PatientFullViewDrawer({ profileId, onClose }: Props) {
  const { data, isLoading } = useAdminPatientDetail(profileId);
  const open = !!profileId;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Detalhes do Paciente</SheetTitle>
        </SheetHeader>

        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground p-4">Carregando...</p>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 p-4 border-b">
              <Avatar className="h-14 w-14">
                <AvatarImage src={data.profile?.foto_perfil_url || undefined} />
                <AvatarFallback>{data.profile?.nome?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{data.profile?.nome}</h3>
                <p className="text-sm text-muted-foreground">{data.profile?.email}</p>
              </div>
            </div>

            <Tabs defaultValue="profile" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mx-4 mt-2 grid grid-cols-5">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="account">Conta</TabsTrigger>
                <TabsTrigger value="institutions">Instituições</TabsTrigger>
                <TabsTrigger value="mood">Diário</TabsTrigger>
                <TabsTrigger value="meetings">Encontros</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-4 py-3">
                <TabsContent value="profile" className="space-y-3 mt-0">
                  <Row label="Nome" value={data.profile?.nome} />
                  <Row label="E-mail" value={data.profile?.email} />
                  <Row label="CPF" value={data.profile?.cpf} />
                  <Row label="Data de nascimento" value={fmtDate(data.profile?.data_nascimento)} />
                  <Row label="Gênero" value={data.profile?.genero} />
                  <Row label="Raça" value={data.profile?.raca} />
                  <Row label="Sexualidade" value={data.profile?.sexualidade} />
                  <Row label="Como conheceu" value={data.profile?.como_conheceu} />
                  <Row label="Estudante" value={data.paciente?.eh_estudante ? 'Sim' : 'Não'} />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Contatos de emergência</p>
                    {(data.emergency_contacts || []).length === 0 ? (
                      <p className="text-sm">—</p>
                    ) : (
                      <div className="space-y-1">
                        {data.emergency_contacts.map((c: any) => (
                          <div key={c.id} className="text-sm border rounded p-2">
                            <p className="font-medium">{c.nome} <span className="text-xs text-muted-foreground">({c.relacao})</span></p>
                            <p className="text-xs">{c.telefone} {c.email && `· ${c.email}`}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="account" className="space-y-3 mt-0">
                  <Row label="Conta criada em" value={fmt(data.auth?.created_at || data.profile?.created_at)} />
                  <Row label="Último login" value={fmt(data.auth?.last_sign_in_at)} />
                  <Row label="E-mail confirmado em" value={fmt(data.auth?.email_confirmed_at)} />
                  <Row label="Provedores" value={(data.auth?.providers || []).join(', ') || '—'} />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tenants vinculados</p>
                    {(data.tenants || []).length === 0 ? (
                      <p className="text-sm">—</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {data.tenants.map((t: any) => (
                          <Badge key={t.id} variant="secondary">
                            {t.tenants?.name} {t.is_primary && '★'}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="institutions" className="space-y-2 mt-0">
                  {(data.institutions || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma instituição vinculada.</p>
                  ) : (
                    data.institutions.map((i: any) => (
                      <div key={i.id} className="border rounded p-2 text-sm">
                        <p className="font-medium">{i.educational_institutions?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {i.educational_institutions?.type} · {i.enrollment_status}
                          {i.enrollment_date && ` · desde ${fmtDate(i.enrollment_date)}`}
                        </p>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="mood" className="space-y-2 mt-0">
                  <p className="text-xs text-muted-foreground">
                    {data.mood_entries?.length || 0} entradas · {data.mood_analyses?.length || 0} análises
                  </p>
                  {(data.mood_entries || []).slice(0, 60).map((m: any) => {
                    const analysis = (data.mood_analyses || []).find((a: any) => a.mood_entry_id === m.id);
                    return (
                      <div key={m.id} className="border rounded p-2 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{fmtDate(m.date)}</span>
                          {analysis?.risk_level && (
                            <Badge variant="outline" className="text-xs">
                              risco: {analysis.risk_level}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                          {m.mood_score != null && <span>humor: {m.mood_score}</span>}
                          {m.energy_level != null && <span>energia: {m.energy_level}</span>}
                          {m.anxiety_level != null && <span>ansiedade: {m.anxiety_level}</span>}
                          {m.sleep_hours != null && <span>sono: {m.sleep_hours}h</span>}
                        </div>
                        {m.journal_text && (
                          <p className="text-xs italic whitespace-pre-wrap">{m.journal_text}</p>
                        )}
                        {analysis?.buddy_message && (
                          <p className="text-xs text-primary">💬 {analysis.buddy_message}</p>
                        )}
                      </div>
                    );
                  })}
                </TabsContent>

                <TabsContent value="meetings" className="space-y-3 mt-0">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Encontros em grupo</h4>
                    {(data.group_registrations || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum.</p>
                    ) : (
                      data.group_registrations.map((r: any) => (
                        <div key={r.id} className="border rounded p-2 text-sm mb-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{r.group_sessions?.title}</span>
                            <Badge variant="outline" className="text-xs">{r.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(r.group_sessions?.session_date)} {r.group_sessions?.start_time}
                            {r.group_sessions?.profissionais?.display_name && ` · ${r.group_sessions.profissionais.display_name}`}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Consultas 1:1</h4>
                    {(data.appointments || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma.</p>
                    ) : (
                      data.appointments.map((a: any) => (
                        <div key={a.id} className="border rounded p-2 text-sm mb-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{a.profissionais?.display_name || '—'}</span>
                            <Badge variant="outline" className="text-xs">{a.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {fmtDate(a.data_consulta)} {a.horario}
                            {a.valor && ` · R$ ${Number(a.valor).toFixed(2)}`}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

const Row = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm">{value ?? '—'}</p>
  </div>
);
