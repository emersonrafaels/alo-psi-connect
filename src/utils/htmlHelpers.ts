export const normalizeHtmlForEditor = (html: string): string => {
  if (!html) return '';
  
  // Converter <br><br> em quebras de parágrafo
  let normalized = html.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>');
  
  // Converter <strong>Texto:</strong> <br><br> em headings
  normalized = normalized.replace(
    /<strong>([^<]+?)(?:\:)?<\/strong>\s*<br\s*\/?>\s*<br\s*\/?>/gi,
    '</p><h2>$1</h2><p>'
  );
  
  // Converter listas numeradas simples (**1.**, **2.**, etc.) em <ol>
  const listPattern = /(\*\*\d+\.\*\*[^\n]+(?:<br\s*\/?>)?)+/gi;
  normalized = normalized.replace(listPattern, (match) => {
    const items = match.match(/\*\*\d+\.\*\*\s*([^<]+?)(?:<br\s*\/?>|$)/gi) || [];
    const listItems = items.map(item => {
      const text = item.replace(/\*\*\d+\.\*\*\s*/, '').replace(/<br\s*\/?>/, '');
      return `<li>${text.trim()}</li>`;
    }).join('');
    return `</p><ol>${listItems}</ol><p>`;
  });
  
  // Limpar tags <p> vazias
  normalized = normalized.replace(/<p>\s*<\/p>/gi, '');
  
  // Garantir que o HTML começa e termina corretamente
  if (!normalized.startsWith('<p>') && !normalized.startsWith('<h')) {
    normalized = '<p>' + normalized;
  }
  if (!normalized.endsWith('</p>') && !normalized.endsWith('>')) {
    normalized = normalized + '</p>';
  }
  
  return normalized;
};
