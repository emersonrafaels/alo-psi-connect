import { useCallback, RefObject } from 'react';
import { wrapSelection, insertText, insertAtLineStart } from '@/utils/markdownHelpers';

export const useMarkdownToolbar = (textareaRef: RefObject<HTMLTextAreaElement>) => {
  const applyFormatting = useCallback((action: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    switch (action) {
      case 'bold':
        wrapSelection(textarea, '**');
        break;
      case 'italic':
        wrapSelection(textarea, '*');
        break;
      case 'code':
        wrapSelection(textarea, '`');
        break;
      case 'h1':
        insertAtLineStart(textarea, '# ');
        break;
      case 'h2':
        insertAtLineStart(textarea, '## ');
        break;
      case 'h3':
        insertAtLineStart(textarea, '### ');
        break;
      case 'h4':
        insertAtLineStart(textarea, '#### ');
        break;
      case 'h5':
        insertAtLineStart(textarea, '##### ');
        break;
      case 'h6':
        insertAtLineStart(textarea, '###### ');
        break;
      case 'bullet-list':
        insertAtLineStart(textarea, '- ');
        break;
      case 'numbered-list':
        insertAtLineStart(textarea, '1. ');
        break;
      case 'link':
        wrapSelection(textarea, '[', '](url)');
        break;
      case 'image':
        wrapSelection(textarea, '![alt](', ')');
        break;
      case 'quote':
        insertAtLineStart(textarea, '> ');
        break;
      case 'code-block':
        insertText(textarea, '\n```\ncodigo\n```\n', -5);
        break;
      case 'hr':
        insertText(textarea, '\n\n---\n\n', 0);
        break;
      case 'table':
        insertText(textarea, '\n| Coluna 1 | Coluna 2 |\n|----------|----------|\n| Dado 1   | Dado 2   |\n', 0);
        break;
    }
  }, [textareaRef]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          applyFormatting('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting('italic');
          break;
        case 'k':
          e.preventDefault();
          applyFormatting('link');
          break;
      }
    }

    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        insertText(textarea, '  ', 0);
      }
    }
  }, [applyFormatting, textareaRef]);

  return {
    applyFormatting,
    handleKeyDown
  };
};
