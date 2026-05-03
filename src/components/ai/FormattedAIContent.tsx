import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface FormattedAIContentProps {
  content: string;
  className?: string;
}

/**
 * Pre-cleans AI-generated markdown so that headings, lists and paragraphs
 * always render with proper spacing, even when the model returns them
 * glued together without blank lines.
 */
function preformat(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\r\n/g, '\n')
    // collapse 3+ blank lines
    .replace(/\n{3,}/g, '\n\n')
    // normalize bullets
    .replace(/^[\s]*[•·]\s+/gm, '- ')
    // ensure blank line BEFORE any heading
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    // ensure blank line AFTER a heading line
    .replace(/(^|\n)(#{1,6} [^\n]+)\n(?!\n)/g, '$1$2\n\n')
    .trim();
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      {...props}
      className="text-xl font-bold text-primary mt-6 mb-3 pb-2 border-b border-border first:mt-0"
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 {...props} className="text-lg font-semibold text-primary mt-5 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      {...props}
      className="text-base font-semibold text-foreground mt-4 mb-2 flex items-center gap-2 first:mt-0"
    >
      <span className="inline-block w-1 h-4 rounded-sm bg-primary" />
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 {...props} className="text-sm font-semibold text-foreground/90 mt-3 mb-1.5 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p {...props} className="text-sm leading-relaxed text-foreground/90 my-2.5">
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} className="font-semibold text-foreground">
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em {...props} className="italic text-foreground/90">
      {children}
    </em>
  ),
  ul: ({ children, ...props }) => (
    <ul {...props} className="my-3 ml-1 space-y-1.5 list-none">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol {...props} className="my-3 ml-5 space-y-1.5 list-decimal marker:text-primary marker:font-semibold">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      {...props}
      className="text-sm leading-relaxed text-foreground/90 pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[0.55rem] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary"
    >
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      {...props}
      className="my-3 border-l-4 border-primary/60 bg-primary/5 px-4 py-2 rounded-r text-sm text-foreground/90 italic"
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-5 border-border" />,
  a: ({ children, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = (className || '').includes('language-');
    if (isBlock) {
      return (
        <code
          {...props}
          className={cn(
            'block bg-muted text-foreground rounded-md px-3 py-2 text-xs font-mono overflow-x-auto my-3',
            className
          )}
        >
          {children}
        </code>
      );
    }
    return (
      <code {...props} className="bg-muted text-foreground rounded px-1.5 py-0.5 text-[0.85em] font-mono">
        {children}
      </code>
    );
  },
  table: ({ children, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table {...props} className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th {...props} className="border border-border bg-muted px-3 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="border border-border px-3 py-1.5 align-top">
      {children}
    </td>
  ),
};

export const FormattedAIContent = ({ content, className }: FormattedAIContentProps) => {
  return (
    <div className={cn('ai-formatted-content', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {preformat(content)}
      </ReactMarkdown>
    </div>
  );
};

export default FormattedAIContent;
