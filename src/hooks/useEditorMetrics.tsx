import { useMemo } from 'react';
import { extractTextFromHtml, countWordsInHtml, countCharactersInHtml } from '@/utils/htmlSanitizer';

interface EditorMetrics {
  titleLength: number;
  excerptLength: number;
  contentWords: number;
  contentCharacters: number;
  readTimeMinutes: number;
  titleStatus: 'good' | 'warning' | 'error';
  excerptStatus: 'good' | 'warning' | 'error';
  contentStatus: 'good' | 'warning' | 'error';
}

interface UseEditorMetricsProps {
  title: string;
  excerpt: string;
  content: string;
}

export const useEditorMetrics = ({ title, excerpt, content }: UseEditorMetricsProps): EditorMetrics => {
  return useMemo(() => {
    const titleLength = title.length;
    const excerptLength = excerpt.length;
    const contentWords = countWordsInHtml(content);
    const contentCharacters = countCharactersInHtml(content);
    const readTimeMinutes = Math.ceil(contentWords / 200);

    // SEO optimal ranges
    const titleStatus: 'good' | 'warning' | 'error' = 
      titleLength === 0 ? 'error' :
      titleLength > 60 ? 'error' :
      titleLength < 30 ? 'warning' : 'good';

    const excerptStatus: 'good' | 'warning' | 'error' = 
      excerptLength === 0 ? 'warning' :
      excerptLength > 160 ? 'error' :
      excerptLength < 120 ? 'warning' : 'good';

    const contentStatus: 'good' | 'warning' | 'error' = 
      contentWords === 0 ? 'error' :
      contentWords < 300 ? 'warning' : 'good';

    return {
      titleLength,
      excerptLength,
      contentWords,
      contentCharacters,
      readTimeMinutes,
      titleStatus,
      excerptStatus,
      contentStatus
    };
  }, [title, excerpt, content]);
};
