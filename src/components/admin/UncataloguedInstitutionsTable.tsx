import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileCheck, Link2, Users } from 'lucide-react';
import { UncataloguedInstitution } from '@/hooks/useUncataloguedInstitutions';
import { CatalogueInstitutionModal } from './CatalogueInstitutionModal';
import { LinkInstitutionModal } from './LinkInstitutionModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UncataloguedInstitutionsTableProps {
  institutions: UncataloguedInstitution[];
  isLoading: boolean;
  onCatalogue: (customName: string, officialData: any) => void;
  onLink: (customName: string, targetInstitutionId: string) => void;
  isCataloguing: boolean;
  isLinking: boolean;
}

export function UncataloguedInstitutionsTable({
  institutions,
  isLoading,
  onCatalogue,
  onLink,
  isCataloguing,
  isLinking,
}: UncataloguedInstitutionsTableProps) {
  const [cataloguingInstitution, setCataloguingInstitution] = useState<string | null>(null);
  const [linkingInstitution, setLinkingInstitution] = useState<string | null>(null);
  const [ignoredInstitutions, setIgnoredInstitutions] = useState<Set<string>>(new Set());

  const handleIgnore = (institutionName: string) => {
    setIgnoredInstitutions(prev => new Set([...prev, institutionName]));
  };

  const filteredInstitutions = institutions.filter(
    inst => !ignoredInstitutions.has(inst.name)
  );

  if (isLoading) {
    return <p className="text-center py-8">Carregando...</p>;
  }

  if (filteredInstitutions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Nenhuma instituição não catalogada encontrada.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Todas as instituições digitadas pelos pacientes já estão catalogadas! 🎉
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome (texto livre)</TableHead>
            <TableHead className="text-center">Pacientes</TableHead>
            <TableHead>Primeira Menção</TableHead>
            <TableHead>Última Menção</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInstitutions.map((institution) => (
            <TableRow key={institution.name}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {institution.name}
                  <Badge variant="outline" className="text-xs">
                    Não catalogada
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {institution.patient_count}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(institution.first_mention), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(institution.last_mention), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setCataloguingInstitution(institution.name)}
                    disabled={isCataloguing || isLinking}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Catalogar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkingInstitution(institution.name)}
                    disabled={isCataloguing || isLinking}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Vincular
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleIgnore(institution.name)}
                    disabled={isCataloguing || isLinking}
                  >
                    Ignorar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CatalogueInstitutionModal
        customName={cataloguingInstitution}
        isOpen={!!cataloguingInstitution}
        onClose={() => setCataloguingInstitution(null)}
        onSave={(officialData) => {
          onCatalogue(cataloguingInstitution!, officialData);
          setCataloguingInstitution(null);
        }}
        isSaving={isCataloguing}
      />

      <LinkInstitutionModal
        customName={linkingInstitution}
        isOpen={!!linkingInstitution}
        onClose={() => setLinkingInstitution(null)}
        onSave={(targetInstitutionId) => {
          onLink(linkingInstitution!, targetInstitutionId);
          setLinkingInstitution(null);
        }}
        isSaving={isLinking}
      />
    </>
  );
}
