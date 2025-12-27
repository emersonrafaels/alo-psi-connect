import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSearchFilters } from "@/hooks/useSearchFilters";
const profissoes = [
  { value: "psicologia", label: "Psicologia" },
  { value: "psicoterapia", label: "Psicoterapia" },
  { value: "psiquiatria", label: "Psiquiatria" }
];

const especialidades = [
  { value: "acompanhamento-terapeutico", label: "Acompanhamento Terapêutico" },
  { value: "adocao-filhos", label: "Adoção de Filhos" },
  { value: "adolescencia", label: "Adolescência" },
  { value: "agorafobia", label: "Agorafobia" },
  { value: "anorexia-nervosa", label: "Anorexia Nervosa" },
  { value: "ansiedade", label: "Ansiedade" },
  { value: "aprendizagem", label: "Aprendizagem" },
  { value: "asperger", label: "Asperger" },
  { value: "assessoramento-academico", label: "Assessoramento Acadêmico" },
  { value: "autismo", label: "Autismo" },
  { value: "avaliacao-neuropsicologica", label: "Avaliação Neuropsicológica" },
  { value: "baby-blues", label: "Baby Blues" },
  { value: "borderline", label: "Borderline" },
  { value: "bulimia-nervosa", label: "Bulimia Nervosa" },
  { value: "cancer", label: "Câncer" },
  { value: "casais", label: "Casais" },
  { value: "casamento", label: "Casamento" },
  { value: "cirurgia-bariatrica", label: "Cirurgia Bariátrica" },
  { value: "cleptomania", label: "Cleptomania" },
  { value: "coaching", label: "Coaching" },
  { value: "compulsao-alimentar", label: "Compulsão Alimentar" },
  { value: "compulsoes", label: "Compulsões" },
  { value: "conflitos-amorosos", label: "Conflitos Amorosos" },
  { value: "conflitos-familiares", label: "Conflitos Familiares" },
  { value: "conflitos-legais", label: "Conflitos Legais" },
  { value: "cuidados-paliativos", label: "Cuidados Paliativos" },
  { value: "dependencia-jogos", label: "Dependência Jogos" },
  { value: "dependencia-quimica", label: "Dependência Química" },
  { value: "depressao", label: "Depressão" },
  { value: "depressao-pos-parto", label: "Depressão Pós-Parto" },
  { value: "desenvolvimento-pessoal", label: "Desenvolvimento Pessoal" },
  { value: "dificuldade-aprendizagem", label: "Dificuldade de Aprendizagem" },
  { value: "discalculia", label: "Discalculia" },
  { value: "disfuncoes-sexuais", label: "Disfunções Sexuais" },
  { value: "dislexia", label: "Dislexia" },
  { value: "distimia", label: "Distimia" },
  { value: "disturbios-alimentares", label: "Distúrbios Alimentares" },
  { value: "doencas-cronicas", label: "Doenças Crônicas" },
  { value: "dor", label: "Dor" },
  { value: "drogas", label: "Drogas" },
  { value: "educacao-escolar", label: "Educação Escolar" },
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "encoprese", label: "Encoprese" },
  { value: "entrevistas-psicologicas", label: "Entrevistas Psicológicas" },
  { value: "enurese", label: "Enurese" },
  { value: "esquizofrenia", label: "Esquizofrenia" },
  { value: "estresse", label: "Estresse" },
  { value: "estresse-pos-traumatico", label: "Estresse Pós-Traumático" },
  { value: "familia", label: "Família" },
  { value: "fobia-social", label: "Fobia Social" },
  { value: "fobias", label: "Fobias" },
  { value: "hiperatividade", label: "Hiperatividade" },
  { value: "hipocondria", label: "Hipocondria" },
  { value: "idosos-terceira-idade", label: "Idosos Terceira Idade" },
  { value: "infancia", label: "Infância" },
  { value: "libras", label: "Libras – Língua Brasileira de Sinais" },
  { value: "ludoterapia", label: "Ludoterapia" },
  { value: "medos", label: "Medos" },
  { value: "morte-luto", label: "Morte e Luto" },
  { value: "neuropsicologia", label: "Neuropsicologia" },
  { value: "neuropsicologia-idoso", label: "Neuropsicologia do Idoso" },
  { value: "neuropsicologia-infantil", label: "Neuropsicologia Infantil" },
  { value: "obesidade", label: "Obesidade" },
  { value: "orientacao-educadores", label: "Orientação de Educadores" },
  { value: "orientacao-pais", label: "Orientação de Pais" },
  { value: "orientacao-cirurgia-bariatrica", label: "Orientação para Cirurgia Bariátrica" },
  { value: "orientacao-profissional", label: "Orientação Profissional" },
  { value: "orientacao-psicologica", label: "Orientação Psicológica" },
  { value: "orientacao-psicopedagogica", label: "Orientação Psicopedagógica" },
  { value: "orientacao-vocacional", label: "Orientação Vocacional" },
  { value: "pessoas-deficiencia", label: "Pessoas com Deficiência – PCD" },
  { value: "piromania", label: "Piromania" },
  { value: "planejamento-psicopedagogico", label: "Planejamento Psicopedagógico" },
  { value: "preparacao-aposentadoria", label: "Preparação para Aposentadoria" },
  { value: "problemas-aprendizagem", label: "Problemas de Aprendizagem" },
  { value: "psicologia-infantil", label: "Psicologia Infantil" },
  { value: "reabilitacao-cognitiva", label: "Reabilitação Cognitiva" },
  { value: "reabilitacao-neuropsicologica", label: "Reabilitação Neuropsicológica" },
  { value: "relacionamentos-afetivos", label: "Relacionamentos Afetivos" },
  { value: "saude-trabalhador", label: "Saúde do Trabalhador" },
  { value: "saude-emocional", label: "Saúde Emocional" },
  { value: "sexologia", label: "Sexologia" },
  { value: "sexualidade", label: "Sexualidade" },
  { value: "sindrome-burnout", label: "Síndrome de Burnout" },
  { value: "sindrome-panico", label: "Síndrome do Pânico" },
  { value: "suicidio", label: "Suicídio" },
  { value: "supervisao-clinica", label: "Supervisão Clínica em Psicologia" },
  { value: "tanatologia", label: "Tanatologia" },
  { value: "tda-tdah", label: "TDA e TDAH" },
  { value: "tdah", label: "TDAH" },
  { value: "terapia-sexual", label: "Terapia Sexual" },
  { value: "testes-psicologicos", label: "Testes Psicológicos" },
  { value: "toc", label: "TOC – Transtorno Obsessivo" },
  { value: "transicao-carreiras", label: "Transição de Carreiras" },
  { value: "transtorno-bipolar", label: "Transtorno Bipolar" },
  { value: "transtorno-personalidade-borderline", label: "Transtorno da Personalidade Borderline" },
  { value: "transtorno-personalidade-histrionica", label: "Transtorno da Personalidade Histriônica" },
  { value: "transtorno-personalidade-narcisista", label: "Transtorno da Personalidade Narcisista" },
  { value: "transtorno-acumulacao", label: "Transtorno de Acumulação" },
  { value: "transtorno-ansiedade-generalizada", label: "Transtorno de Ansiedade Generalizada (TAG)" },
  { value: "transtorno-compulsao-alimentar", label: "Transtorno de Compulsão Alimentar" },
  { value: "transtorno-conduta", label: "Transtorno de Conduta" },
  { value: "transtorno-deficit-atencao", label: "Transtorno de Déficit de Atenção/Hiperatividade" },
  { value: "transtorno-escoriacao", label: "Transtorno de Escoriação" },
  { value: "transtorno-estresse-agudo", label: "Transtorno de Estresse Agudo" },
  { value: "transtorno-estresse-pos-traumatico", label: "Transtorno de Estresse Pós-Traumático (TEPT)" },
  { value: "transtorno-interacao-social", label: "Transtorno de Interação Social Desinibida" },
  { value: "transtorno-oposicao-desafiante", label: "Transtorno de Oposição Desafiante" },
  { value: "transtorno-panico", label: "Transtorno de Pânico ou Síndrome do Pânico" },
  { value: "transtorno-delirante", label: "Transtorno Delirante" },
  { value: "transtorno-depressivo-substancia", label: "Transtorno Depressivo Induzido por Substância Química" },
  { value: "transtorno-disforico-pre-menstrual", label: "Transtorno Disfórico Pré-Menstrual" },
  { value: "transtorno-dismorfico-corporal", label: "Transtorno Dismórfico Corporal" },
  { value: "transtorno-apego-reativo", label: "Transtorno do Apego Reativo" },
  { value: "transtorno-desenvolvimento-intelectual", label: "Transtorno do Desenvolvimento Intelectual" },
  { value: "transtorno-espectro-autista", label: "Transtorno do Espectro Autista – TEA" },
  { value: "transtorno-masoquismo-sexual", label: "Transtorno do Masoquismo Sexual" },
  { value: "transtorno-sadismo-sexual", label: "Transtorno do Sadismo Sexual" },
  { value: "transtorno-sono", label: "Transtorno do Sono" },
  { value: "transtorno-exibicionista", label: "Transtorno Exibicionista" },
  { value: "transtorno-explosivo-intermitente", label: "Transtorno Explosivo Intermitente" },
  { value: "transtorno-fetichista", label: "Transtorno Fetichista" },
  { value: "transtorno-pedofilico", label: "Transtorno Pedofílico" },
  { value: "transtorno-uso-alcool", label: "Transtorno por Uso de Álcool" },
  { value: "transtorno-uso-cannabis", label: "Transtorno por Uso de Cannabis" },
  { value: "transtorno-uso-drogas", label: "Transtorno por Uso de Drogas" },
  { value: "transtorno-uso-fenciclidina", label: "Transtorno por Uso de Fenciclidina" },
  { value: "transtorno-uso-sedativos", label: "Transtorno por Uso de Sedativos" },
  { value: "transtorno-psicotico", label: "Transtorno Psicótico" },
  { value: "transtornos-alimentares", label: "Transtornos Alimentares" },
  { value: "transtornos-personalidade", label: "Transtornos da Personalidade" },
  { value: "transtornos-humor", label: "Transtornos de Humor" },
  { value: "transtornos-depressivos", label: "Transtornos Depressivos" }
];

