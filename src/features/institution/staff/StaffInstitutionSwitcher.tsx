import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronsUpDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { STAFF_INST_KEY } from '@/hooks/useInstitutionAccess';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { resolveStaffInstitution } from './resolveStaffInstitution';

const STAFF_ROLES = ['admin', 'super_admin', 'admin_rbe', 'clinical_coordinator'];

/** Lets RBE staff (Coordenação clínica, Admin RBE, admins) pick which institution every portal page shows. */
export function StaffInstitutionSwitcher() {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const onPortal = pathname.includes('/portal-institucional');
  const [open, setOpen] = useState(false);

  const { data: isStaff } = useQuery({
    queryKey: ['staff-portal-role', user?.id],
    enabled: !!user && onPortal,
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user!.id);
      return (data || []).some((r) => STAFF_ROLES.includes(String(r.role)));
    },
  });
  const { data: institutions = [] } = useQuery({
    queryKey: ['staff-portal-institutions'],
    enabled: !!isStaff && onPortal,
    queryFn: async () => {
      const { data } = await supabase.from('educational_institutions').select('id, name, logo_url').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const current = resolveStaffInstitution(new URLSearchParams(search).get('inst'), sessionStorage.getItem(STAFF_INST_KEY));
  useEffect(() => { if (isStaff && onPortal && !current) setOpen(true); }, [isStaff, onPortal, current]);

  if (!onPortal || !isStaff) return null;
  const currentInst = institutions.find((i) => i.id === current);

  const choose = (id: string) => {
    sessionStorage.setItem(STAFF_INST_KEY, id);
    const params = new URLSearchParams(search);
    params.set('inst', id);
    setOpen(false);
    navigate(`${pathname}?${params.toString()}`, { replace: true });
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 max-w-[280px] rounded-full border-primary/30 bg-background shadow-lg">
        <Building2 className="mr-2 h-4 w-4 text-primary" />
        <span className="truncate">{currentInst?.name ?? 'Escolher instituição'}</span>
        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-60" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 sm:max-w-md">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>Qual instituição você quer ver?</DialogTitle>
            <DialogDescription>Você verá o portal como a instituição vê, com alunos anonimizados.</DialogDescription>
          </DialogHeader>
          <Command className="border-t">
            <CommandInput placeholder="Buscar instituição..." />
            <CommandList className="max-h-80">
              <CommandEmpty>Nenhuma instituição encontrada.</CommandEmpty>
              <CommandGroup>
                {institutions.map((i) => (
                  <CommandItem key={i.id} value={i.id} keywords={[i.name]} onSelect={() => choose(i.id)}>
                    {i.logo_url ? <img src={i.logo_url} alt="" className="mr-2 h-5 w-5 rounded object-contain" /> : <Building2 className="mr-2 h-4 w-4" />}
                    <span className="flex-1 truncate">{i.name}</span>
                    {i.id === current && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
