import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface DraftData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'draft' | 'published';
  read_time_minutes?: number;
  featured_image_url?: string;
  tags?: string[];
  timestamp: number;
}

interface UseLocalDraftOptions {
  postId?: string;
  enabled?: boolean;
}

export const useLocalDraft = (options: UseLocalDraftOptions = {}) => {
  const { postId, enabled = true } = options;
  const draftKey = postId ? `blog-draft-${postId}` : 'blog-draft-new';
  
  const [draft, setDraft, removeDraft] = useLocalStorage<DraftData | null>(
    draftKey,
    null
  );
  
  const [hasCheckedForDraft, setHasCheckedForDraft] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Helper para verificar se o rascunho tem conteúdo significativo
  const hasSignificantContent = (draftData: DraftData | null): boolean => {
    if (!draftData) return false;
    
    const titleLength = (draftData.title || '').trim().length;
    const contentLength = (draftData.content || '').trim().length;
    const hasImage = !!draftData.featured_image_url;
    const hasTags = (draftData.tags || []).length > 0;
    
    // Considerar significativo se:
    // - Título tem mais de 3 caracteres OU
    // - Conteúdo tem mais de 10 caracteres OU
    // - Tem imagem destacada OU
    // - Tem tags selecionadas
    return titleLength > 3 || contentLength > 10 || hasImage || hasTags;
  };

  // Verificar se existe rascunho ao montar
  useEffect(() => {
    if (enabled && !hasCheckedForDraft) {
      setHasCheckedForDraft(true);
      
      if (draft && draft.timestamp) {
        // Verificar se o rascunho tem conteúdo significativo
        if (!hasSignificantContent(draft)) {
          // Remover rascunho vazio silenciosamente
          removeDraft();
          return;
        }
        
        // Verificar se o rascunho não é muito antigo (7 dias)
        const draftAge = Date.now() - draft.timestamp;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (draftAge < sevenDays) {
          setShowRecoveryModal(true);
        } else {
          // Limpar rascunho muito antigo
          removeDraft();
        }
      }
    }
  }, [draft, enabled, hasCheckedForDraft, removeDraft]);

  // Debounce ref para salvar rascunho
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Salvar rascunho com debounce
  const saveDraft = useCallback((data: Omit<DraftData, 'timestamp'>) => {
    if (!enabled) return;
    
    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Agendar salvamento após 500ms
    saveTimeoutRef.current = setTimeout(() => {
      setDraft({
        ...data,
        timestamp: Date.now()
      });
    }, 500);
  }, [enabled, setDraft]);

  // Cleanup do timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Limpar rascunho
  const clearDraft = useCallback(() => {
    removeDraft();
    setShowRecoveryModal(false);
  }, [removeDraft]);

  // Aceitar recuperação
  const acceptRecovery = useCallback(() => {
    setShowRecoveryModal(false);
  }, []);

  // Rejeitar recuperação
  const rejectRecovery = useCallback(() => {
    removeDraft();
    setShowRecoveryModal(false);
  }, [removeDraft]);

  return {
    draft,
    saveDraft,
    clearDraft,
    showRecoveryModal,
    acceptRecovery,
    rejectRecovery,
    hasDraft: !!draft
  };
};
