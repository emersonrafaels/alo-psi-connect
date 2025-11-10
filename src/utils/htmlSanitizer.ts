import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr',
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel',
      'src', 'alt', 'title',
      'class', 'style',
      'colspan', 'rowspan',
      'data-type', 'data-height', 'data-caption'
    ],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
};

export const extractTextFromHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

export const countWordsInHtml = (html: string): number => {
  const text = extractTextFromHtml(html);
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export const countCharactersInHtml = (html: string): number => {
  const text = extractTextFromHtml(html);
  return text.length;
};
