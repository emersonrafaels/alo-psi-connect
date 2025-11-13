import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfessionalMultiSelectProps {
  institutionId: string;
  selectedProfessionalIds: number[];
  onChange: (ids: number[]) => void;
}

interface ProfessionalOption {
  id: number;
  name: string;
  profession: string;
  specialties: string[];
  photoUrl: string | null;
}

export const ProfessionalMultiSelect = ({
  institutionId,
  selectedProfessionalIds,
  onChange,
}: ProfessionalMultiSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['institution-professionals-for-coupon', institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_institutions')
        .select(`
          professional_id,
          profissionais!inner(
            id,
            display_name,
            profissao,
            servicos_normalizados,
            foto_perfil_url
          )
        `)
        .eq('institution_id', institutionId)
        .eq('is_active', true);

      if (error) throw error;

      return data?.map(p => ({
        id: p.profissionais.id,
        name: p.profissionais.display_name,
        profession: p.profissionais.profissao || 'Profissional',
        specialties: p.profissionais.servicos_normalizados || [],
        photoUrl: p.profissionais.foto_perfil_url,
      })) || [];
    },
  });

  const filteredProfessionals = professionals?.filter(
    prof =>
      prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.profession.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleProfessional = (profId: number) => {
    if (selectedProfessionalIds.includes(profId)) {
      onChange(selectedProfessionalIds.filter(id => id !== profId));
    } else {
      onChange([...selectedProfessionalIds, profId]);
    }
  };

  const removeProfessional = (profId: number) => {
    onChange(selectedProfessionalIds.filter(id => id !== profId));
  };

  const selectedProfessionals =
    professionals?.filter(p => selectedProfessionalIds.includes(p.id)) || [];

  return (
    <div className="space-y-3">
      {/* Selected badges */}
      {selectedProfessionals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProfessionals.map(prof => (
            <Badge key={prof.id} variant="secondary" className="gap-1">
              <Briefcase className="h-3 w-3" />
              {prof.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeProfessional(prof.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar profissionais..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Professional list */}
      <ScrollArea className="h-64 border rounded-md">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredProfessionals && filteredProfessionals.length > 0 ? (
          <div className="p-2 space-y-1">
            {filteredProfessionals.map(prof => (
              <div
                key={prof.id}
                className="flex items-center gap-3 p-3 rounded-md hover:bg-accent cursor-pointer"
                onClick={() => toggleProfessional(prof.id)}
              >
                <Checkbox checked={selectedProfessionalIds.includes(prof.id)} />
                <Avatar className="h-10 w-10">
                  <AvatarImage src={prof.photoUrl || undefined} />
                  <AvatarFallback>
                    {prof.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{prof.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {prof.profession}
                  </p>
                  {prof.specialties.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {prof.specialties.slice(0, 2).map((spec, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {prof.specialties.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{prof.specialties.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'Nenhum profissional encontrado'
                : 'Nenhum profissional vinculado'}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
