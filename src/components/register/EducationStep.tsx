import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

export interface EducationEntry {
  institution: string;
  course: string;
  year: number;
}

interface EducationStepProps {
  value: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

export const EducationStep = ({ value, onChange }: EducationStepProps) => {
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');

  const canAdd = institution.trim() && course.trim() && year;

  const handleAdd = () => {
    if (!canAdd) return;
    onChange([...value, { institution: institution.trim(), course: course.trim(), year: parseInt(year) }]);
    setInstitution('');
    setCourse('');
    setYear('');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Informe sua(s) formação(ões) acadêmica(s). É obrigatório adicionar pelo menos uma. <span className="text-destructive font-medium">*</span>
        </p>
      </div>

      {/* Lista de formações já adicionadas */}
      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((entry, index) => (
            <Card key={index} className="border">
              <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <GraduationCap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{entry.course}</p>
                    <p className="text-sm text-muted-foreground truncate">{entry.institution}</p>
                    <p className="text-xs text-muted-foreground">Conclusão: {entry.year}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulário para adicionar nova formação */}
      <Card className="border-dashed">
        <CardContent className="pt-4 pb-4 space-y-4">
          <p className="text-sm font-medium">Adicionar formação</p>

          <div>
            <Label htmlFor="edu-institution">Instituição <span className="text-destructive">*</span></Label>
            <Input
              id="edu-institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Ex: Universidade de São Paulo"
            />
          </div>

          <div>
            <Label htmlFor="edu-course">Curso <span className="text-destructive">*</span></Label>
            <Input
              id="edu-course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="Ex: Psicologia"
            />
          </div>

          <div>
            <Label htmlFor="edu-year">Ano de Conclusão <span className="text-destructive">*</span></Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAdd}
            disabled={!canAdd}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar formação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
