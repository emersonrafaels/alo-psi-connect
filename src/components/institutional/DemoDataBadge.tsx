import { useQuery } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

/** Visible marker shown when the institution holds synthetic demonstration data. */
export const DemoDataBadge = ({ institutionId }: { institutionId?: string }) => {
  const { data: isDemo } = useQuery({
    queryKey: ['institution-is-demo', institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data } = await supabase
        .from('educational_institutions')
        .select('is_demo')
        .eq('id', institutionId!)
        .maybeSingle();
      return Boolean((data as { is_demo?: boolean } | null)?.is_demo);
    },
  });
  if (!isDemo) return null;
  return (
    <Badge variant="outline" className="gap-1 border-warning text-warning" title="Todos os números desta instituição são fictícios">
      <FlaskConical className="h-3.5 w-3.5" /> Dados demonstrativos
    </Badge>
  );
};
