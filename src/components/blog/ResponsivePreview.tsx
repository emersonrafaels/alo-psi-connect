import { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ResponsivePreviewProps {
  content: string;
  title: string;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes = {
  desktop: { width: '100%', label: 'Desktop' },
  tablet: { width: '768px', label: 'Tablet' },
  mobile: { width: '375px', label: 'Mobile' },
};

export const ResponsivePreview = ({ content, title }: ResponsivePreviewProps) => {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview Responsivo</h3>
        <Tabs value={viewport} onValueChange={(v) => setViewport(v as ViewportSize)}>
          <TabsList>
            <TabsTrigger value="desktop" className="gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Desktop</span>
            </TabsTrigger>
            <TabsTrigger value="tablet" className="gap-2">
              <Tablet className="h-4 w-4" />
              <span className="hidden sm:inline">Tablet</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Mobile</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="p-4 bg-muted/50">
        <div className="flex justify-center">
          <div
            className="bg-background border rounded-lg shadow-xl overflow-hidden transition-all duration-300"
            style={{
              width: viewportSizes[viewport].width,
              maxWidth: '100%',
            }}
          >
            <div className="p-6 overflow-auto" style={{ maxHeight: '600px' }}>
              <h1 className="text-2xl font-bold mb-4">{title}</h1>
              <div
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Visualizando em: {viewportSizes[viewport].label} ({viewportSizes[viewport].width})
      </div>
    </div>
  );
};
