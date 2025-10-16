import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  content: string;
  featuredImage?: string;
  title?: string;
  excerpt?: string;
  className?: string;
}

export const MarkdownPreview = ({ 
  content, 
  featuredImage, 
  title, 
  excerpt,
  className 
}: MarkdownPreviewProps) => {
  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none p-6 bg-card rounded-lg border", className)}>
      {featuredImage && (
        <img 
          src={featuredImage} 
          alt={title || 'Featured image'} 
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}
      
      {title && (
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
      )}
      
      {excerpt && (
        <p className="text-lg text-muted-foreground mb-6 italic">{excerpt}</p>
      )}
      
      <div 
        dangerouslySetInnerHTML={{ 
          __html: DOMPurify.sanitize(content || '<p class="text-muted-foreground italic">Comece a escrever para ver o preview...</p>', {
            ALLOWED_TAGS: [
              'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img',
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
              'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr',
              'div', 'span'
            ],
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel']
          })
        }}
      />
    </div>
  );
};
