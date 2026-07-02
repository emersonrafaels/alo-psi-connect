import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BuddyLayout } from "@/components/buddy/BuddyLayout";
import { BuddyMascot } from "@/components/buddy/BuddyMascot";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useBuddyPortrait } from "@/hooks/useBuddy";
import { useBuddyPrivacy, useRemoveBuddyPortraitField } from "@/hooks/useBuddyPrivacy";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Leaf,
  Lock,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Row = {
  key: string;
  label: string;
  description: string;
  portraitField: string;
  isModule?: boolean;
};

const ROWS: Row[] = [
  {
    key: "mind_on",
    label: "O que ocupa minha mente",
    description: "Assuntos, pensamentos e preocupações que você compartilhou no seu retrato.",
    portraitField: "mind_on",
  },
  {
    key: "calms_me",
    label: "O que me acalma",
    description: "Situações, pessoas ou hábitos que te trazem tranquilidade.",
    portraitField: "calms_me",
  },
  {
    key: "dreams",
    label: "Meus sonhos e planos",
    description: "Projetos e desejos que você contou ao Buddy.",
    portraitField: "dreams",
  },
  {
    key: "values_list",
    label: "Meus valores",
    description: "O que é importante para você na vida.",
    portraitField: "values_list",
  },
  {
    key: "triggers",
    label: "Meus gatilhos",
    description: "Situações que costumam te desestabilizar.",
    portraitField: "triggers",
  },
  {
    key: "wants_to_improve",
    label: "O que quero melhorar",
    description: "Áreas em que você deseja evoluir.",
    portraitField: "wants_to_improve",
  },
  {
    key: "message_to_buddy",
    label: "Mensagem livre para o Buddy",
    description: "Texto aberto que você escreveu para o Buddy.",
    portraitField: "message_to_buddy",
  },
  {
    key: "encontros",
    label: "Encontros",
    description: "Presença e participação em encontros e grupos.",
    portraitField: "encontros",
    isModule: true,
  },
  {
    key: "diario_emocional",
    label: "Diário emocional",
    description: "Registros diários de humor, emoções e anotações.",
    portraitField: "diario_emocional",
    isModule: true,
  },
  {
    key: "escalas",
    label: "Escalas emocionais",
    description: "Respostas às escalas clínicas (WHO-5, PHQ-9, GAD-7 etc.) e seu ISEU-RBE.",
    portraitField: "escalas",
    isModule: true,
  },
];

type Prefs = Record<string, { psicologo: boolean; psiquiatra: boolean }>;

const defaultPrefs = (): Prefs =>
  ROWS.reduce((acc, r) => {
    acc[r.key] = { psicologo: false, psiquiatra: false };
    return acc;
  }, {} as Prefs);

