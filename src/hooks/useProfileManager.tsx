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
      // Prepara os dados removendo campos vazios que causam erro
      const cleanData = { ...data };
      
      // Remove campos que estão vazios para permitir salvamento incremental
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === '' || cleanData[key] === null || cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });
      
      // Usa upsert para inserir ou atualizar apenas os campos fornecidos
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          nome: data.nome || user.user_metadata?.full_name || '',
          tipo_usuario: 'paciente',
          ...cleanData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Aguarda um pouco antes de fazer refetch para garantir que os dados foram persistidos
      setTimeout(() => {
        refetch();
      }, 500);

      return { error: null };
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Função helper para converter File para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove "data:image/...;base64,"
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const uploadProfilePhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      console.log('Starting photo upload for user:', user.id);
      
      // Converter arquivo para base64
      const base64File = await fileToBase64(file);
      
      // Preparar payload JSON
      const payload = {
        file: base64File,
        fileName: file.name,
        fileType: file.type,
        professionalId: user.id
      };

      console.log('Calling upload-to-s3 function with JSON payload...');
      
      // Chamar a Edge Function com JSON
      const { data, error } = await supabase.functions.invoke('upload-to-s3', {
        body: payload,
      });

      console.log('Upload response:', { data, error });

      if (error) throw error;

      if (!data?.url) {
        throw new Error('No URL returned from upload');
      }

      console.log('Photo uploaded successfully:', data.url);
      return data.url;
    } catch (error: any) {
      console.error('Erro no upload para S3:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro ao fazer upload da imagem",
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
      
      // Upload para o S3 via Edge Function
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