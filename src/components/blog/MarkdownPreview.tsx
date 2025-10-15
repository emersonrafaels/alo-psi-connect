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
          h1: ({ children }) => <h1 className="text-4xl font-bold mt-16 mb-8 tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-3xl font-bold mt-14 mb-6 tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-2xl font-bold mt-10 mb-5 tracking-tight">{children}</h3>,
          p: ({ children }) => <p className="text-lg leading-loose mb-8">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside my-8 space-y-3">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-8 space-y-3">{children}</ol>,
          li: ({ children }) => <li className="text-lg leading-relaxed mb-3 ml-4">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-6 italic my-8 text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) => 
            inline ? (
              <code className="text-primary bg-muted px-2 py-1 rounded">{children}</code>
            ) : (
              <code className="block bg-muted border border-border p-4 rounded my-8 overflow-x-auto">
                {children}
              </code>
            ),
          a: ({ href, children }) => (
            <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt} loading="lazy" className="rounded-xl shadow-lg my-10 w-full" />
          ),
          hr: () => <hr className="my-12 border-border" />,
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