export default function BuddyPrivacy() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { data: portrait, patientId } = useBuddyPortrait();
  const { data: stored, isLoading, save } = useBuddyPrivacy();
  const removeField = useRemoveBuddyPortraitField();

  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  useEffect(() => {
    if (stored?.preferences) {
      setPrefs({ ...defaultPrefs(), ...(stored.preferences as Prefs) });
    }
  }, [stored?.id]);

  const consentAt = stored?.consent_registered_at
    ? new Date(stored.consent_registered_at)
    : null;

  const consentText = consentAt
    ? consentAt.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Ainda não confirmado";

  const isFilled = (field: string) => {
    const v = (portrait as any)?.[field];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return true;
  };

  const toggle = async (rowKey: string, target: "psicologo" | "psiquiatra" | "only_me") => {
    const current = prefs[rowKey] ?? { psicologo: false, psiquiatra: false };
    let next = { ...current };
    if (target === "only_me") {
      next = { psicologo: false, psiquiatra: false };
    } else {
      next[target] = !current[target];
    }
    const updated = { ...prefs, [rowKey]: next };
    setPrefs(updated);
    try {
      await save.mutateAsync({ preferences: updated });
    } catch (e: any) {
      toast({
        title: "Não consegui salvar",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleConfirm = async () => {
    try {
      await save.mutateAsync({ preferences: prefs, registerConsent: true });
      toast({
        title: "Compartilhamento confirmado",
        description: "Suas escolhas foram registradas com data e hora.",
      });
    } catch (e: any) {
      toast({
        title: "Não consegui confirmar",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async () => {
    if (!confirmDelete || !patientId) return;
    try {
      await removeField.mutateAsync({ patientId, field: confirmDelete.portraitField });
      toast({
        title: "Conteúdo removido",
        description: `"${confirmDelete.label}" foi apagado do seu retrato.`,
      });
    } catch (e: any) {
      toast({
        title: "Erro ao remover",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  const rows = useMemo(() => ROWS, []);

  return (
    <BuddyLayout
      title="Compartilhamento e privacidade"
      description="Aqui você vê exatamente o que está permitindo que seus profissionais vejam. Você decide o que compartilhar."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card className="border-primary/20 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 md:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-foreground">
                    Resumo do que será compartilhado
                  </h2>
                </div>

                {isLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <TooltipProvider delayDuration={150}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground">
                            <th className="text-left font-medium py-3 pr-4">Tema</th>
                            <th className="text-center font-medium py-3 px-2 min-w-[140px]">
                              Compartilhar com<br />meu psicólogo
                            </th>
                            <th className="text-center font-medium py-3 px-2 min-w-[140px]">
                              Compartilhar com<br />meu psiquiatra
                            </th>
                            <th className="text-center font-medium py-3 px-2 min-w-[100px]">
                              Guardar só<br />para mim
                            </th>
                            <th className="text-center font-medium py-3 pl-2 min-w-[80px]">
                              Remover
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {rows.map((row) => {
                            const p = prefs[row.key] ?? { psicologo: false, psiquiatra: false };
                            const isPrivate = !p.psicologo && !p.psiquiatra;
                            const filled = isFilled(row.portraitField);
                            const canRemove = filled && !row.isModule;
                            return (
                              <tr key={row.key} className="align-middle">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-foreground">{row.label}</span>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className="text-muted-foreground hover:text-foreground"
                                          aria-label={`Sobre ${row.label}`}
                                        >
                                          <Info className="h-3.5 w-3.5" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        {row.description}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                  {!filled && !row.isModule && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Sem conteúdo ainda — preferência será aplicada quando você preencher
                                    </p>
                                  )}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <Switch
                                    checked={p.psicologo}
                                    onCheckedChange={() => toggle(row.key, "psicologo")}
                                    aria-label="Compartilhar com meu psicólogo"
                                  />
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <Switch
                                    checked={p.psiquiatra}
                                    onCheckedChange={() => toggle(row.key, "psiquiatra")}
                                    aria-label="Compartilhar com meu psiquiatra"
                                  />
                                </td>
                                <td className="py-3 px-2">
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => toggle(row.key, "only_me")}
                                      className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center border transition-colors",
                                        isPrivate
                                          ? "bg-primary/10 border-primary text-primary"
                                          : "bg-transparent border-border text-muted-foreground hover:text-foreground"
                                      )}
                                      aria-label="Guardar só para mim"
                                      aria-pressed={isPrivate}
                                    >
                                      <Lock className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>

                                <td className="py-3 pl-2">
                                  <div className="flex justify-center">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDelete(row)}
                                      disabled={!filled}
                                      className={cn(
                                        "h-9 w-9 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors",
                                        !filled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                                      )}
                                      aria-label="Remover conteúdo"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TooltipProvider>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 border-t border-border/60 bg-muted/30 p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Consentimento registrado em:</p>
                    <p className="font-semibold text-foreground">{consentText}</p>
                    {profile?.nome && (
                      <p className="text-xs text-muted-foreground mt-0.5">Por: {profile.nome}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">
                      Seus dados estão protegidos pela LGPD.
                    </p>
                    <p className="text-muted-foreground">
                      Compartilhamos apenas o que você autorizar. Você pode mudar suas escolhas quando quiser.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/buddy/me-conhecer")}
              className="sm:min-w-[220px]"
            >
              Revisar respostas <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={save.isPending}
              className="sm:min-w-[260px]"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmar compartilhamento
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="flex justify-center">
            <BuddyMascot size="md" />
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 text-center space-y-2">
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">
                Você pode mudar isso a qualquer momento.
              </h3>
              <p className="text-sm text-muted-foreground">
                Seu bem-estar é prioridade. Você está no controle.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover "{confirmDelete?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              O conteúdo desse tema será apagado do seu retrato. Essa ação não pode ser desfeita, mas
              você pode preencher novamente a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BuddyLayout>
  );
}
