export interface TextSelection {
  start: number;
  end: number;
  selectedText: string;
}

export const getTextSelection = (textarea: HTMLTextAreaElement): TextSelection => {
  return {
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
    selectedText: textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
  };
};

export const insertText = (
  textarea: HTMLTextAreaElement,
  textToInsert: string,
  cursorOffset: number = 0
): void => {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  
  const newValue = value.substring(0, start) + textToInsert + value.substring(end);
  textarea.value = newValue;
  
  const newCursorPosition = start + textToInsert.length + cursorOffset;
  textarea.setSelectionRange(newCursorPosition, newCursorPosition);
  textarea.focus();
  
  // Trigger change event
  const event = new Event('input', { bubbles: true });
  textarea.dispatchEvent(event);
};

export const wrapSelection = (
  textarea: HTMLTextAreaElement,
  prefix: string,
  suffix: string = prefix
): void => {
  const selection = getTextSelection(textarea);
  const wrappedText = `${prefix}${selection.selectedText || 'texto'}${suffix}`;
  insertText(textarea, wrappedText, selection.selectedText ? 0 : -suffix.length - 5);
};

export const insertAtLineStart = (
  textarea: HTMLTextAreaElement,
  prefix: string
): void => {
  const value = textarea.value;
  const start = textarea.selectionStart;
  
  // Find the start of the current line
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  
  const newValue = value.substring(0, lineStart) + prefix + value.substring(lineStart);
  textarea.value = newValue;
  
  const newCursorPosition = start + prefix.length;
  textarea.setSelectionRange(newCursorPosition, newCursorPosition);
  textarea.focus();
  
  const event = new Event('input', { bubbles: true });
  textarea.dispatchEvent(event);
};

export const replaceSelection = (
  textarea: HTMLTextAreaElement,
  replacement: string
): void => {
  insertText(textarea, replacement, 0);
};
