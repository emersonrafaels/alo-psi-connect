import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Users, GraduationCap, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserMultiSelectProps {
  institutionId: string;
  selectedUserIds: string[];
  onChange: (ids: string[]) => void;
  filterType: 'institution_students' | 'other_patients';
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  isStudent: boolean;
}

export const UserMultiSelect = ({
  institutionId,
  selectedUserIds,
  onChange,
  filterType,
}: UserMultiSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['institution-users-for-coupon', institutionId, filterType],
    queryFn: async () => {
      // Buscar alunos matriculados na instituição
      const { data: students } = await supabase
        .from('patient_institutions')
        .select(`
          patient_id,
          enrollment_status,
          pacientes!inner(
            profile_id,
            profiles!inner(
              id,
              user_id,
              nome,
              email
            )
          )
        `)
        .eq('institution_id', institutionId)
        .eq('enrollment_status', 'enrolled');

      const studentUserIds = new Set(
        students?.map(s => s.pacientes.profiles.user_id) || []
      );

      // Se filtro é 'institution_students', retornar apenas alunos
      if (filterType === 'institution_students') {
        return students?.map(s => ({
          id: s.pacientes.profiles.user_id,
          name: s.pacientes.profiles.nome,
          email: s.pacientes.profiles.email,
          isStudent: true,
        })) || [];
      }

      // Se filtro é 'other_patients', buscar pacientes vinculados à instituição mas não matriculados
      const { data: linkedPatients } = await supabase
        .from('patient_institutions')
        .select(`
          patient_id,
          pacientes!inner(
            profile_id,
            profiles!inner(
              id,
              user_id,
              nome,
              email
            )
          )
        `)
        .eq('institution_id', institutionId)
        .neq('enrollment_status', 'enrolled');

      return linkedPatients
        ?.filter(p => !studentUserIds.has(p.pacientes.profiles.user_id))
        .map(p => ({
          id: p.pacientes.profiles.user_id,
          name: p.pacientes.profiles.nome,
          email: p.pacientes.profiles.email,
          isStudent: false,
        })) || [];
    },
  });

  const filteredUsers = users?.filter(
    user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  const selectedUsers = users?.filter(u => selectedUserIds.includes(u.id)) || [];

  return (
    <div className="space-y-3">
      {/* Selected badges */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map(user => (
            <Badge key={user.id} variant="secondary" className="gap-1">
              {user.isStudent ? (
                <GraduationCap className="h-3 w-3" />
              ) : (
                <UserPlus className="h-3 w-3" />
              )}
              {user.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeUser(user.id)}
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
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* User list */}
      <ScrollArea className="h-48 border rounded-md">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="p-2 space-y-1">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent cursor-pointer"
                onClick={() => toggleUser(user.id)}
              >
                <Checkbox checked={selectedUserIds.includes(user.id)} />
                <div className="flex items-center gap-2 flex-1">
                  {user.isStudent ? (
                    <GraduationCap className="h-4 w-4 text-primary" />
                  ) : (
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchTerm
                ? 'Nenhum usuário encontrado'
                : 'Nenhum usuário disponível'}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
