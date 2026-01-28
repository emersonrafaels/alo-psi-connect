import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  GraduationCap, 
  Play, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Plus,
  Sparkles,
  Heart
} from "lucide-react";
import { useDemoData, DemoDataParams } from "@/hooks/useDemoData";
import { useInstitutions } from "@/hooks/useInstitutions";
import { useTenant } from "@/hooks/useTenant";

const TENANT_OPTIONS = [
  { id: "3a9ae5ec-50a9-4674-b808-7735e5f0afb5", name: "Medcos" },
  { id: "472db0ac-0f45-4998-97da-490bc579efb1", name: "Rede Bem Estar" },
];

const DemoData = () => {
  const { tenant } = useTenant();
  const { executeAction, isLoading, currentAction, results, clearResults } = useDemoData();
  const { institutions, isLoading: loadingInstitutions } = useInstitutions();

  // Form state for new institution
  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState<"public" | "private">("private");
  const [professionalsCount, setProfessionalsCount] = useState(5);
  const [studentsCount, setStudentsCount] = useState(10);
  const [moodEntriesPerStudent, setMoodEntriesPerStudent] = useState(12);
  const [selectedTenant, setSelectedTenant] = useState(
    tenant?.id || TENANT_OPTIONS[0].id
  );

  // State for existing institution actions
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [addDataProfCount, setAddDataProfCount] = useState(5);
  const [addDataStudentCount, setAddDataStudentCount] = useState(10);
  const [addDataMoodCount, setAddDataMoodCount] = useState(12);

  const handleCreateInstitution = async () => {
    if (!institutionName.trim()) return;

    await executeAction({
      action: "create_institution",
      institutionName: institutionName.trim(),
      institutionType,
      professionalsCount,
      studentsCount,
      moodEntriesPerStudent,
      tenantId: selectedTenant,
    });

    setInstitutionName("");
  };

  const handleAddDataToInstitution = async (institutionId: string) => {
    await executeAction({
      action: "seed_all",
      institutionId,
      professionalsCount: addDataProfCount,
      studentsCount: addDataStudentCount,
      moodEntriesPerStudent: addDataMoodCount,
      tenantId: selectedTenant,
    });
    setSelectedInstitutionId(null);
  };

  const handleCleanup = async (institutionId: string) => {
    await executeAction({
      action: "cleanup",
      institutionId,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerador de Dados Demo</h1>
        <p className="text-muted-foreground mt-2">
          Crie instituições e popule com dados fictícios para demonstrações
        </p>
      </div>

      {/* Create New Institution Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            <CardTitle>Criar Nova Instituição com Dados Demo</CardTitle>
          </div>
          <CardDescription>
            Crie uma instituição e popule automaticamente com profissionais, alunos e diários emocionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Institution Name */}
            <div className="space-y-2">
              <Label htmlFor="institution-name">Nome da Instituição *</Label>
              <Input
                id="institution-name"
                placeholder="Ex: Universidade Federal de São Paulo (UNIFESP)"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use parênteses para a sigla: o domínio de email será gerado automaticamente
              </p>
            </div>

            {/* Institution Type */}
            <div className="space-y-2">
              <Label>Tipo de Instituição</Label>
              <RadioGroup
                value={institutionType}
                onValueChange={(v) => setInstitutionType(v as "public" | "private")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="type-public" />
                  <Label htmlFor="type-public" className="cursor-pointer">Pública</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="type-private" />
                  <Label htmlFor="type-private" className="cursor-pointer">Privada</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Quantidade de Dados</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Professionals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Profissionais
                  </Label>
                  <Badge variant="secondary">{professionalsCount}</Badge>
                </div>
                <Slider
                  value={[professionalsCount]}
                  onValueChange={([v]) => setProfessionalsCount(v)}
                  min={1}
                  max={20}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">1 a 20 profissionais</p>
              </div>

              {/* Students */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Alunos/Pacientes
                  </Label>
                  <Badge variant="secondary">{studentsCount}</Badge>
                </div>
                <Slider
                  value={[studentsCount]}
                  onValueChange={([v]) => setStudentsCount(v)}
                  min={1}
                  max={50}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">1 a 50 alunos</p>
              </div>

              {/* Mood Entries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Diários por Aluno
                  </Label>
                  <Badge variant="secondary">{moodEntriesPerStudent}</Badge>
                </div>
                <Slider
                  value={[moodEntriesPerStudent]}
                  onValueChange={([v]) => setMoodEntriesPerStudent(v)}
                  min={5}
                  max={30}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Total: ~{studentsCount * moodEntriesPerStudent} entradas
                </p>
              </div>
            </div>
          </div>

          {/* Tenant Selection */}
          <div className="space-y-2">
            <Label>Tenant Alvo</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TENANT_OPTIONS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateInstitution}
            disabled={isLoading || !institutionName.trim()}
            className="w-full md:w-auto"
            size="lg"
          >
            {isLoading && currentAction === "create_institution" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Criar Instituição e Dados Demo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Institutions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Instituições Existentes</CardTitle>
          </div>
          <CardDescription>
            Adicione dados demo ou limpe dados existentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInstitutions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : institutions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma instituição cadastrada
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {institutions.map((inst) => (
                <Card key={inst.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{inst.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={inst.type === "public" ? "default" : "secondary"}>
                            {inst.type === "public" ? "Pública" : "Privada"}
                          </Badge>
                          {inst.has_partnership && (
                            <Badge variant="outline" className="text-xs">
                              Parceira
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedInstitutionId === inst.id ? (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium">Configurar dados:</p>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Profs</Label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={addDataProfCount}
                              onChange={(e) => setAddDataProfCount(Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Alunos</Label>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              value={addDataStudentCount}
                              onChange={(e) => setAddDataStudentCount(Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Diários</Label>
                            <Input
                              type="number"
                              min={5}
                              max={30}
                              value={addDataMoodCount}
                              onChange={(e) => setAddDataMoodCount(Number(e.target.value))}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddDataToInstitution(inst.id)}
                            disabled={isLoading}
                          >
                            {isLoading && currentAction === "seed_all" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            Criar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedInstitutionId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInstitutionId(inst.id)}
                          disabled={isLoading}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar Dados
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCleanup(inst.id)}
                          disabled={isLoading}
                        >
                          {isLoading && currentAction === "cleanup" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Limpar
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                  {result.institutionName && (
                    <span className="text-muted-foreground"> ({result.institutionName})</span>
                  )}
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

      {/* Warning */}
      <Alert variant="destructive" className="bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Atenção:</strong> Dados demo são destinados apenas para testes e demonstrações. 
          Todos os registros criados são identificados com marcadores [DEMO-*] para facilitar limpeza.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default DemoData;
