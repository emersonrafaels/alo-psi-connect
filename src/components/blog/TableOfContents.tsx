import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const TableOfContents = ({ content }: { content: string }) => {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Extrair headings do markdown
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      items.push({ id, text, level });
    }

    setToc(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    // Observar todos os headings
    toc.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <>
      {/* Toggle button para mobile */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="lg:hidden fixed bottom-20 right-4 z-40 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform"
      >
        <List className="h-5 w-5" />
      </button>

      {/* TOC Sidebar */}
      <div
        className={cn(
          "fixed top-24 right-8 w-64 max-h-[70vh] overflow-y-auto transition-all duration-300",
          "hidden lg:block",
          "bg-card/80 backdrop-blur-sm rounded-lg border p-4 shadow-lg"
        )}
      >
        <h3 className="text-sm font-semibold mb-3 text-foreground">Neste artigo</h3>
        <nav>
          <ul className="space-y-2">
            {toc.map(({ id, text, level }) => (
              <li key={id} style={{ paddingLeft: `${(level - 1) * 12}px` }}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "text-sm hover:text-primary transition-colors block py-1",
                    activeId === id
                      ? "text-primary font-medium border-l-2 border-primary pl-2 -ml-2"
                      : "text-muted-foreground"
                  )}
                >
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile overlay */}
      {isVisible && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsVisible(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-3">Neste artigo</h3>
            <nav>
              <ul className="space-y-2">
                {toc.map(({ id, text, level }) => (
                  <li key={id} style={{ paddingLeft: `${(level - 1) * 12}px` }}>
                    <a
                      href={`#${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                        setIsVisible(false);
                      }}
                      className={cn(
                        "text-sm hover:text-primary transition-colors block py-1",
                        activeId === id ? "text-primary font-medium" : "text-muted-foreground"
                      )}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
