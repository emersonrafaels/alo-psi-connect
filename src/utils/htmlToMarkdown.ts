/**
 * Converte HTML para Markdown
 * Útil para quando usuários colam conteúdo de outras fontes (WordPress, etc.)
 */
export const convertHtmlToMarkdown = (html: string): string => {
  // Criar elemento temporário para parsing
  const temp = document.createElement('div');
  temp.innerHTML = html;

  const convertNode = (node: Node): string => {
    // Nó de texto
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    // Nó de elemento
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      const children = Array.from(element.childNodes)
        .map(child => convertNode(child))
        .join('');

      switch (tagName) {
        case 'h1':
          return `# ${children}\n\n`;
        case 'h2':
          return `## ${children}\n\n`;
        case 'h3':
          return `### ${children}\n\n`;
        case 'h4':
          return `#### ${children}\n\n`;
        case 'h5':
          return `##### ${children}\n\n`;
        case 'h6':
          return `###### ${children}\n\n`;
        
        case 'strong':
        case 'b':
          return `**${children}**`;
        
        case 'em':
        case 'i':
          return `*${children}*`;
        
        case 'code':
          return `\`${children}\``;
        
        case 'a':
          const href = element.getAttribute('href') || '';
          return `[${children}](${href})`;
        
        case 'img':
          const src = element.getAttribute('src') || '';
          const alt = element.getAttribute('alt') || 'imagem';
          return `![${alt}](${src})`;
        
        case 'p':
          return `${children}\n\n`;
        
        case 'br':
          return '\n';
        
        case 'ul':
          return `${children}\n`;
        
        case 'ol':
          return `${children}\n`;
        
        case 'li':
          // Detectar se é item de lista ordenada ou não
          const parent = element.parentElement;
          const isOrdered = parent?.tagName.toLowerCase() === 'ol';
          const prefix = isOrdered ? '1. ' : '- ';
          return `${prefix}${children}\n`;
        
        case 'blockquote':
          return children
            .split('\n')
            .filter(line => line.trim())
            .map(line => `> ${line}`)
            .join('\n') + '\n\n';
        
        case 'pre':
          return `\`\`\`\n${children}\n\`\`\`\n\n`;
        
        case 'hr':
          return '\n---\n\n';
        
        case 'table':
          return convertTable(element);
        
        case 'div':
        case 'span':
        case 'article':
        case 'section':
          // Para elementos de container, apenas retornar os filhos
          return children;
        
        default:
          return children;
      }
    }

    return '';
  };

  const markdown = convertNode(temp);
  
  // Limpar múltiplas linhas em branco consecutivas
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Converte uma tabela HTML em Markdown
 */
const convertTable = (table: HTMLElement): string => {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return '';

  const convertRow = (row: HTMLElement, isHeader = false): string => {
    const cells = Array.from(row.querySelectorAll(isHeader ? 'th' : 'td'));
    return '| ' + cells.map(cell => cell.textContent?.trim() || '').join(' | ') + ' |';
  };

  const headerRow = rows[0];
  const header = convertRow(headerRow, true);
  const cells = headerRow.querySelectorAll('th, td');
  const separator = '| ' + Array.from(cells).map(() => '---').join(' | ') + ' |';
  
  const bodyRows = rows.slice(1).map(row => convertRow(row));

  return [header, separator, ...bodyRows].join('\n') + '\n\n';
};
