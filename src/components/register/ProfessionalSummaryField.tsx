import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, FileText, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfessionalSummaryFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const EXAMPLES = [
  {
    title: "Psicólogo Clínico - TCC",
    text: "Psicólogo clínico com 8 anos de experiência em Terapia Cognitivo-Comportamental. Especializado em tratamento de ansiedade, depressão e transtornos do humor. Atendimento acolhedor e baseado em evidências científicas, focado em resultados práticos e duradouros."
  },
  {
    title: "Psiquiatra - Saúde Emocional",
    text: "Médico psiquiatra formado pela USP, com residência em Psiquiatria no HC-FMUSP. Atuo com abordagem integrativa, combinando tratamento medicamentoso e psicoterapia de apoio. Experiência em transtornos de ansiedade, depressão e transtorno bipolar."
  },
  {
    title: "Psicoterapeuta - Abordagem Humanista",
    text: "Psicoterapeuta com formação em Gestalt-terapia e 5 anos de experiência. Trabalho com autoconhecimento, relacionamentos e processos de mudança. Meu foco é criar um espaço seguro para você se expressar autenticamente e encontrar seus próprios caminhos."
  },
  {
    title: "Psicólogo Infantil",
    text: "Psicóloga especializada em atendimento infantil e adolescente há 6 anos. Utilizo ludoterapia e técnicas lúdicas para ajudar crianças a expressarem suas emoções. Atuo com dificuldades escolares, ansiedade infantil, TDAH e questões familiares."
  },
  {
    title: "Terapeuta de Casal",
    text: "Psicoterapeuta especializado em terapia de casal com 10 anos de experiência. Ajudo casais a fortalecerem sua comunicação, resolverem conflitos e reconstruírem vínculos afetivos. Abordagem empática e imparcial, focada no diálogo e compreensão mútua."
  },
  {
    title: "Psicólogo Organizacional",
    text: "Psicólogo organizacional com MBA em Gestão de Pessoas. Atuo com coaching de carreira, desenvolvimento de liderança e gestão de estresse profissional. Ajudo executivos e profissionais a alcançarem equilíbrio entre vida pessoal e carreira."
  },
  {
    title: "Neuropsicólogo",
    text: "Neuropsicólogo especializado em avaliação cognitiva e reabilitação neuropsicológica. Atuo com casos de TDAH, dislexia, lesões cerebrais e declínio cognitivo. Utilizo testes padronizados e técnicas baseadas em neurociência para diagnóstico e intervenção."
  }
];

const MIN_CHARS = 100;
const MAX_CHARS = 500;
const IDEAL_CHARS = 200;

export const ProfessionalSummaryField = ({ value, onChange }: ProfessionalSummaryFieldProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const charCount = value.length;
  
  const getCharCountColor = () => {
    if (charCount < MIN_CHARS) return 'text-red-500';
    if (charCount < IDEAL_CHARS) return 'text-yellow-600';
    if (charCount <= MAX_CHARS) return 'text-green-600';
    return 'text-red-500';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="resumoProfissional">
          Resumo Profissional <span className="text-red-500">*</span>
        </Label>
        
        {/* Modal com exemplos */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-auto p-1">
              <FileText className="h-4 w-4 mr-1" />
              <span className="text-xs">Ver exemplos</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Exemplos de Resumo Profissional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {EXAMPLES.map((example, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">{example.title}</h4>
                  <p className="text-sm text-muted-foreground">{example.text}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onChange(example.text);
                      setIsOpen(false);
                      setIsHighlighted(true);
                      
                      toast({
                        title: "✨ Template aplicado!",
                        description: `"${example.title}" foi adicionado como base. Personalize conforme necessário.`,
                        duration: 4000,
                      });
                      
                      setTimeout(() => setIsHighlighted(false), 2000);
                    }}
                  >
                    Usar como base
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Descreva sua experiência, abordagem terapêutica e o que torna seu atendimento especial.
      </p>

      {/* Dicas inline */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg space-y-1.5">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-blue-900 dark:text-blue-100">Dicas para um bom resumo:</p>
            <ul className="text-blue-700 dark:text-blue-300 space-y-0.5 list-disc list-inside">
              <li>Mencione seus anos de experiência</li>
              <li>Destaque sua principal abordagem terapêutica</li>
              <li>Inclua suas especializações ou públicos-alvo</li>
              <li>Use linguagem acessível e acolhedora</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <Textarea
        id="resumoProfissional"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Psicólogo clínico com 5 anos de experiência em TCC, especializado em ansiedade e depressão..."
        rows={6}
        required
        maxLength={MAX_CHARS}
        className={isHighlighted ? "ring-2 ring-green-500 ring-offset-2 transition-all duration-500" : ""}
      />

      {/* Badge de confirmação */}
      {isHighlighted && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg animate-in fade-in slide-in-from-top-2 duration-500">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-300 font-medium">
            Template aplicado! Agora personalize com suas informações.
          </span>
        </div>
      )}

      {/* Contador de caracteres com barra de progresso */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className={getCharCountColor()}>
            {charCount < MIN_CHARS 
              ? `Escreva pelo menos ${MIN_CHARS - charCount} caracteres` 
              : charCount > MAX_CHARS
              ? `Limite excedido em ${charCount - MAX_CHARS} caracteres`
              : `${charCount} / ${MAX_CHARS} caracteres`}
          </span>
          <span className="text-muted-foreground">
            Ideal: {IDEAL_CHARS} caracteres
          </span>
        </div>
        
        {/* Barra de progresso */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              charCount < MIN_CHARS ? 'bg-red-500' :
              charCount < IDEAL_CHARS ? 'bg-yellow-500' :
              charCount <= MAX_CHARS ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min((charCount / MAX_CHARS) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
