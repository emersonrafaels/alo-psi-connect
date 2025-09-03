import { useState } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface ProfileData {
  nome: string;
  email: string;
  data_nascimento?: string;
  genero?: string;
  cpf?: string;
  foto_perfil_url?: string;
  como_conheceu?: string;
}

export const useProfileManager = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { profile, refetch } = useUserProfile();
  const { toast } = useToast();

  const updateProfile = async (data: Partial<ProfileData>) => {
    if (!user) return { error: 'Usuário não encontrado' };

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Aguarda um pouco antes de fazer refetch para garantir que os dados foram persistidos
      setTimeout(() => {
        refetch();
      }, 500);

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const saveGooglePhoto = async (googlePhotoUrl: string): Promise<string | null> => {
    if (!user || !googlePhotoUrl) return null;

    try {
      // Download da foto do Google
      const response = await fetch(googlePhotoUrl);
      const blob = await response.blob();
      
      // Criar arquivo
      const file = new File([blob], `google-photo-${user.id}.jpg`, { type: 'image/jpeg' });
      
      // Upload para o Supabase Storage
      return await uploadProfilePhoto(file);
    } catch (error: any) {
      console.error('Erro ao salvar foto do Google:', error);
      return null;
    }
  };

  return {
    loading,
    updateProfile,
    uploadProfilePhoto,
    saveGooglePhoto,
    profile
  };
};