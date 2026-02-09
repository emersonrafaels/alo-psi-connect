import { useUserType } from './useUserType';
import { useUserRole } from './useUserRole';
import { useUserProfile } from './useUserProfile';

export const useCanCreateSessions = () => {
  const { isProfessional } = useUserType();
  const { profile } = useUserProfile();
  const { hasRole: isAdmin } = useUserRole('admin');
  const { hasRole: isSuperAdmin } = useUserRole('super_admin');
  const { hasRole: isAuthor } = useUserRole('author');
  const { hasRole: isSuperAuthor } = useUserRole('super_author');
  const { hasRole: isInstitutionAdmin } = useUserRole('institution_admin');
  const { hasRole: isFacilitator } = useUserRole('facilitator');

  const isAdminType = profile?.tipo_usuario === 'admin';

  const canCreateSessions = isProfessional || isAdminType || isAdmin || isSuperAdmin
    || isAuthor || isSuperAuthor || isInstitutionAdmin || isFacilitator;

  return { canCreateSessions };
};