const MultiSelectCombobox = ({ 
  options, 
  placeholder, 
  selectedValues, 
  onSelectionChange 
}: {
  options: { value: string; label: string }[];
  placeholder: string;
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(item => item !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  const removeItem = (value: string) => {
    onSelectionChange(selectedValues.filter(item => item !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto p-2"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedValues.map((value) => {
                const option = options.find(opt => opt.value === value);
                return (
                  <Badge key={value} variant="secondary" className="text-xs">
                    {option?.label}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(value);
                      }}
                    />
                  </Badge>
                );
              })
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command>
          <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const SearchSection = () => {
  const [selectedProfissoes, setSelectedProfissoes] = useState<string[]>([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const { searchProfessionals } = useSearchFilters();

  const handleSearch = () => {
    searchProfessionals({
      profissoes: selectedProfissoes,
      especialidades: selectedEspecialidades,
      nome
    });
  };

  return (
    <section className="bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2 text-foreground">
            Encontre o melhor profissional para cuidar da sua saúde emocional
          </h2>
          
          <div className="bg-card rounded-lg shadow-lg p-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">
                  🔵 Profissão
                </label>
                <MultiSelectCombobox
                  options={profissoes}
                  placeholder="Selecione profissões"
                  selectedValues={selectedProfissoes}
                  onSelectionChange={setSelectedProfissoes}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">
                  🔵 Especialidades
                </label>
                <MultiSelectCombobox
                  options={especialidades}
                  placeholder="Selecione especialidades"
                  selectedValues={selectedEspecialidades}
                  onSelectionChange={setSelectedEspecialidades}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-card-foreground">
                  🔵 Nome do Profissional
                </label>
                <div className="relative">
                  <Input 
                    placeholder="Digite o nome do profissional" 
                    className="pr-10"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                </div>
              </div>
            </div>
            
            <Button variant="tenant-primary" className="w-full md:w-auto px-8" onClick={handleSearch}>
              Buscar Profissionais
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
export default SearchSection;