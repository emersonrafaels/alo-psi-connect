import ReactMarkdown from 'react-markdown';
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
      
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="ml-4">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => 
            inline ? (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <code className="block bg-muted p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm">
                {children}
              </code>
            ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt} className="rounded-lg my-4 w-full" />
          ),
          hr: () => <hr className="my-8 border-border" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-border">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2">{children}</td>
          ),
        }}
      >
        {content || '*Comece a escrever para ver o preview...*'}
      </ReactMarkdown>
    </div>
  );
};
