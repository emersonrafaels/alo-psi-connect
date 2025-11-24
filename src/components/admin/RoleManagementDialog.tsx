import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserManagement } from '@/hooks/useUserManagement';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, X } from 'lucide-react';

interface UserRole {
  id: string;
  role: string;
  created_at: string;
}

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onRoleUpdated?: () => void;
}

const AVAILABLE_ROLES = [
  'author',
  'super_author',
  'moderator',
  'admin',
  'super_admin',
  'institution_admin'
];

export const RoleManagementDialog = ({ 
  open, 
  onOpenChange, 
  userId, 
  userName,
  onRoleUpdated 
}: RoleManagementDialogProps) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loadingRoles, setLoadingRoles] = useState(false);
  const { manageUserRole, loading } = useUserManagement();

  useEffect(() => {
    if (open && userId) {
      fetchUserRoles();
    }
  }, [open, userId]);

  const fetchUserRoles = async () => {
    setLoadingRoles(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user roles:', error);
      } else {
        setUserRoles(data || []);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole) return;

    // Check if role already exists in local state
    if (userRoles.some(ur => ur.role === selectedRole)) {
      return; // Silently ignore if already exists
    }

    const result = await manageUserRole(userId, 'add', selectedRole);
    if (result.success) {
      setSelectedRole('');
      await fetchUserRoles(); // Refresh the list
      onRoleUpdated?.();
    }
  };

  const handleRemoveRole = async (role: string) => {
    const result = await manageUserRole(userId, 'remove', role);
    if (result.success) {
      await fetchUserRoles(); // Refresh the list
      onRoleUpdated?.();
    }
  };

  const availableRolesToAdd = AVAILABLE_ROLES.filter(
    role => !userRoles.some(ur => ur.role === role)
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'admin':
        return 'default';
      case 'institution_admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      case 'super_author':
        return 'secondary';
      case 'author':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Roles - {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Roles */}
          <div>
            <h4 className="text-sm font-medium mb-2">Roles Atuais</h4>
            {loadingRoles ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Carregando roles...</span>
              </div>
            ) : userRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((userRole) => (
                  <Badge
                    key={userRole.id}
                    variant={getRoleBadgeVariant(userRole.role)}
                    className="flex items-center gap-1"
                  >
                    {userRole.role}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleRemoveRole(userRole.role)}
                      disabled={loading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma role atribuída</p>
            )}
          </div>

          {/* Add New Role */}
          {availableRolesToAdd.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Adicionar Role</h4>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione uma role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRolesToAdd.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddRole} 
                  disabled={!selectedRole || loading}
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};