import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  GraduationCap, 
  Ticket, 
  Calendar, 
  Heart, 
  Play, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2
} from "lucide-react";
import { useDemoData, DemoDataAction } from "@/hooks/useDemoData";

const DemoData = () => {
  const { 
    executeAction, 
    isLoading, 
    currentAction,
    results,
    clearResults 
  } = useDemoData();

  const actions: { 
    action: DemoDataAction; 
    title: string; 
    description: string; 
    icon: React.ReactNode;
    count?: string;
    variant?: "default" | "destructive";
  }[] = [
    {
      action: "seed_all",
      title: "Criar Cenário Completo",
      description: "Gera profissionais, alunos, cupons, diários emocionais e agendamentos de uma vez",
      icon: <Play className="h-5 w-5" />,
      count: "~160 registros",
    },
    {
      action: "seed_professionals",
      title: "Criar Profissionais",
      description: "5 profissionais fictícios da UniFOA com perfis completos e horários",
      icon: <Users className="h-5 w-5" />,
      count: "5 profissionais",
    },
    {
      action: "seed_students",
      title: "Criar Alunos",
      description: "8 alunos fictícios representando estudantes de Psicologia",
      icon: <GraduationCap className="h-5 w-5" />,
      count: "8 alunos",
    },
    {
      action: "seed_coupons",
      title: "Criar Cupons",
      description: "4 cupons institucionais com diferentes configurações (válidos até 31/12/2026)",
      icon: <Ticket className="h-5 w-5" />,
      count: "4 cupons",
    },
    {
      action: "seed_mood_entries",
      title: "Criar Diários Emocionais",
      description: "~100 entradas de humor dos últimos 30 dias para cada aluno",
      icon: <Heart className="h-5 w-5" />,
      count: "~100 entradas",
    },
    {
      action: "seed_appointments",
      title: "Criar Agendamentos",
      description: "40 agendamentos: 25 realizados, 3 cancelados e 12 futuros",
      icon: <Calendar className="h-5 w-5" />,
      count: "40 agendamentos",
    },
    {
      action: "cleanup",
      title: "Limpar Dados Demo",
      description: "Remove todos os dados demo identificáveis (@unifoa.edu.br)",
      icon: <Trash2 className="h-5 w-5" />,
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dados Demo</h1>
        <p className="text-muted-foreground mt-2">
          Gerar dados de demonstração para showroom e testes
        </p>
      </div>

      {/* Institution Info */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Instituição alvo:</strong> Centro Universitário de Volta Redonda (UniFOA)
          <br />
          <span className="text-muted-foreground text-sm">
            Todos os dados criados serão identificáveis por emails @unifoa.edu.br e marcações [DEMO-UNIFOA]
          </span>
        </AlertDescription>
      </Alert>

      {/* Results Log */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Log de Execução</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearResults}>
              Limpar
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-2 p-2 rounded text-sm ${
                  result.success 
                    ? "bg-green-50 dark:bg-green-950/20" 
                    : "bg-red-50 dark:bg-red-950/20"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <span className="font-medium">{result.action}:</span>{" "}
                  {result.message}
                  {result.details && (
                    <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((item) => {
          const isCurrentlyLoading = isLoading && currentAction === item.action;
          
          return (
            <Card key={item.action} className={item.variant === "destructive" ? "border-destructive/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </div>
                  {item.count && (
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => executeAction(item.action)}
                  disabled={isLoading}
                  variant={item.variant || "default"}
                  className="w-full"
                >
                  {isCurrentlyLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      {item.icon}
                      <span className="ml-2">Executar</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Warning */}
      <Alert variant="destructive" className="bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> Dados demo são destinados apenas para testes e demonstrações. 
          Não use em produção com dados reais. Todos os emails terminam em @unifoa.edu.br para 
          facilitar identificação e limpeza.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DemoData;
