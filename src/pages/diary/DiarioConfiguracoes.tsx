import { useState } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  Settings2,
  Sparkles,
  Check,
} from "lucide-react";

import { useEmotionConfig } from "@/hooks/useEmotionConfig";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";

const DiarioConfiguracoes = () => {
  const {
    userConfigs,
    activeConfigs,
    loading,
    currentTemplate,
    addCustomEmotion,
    removeEmotion,
    toggleEmotion,
    applyTemplate,
  } = useEmotionConfig();

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const [customEmotionName, setCustomEmotionName] =
    useState("");

  const [applyingTemplate, setApplyingTemplate] =
    useState<string | null>(null);

  const scaleEmojis: Record<number, string> = {
    1: "😢",
    2: "😔",
    3: "😐",
    4: "😊",
    5: "🤩",
  };

  const scaleColors: Record<number, string> = {
    1: "#ef4444",
    2: "#f97316",
    3: "#eab308",
    4: "#22c55e",
    5: "#059669",
  };

  const popularEmotions = [
    "Criatividade",
    "Foco",
    "Relaxamento",
    "Motivação",
    "Confiança",
    "Produtividade",
    "Paciência",
    "Gratidão",
    "Clareza",
    "Disposição",
    "Calma",
    "Inspiração",
  ];

  const handleRemoveEmotion = async (
    emotionType: string
  ) => {
    try {
      await removeEmotion(emotionType);

      toast.success(
        "Emoção removida com sucesso!"
      );
    } catch {
      toast.error("Erro ao remover emoção");
    }
  };

  const handleToggleEmotion = async (
    emotionType: string
  ) => {
    try {
      await toggleEmotion(emotionType);

      toast.success(
        "Configuração atualizada!"
      );
    } catch {
      toast.error(
        "Erro ao atualizar configuração"
      );
    }
  };

  const handleApplyTemplate = async (
    category:
      | "basic"
      | "advanced"
      | "wellbeing"
      | "professional"
  ) => {
    setApplyingTemplate(category);

    try {
      await applyTemplate(category);

      toast.success(
        "Template aplicado com sucesso!"
      );
    } catch {
      toast.error("Erro ao aplicar template");
    } finally {
      setApplyingTemplate(null);
    }
  };

  const handleAddCustomEmotion = async () => {
    if (!customEmotionName.trim()) {
      toast.error(
        "Digite um nome para a emoção"
      );

      return;
    }

    if (customEmotionName.length > 30) {
      toast.error(
        "Nome muito longo (máximo 30 caracteres)"
      );

      return;
    }

    const existingNames = userConfigs.map(
      (config) =>
        config.display_name.toLowerCase()
    );

    if (
      existingNames.includes(
        customEmotionName
          .trim()
          .toLowerCase()
      )
    ) {
      toast.error(
        "Já existe uma emoção com este nome"
      );

      return;
    }

    try {
      const emojiSet: Record<
        string,
        string
      > = {};

      const colorScheme: Record<
        string,
        string
      > = {};

      for (let i = 1; i <= 5; i++) {
        emojiSet[i.toString()] =
          scaleEmojis[i];

        colorScheme[i.toString()] =
          scaleColors[i];
      }

      await addCustomEmotion(
        customEmotionName,
        1,
        5,
        emojiSet,
        colorScheme
      );

      toast.success(
        "Emoção personalizada criada!"
      );

      setCustomEmotionName("");
      setAddDialogOpen(false);
    } catch (error: any) {
      toast.error(
        error.message ||
          "Erro ao criar emoção personalizada"
      );
    }
  };

  const getCategoryLabel = (
    category: string
  ) => {
    const labels: Record<string, string> = {
      basic: "Básico",
      advanced: "Avançado",
      wellbeing: "Bem-estar",
      professional: "Completo",
      custom: "Personalizado",
    };

    return labels[category] || category;
  };

  const getTemplateDescription = (
    template: string
  ) => {
    const descriptions: Record<
      string,
      string
    > = {
      basic:
        "3 emoções essenciais para começar",
      advanced:
        "6 emoções para análise mais profunda",
      wellbeing:
        "5 emoções focadas em bem-estar",
      professional:
        "12 emoções para análise completa",
      custom:
        "Configuração personalizada por você",
    };

    return descriptions[template] || "";
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#7667c9] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 lg:px-10">
      <div className="mx-auto max-w-[1400px]">

        {/* CABEÇALHO */}

        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-[#7667c9]">
            Personalização
          </p>

          <h1 className="text-3xl font-bold text-[#173575]">
            Configurações
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Escolha quais emoções deseja
            acompanhar no seu diário.
          </p>
        </div>

        {/* TEMPLATE ATUAL */}

        {currentTemplate && (
          <div className="mb-6 rounded-2xl border border-[#ddd7fb] bg-[#f5f2ff] p-5">
            <div className="flex items-center gap-4">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                <Sparkles className="h-5 w-5 text-[#7667c9]" />
              </div>

              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500">
                  Template atual
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <p className="font-semibold text-[#173575]">
                    {getCategoryLabel(
                      currentTemplate
                    )}
                  </p>

                  <Badge
                    variant="secondary"
                  >
                    {activeConfigs.length} ativas
                  </Badge>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {getTemplateDescription(
                    currentTemplate
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATES */}

        <Card className="mb-6 rounded-2xl">
          <CardHeader>
            <CardTitle>
              Templates rápidos
            </CardTitle>

            <CardDescription>
              Escolha uma configuração pronta
              de emoções.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            {[
              {
                key: "basic",
                name: "Básico",
                count: 3,
              },
              {
                key: "advanced",
                name: "Avançado",
                count: 6,
              },
              {
                key: "wellbeing",
                name: "Bem-estar",
                count: 5,
              },
              {
                key: "professional",
                name: "Completo",
                count: 12,
              },
            ].map((template) => (
              <Button
                key={template.key}
                variant={
                  currentTemplate ===
                  template.key
                    ? "default"
                    : "outline"
                }
                className="relative h-auto flex-col py-5"
                disabled={
                  applyingTemplate !== null
                }
                onClick={() =>
                  handleApplyTemplate(
                    template.key as
                      | "basic"
                      | "advanced"
                      | "wellbeing"
                      | "professional"
                  )
                }
              >
                {applyingTemplate ===
                template.key ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                    Aplicando...
                  </div>
                ) : (
                  <>
                    {currentTemplate ===
                    template.key ? (
                      <Check className="mb-2 h-5 w-5" />
                    ) : (
                      <Settings2 className="mb-2 h-5 w-5" />
                    )}

                    <span className="font-medium">
                      {template.name}
                    </span>

                    <span className="text-xs opacity-70">
                      {template.count} emoções
                    </span>
                  </>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* EMOÇÕES */}

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">

            <div>
              <CardTitle className="flex items-center gap-2">
                Suas emoções

                <Badge variant="secondary">
                  {activeConfigs.length}{" "}
                  {activeConfigs.length === 1
                    ? "ativa"
                    : "ativas"}
                </Badge>
              </CardTitle>

              <CardDescription>
                Ative ou desative as emoções
                que deseja acompanhar.
              </CardDescription>
            </div>

            <Dialog
              open={addDialogOpen}
              onOpenChange={setAddDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    Criar emoção personalizada
                  </DialogTitle>

                  <DialogDescription>
                    Crie uma emoção com seu
                    próprio nome.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-5">

                  <div className="space-y-2">
                    <Label htmlFor="emotion-name">
                      Nome da emoção
                    </Label>

                    <Input
                      id="emotion-name"
                      placeholder="Ex: Criatividade, Foco..."
                      value={
                        customEmotionName
                      }
                      onChange={(e) =>
                        setCustomEmotionName(
                          e.target.value
                        )
                      }
                      maxLength={30}
                    />

                    <p className="text-xs text-slate-400">
                      {
                        customEmotionName.length
                      }
                      /30 caracteres
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm text-slate-500">
                      Sugestões
                    </Label>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {popularEmotions.map(
                        (name) => (
                          <Badge
                            key={name}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() =>
                              setCustomEmotionName(
                                name
                              )
                            }
                          >
                            {name}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 rounded-xl bg-slate-50 p-4">

                    {[1, 2, 3, 4, 5].map(
                      (value) => (
                        <div
                          key={value}
                          className="flex flex-col items-center gap-1 rounded-lg bg-white p-3"
                        >
                          <span className="text-2xl">
                            {
                              scaleEmojis[
                                value
                              ]
                            }
                          </span>

                          <span className="text-xs font-semibold text-slate-500">
                            {value}
                          </span>
                        </div>
                      )
                    )}

                  </div>

                  <Button
                    onClick={
                      handleAddCustomEmotion
                    }
                    className="w-full"
                    disabled={
                      !customEmotionName.trim()
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Criar emoção
                  </Button>

                </div>
              </DialogContent>
            </Dialog>

          </CardHeader>

          <CardContent className="space-y-3">

            {userConfigs.map((config) => (
              <div
                key={config.id}
                className="
                  flex
                  items-center
                  gap-4
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                "
              >
                <GripVertical className="h-5 w-5 text-slate-300" />

                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[#173575]">
                      {
                        config.display_name
                      }
                    </p>

                    <span className="text-xl">
                      {
                        config.emoji_set[
                          config.scale_min.toString()
                        ]
                      }
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Escala de{" "}
                    {config.scale_min} a{" "}
                    {config.scale_max}
                  </p>

                </div>

                <Switch
                  checked={config.is_enabled}
                  onCheckedChange={() =>
                    handleToggleEmotion(
                      config.emotion_type
                    )
                  }
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleRemoveEmotion(
                      config.emotion_type
                    )
                  }
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>

              </div>
            ))}

            {userConfigs.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-500">
                  Nenhuma emoção configurada.
                </p>
              </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DiarioConfiguracoes;