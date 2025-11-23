import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useProfileManager } from './useProfileManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Hook para fazer upload automático de foto pendente após confirmação de email
 * 
 * Detecta se há uma foto salva em sessionStorage durante o cadastro
 * e faz o upload automaticamente no primeiro login após confirmação de email
 */
export const useFirstLoginPhotoUpload = () => {
  const { user } = useAuth();
  const { profile, refetch } = useUserProfile();
  const { uploadProfilePhoto } = useProfileManager();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handlePendingPhoto = async () => {
      // Verificar se usuário está logado e tem perfil
      if (!user || !profile || isUploading) return;

      // Verificar se há foto pendente no sessionStorage
      const pendingPhotoData = sessionStorage.getItem('pendingProfilePhoto');
      if (!pendingPhotoData) return;

      try {
        const photoData = JSON.parse(pendingPhotoData);

        // Validar se é o usuário correto (segurança)
        if (photoData.email !== user.email) {
          console.log('❌ Email da foto pendente não corresponde ao usuário logado');
          sessionStorage.removeItem('pendingProfilePhoto');
          return;
        }

        // Verificar se o perfil já tem foto (evitar duplicação)
        if (profile.foto_perfil_url) {
          console.log('✅ Perfil já possui foto, removendo pendência');
          sessionStorage.removeItem('pendingProfilePhoto');
          return;
        }

        console.log('📸 Foto pendente detectada, iniciando upload...');
        setIsUploading(true);

        // Converter base64 de volta para File
        const file = base64ToFile(photoData.dataUrl, photoData.fileName, photoData.fileType);

        // Fazer upload
        const uploadedUrl = await uploadProfilePhoto(file);

        if (uploadedUrl) {
          console.log('✅ Foto carregada, atualizando perfil...');

          // Atualizar perfil com nova foto
          const { error } = await supabase
            .from('profiles')
            .update({ foto_perfil_url: uploadedUrl })
            .eq('user_id', user.id);

          if (error) throw error;

          // Feedback positivo
          toast({
            title: "✅ Foto de perfil atualizada!",
            description: "Sua foto foi carregada com sucesso.",
          });

          // Limpar sessionStorage
          sessionStorage.removeItem('pendingProfilePhoto');
          console.log('✅ Upload de foto pendente concluído com sucesso!');

          // Refetch do perfil para atualizar a UI
          refetch();
        }
      } catch (error) {
        console.error('❌ Erro ao processar foto pendente:', error);
        
        // Remover foto problemática do sessionStorage
        sessionStorage.removeItem('pendingProfilePhoto');
        
        toast({
          title: "Aviso",
          description: "Não foi possível carregar sua foto. Você pode tentar novamente nas configurações do perfil.",
          variant: "default",
        });
      } finally {
        setIsUploading(false);
      }
    };

    handlePendingPhoto();
  }, [user, profile, isUploading, uploadProfilePhoto, toast, refetch]);

  return { isUploading };
};

/**
 * Converte dataURL (base64) de volta para File object
 */
function base64ToFile(dataUrl: string, fileName: string, fileType: string): File {
  // Extrair a parte base64 da data URL
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || fileType;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], fileName, { type: mime });
}
