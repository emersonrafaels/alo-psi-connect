import { Link } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isStaffPortalView } from '@/hooks/useInstitutionAccess';

export function StaffViewBanner({ name }: { name?: string }) {
  if (!isStaffPortalView()) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
      <span className="flex items-center gap-2 text-foreground">
        <Eye className="h-4 w-4 text-primary" />
        Visualizando como equipe Rede Bem-Estar{name ? ` — ${name}` : ''} · alunos anonimizados
      </span>
      <Button asChild size="sm" variant="ghost">
        <Link to="/meu-espaco"><ArrowLeft className="h-4 w-4 mr-1" />Voltar ao Meu espaço</Link>
      </Button>
    </div>
  );
}
