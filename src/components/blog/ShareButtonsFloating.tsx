import { useState, useEffect } from 'react';
import { Facebook, Twitter, Linkedin, Link2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShareButtonsFloatingProps {
  url: string;
  title: string;
}

export const ShareButtonsFloating = ({ url, title }: ShareButtonsFloatingProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      // Mostrar após 20% do scroll e antes de 80%
      const progress = scrolled / (documentHeight - windowHeight);
      setIsVisible(progress > 0.2 && progress < 0.8);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  return (
    <div
      className={cn(
        "fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300",
        "hidden md:flex flex-col gap-2",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8 pointer-events-none"
      )}
    >
      <Button
        size="icon"
        variant="secondary"
        className="shadow-lg hover:scale-110 transition-transform"
        onClick={copyToClipboard}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="shadow-lg hover:scale-110 transition-transform"
        onClick={() => window.open(shareLinks.facebook, '_blank')}
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="shadow-lg hover:scale-110 transition-transform"
        onClick={() => window.open(shareLinks.twitter, '_blank')}
      >
        <Twitter className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="shadow-lg hover:scale-110 transition-transform"
        onClick={() => window.open(shareLinks.linkedin, '_blank')}
      >
        <Linkedin className="h-4 w-4" />
      </Button>
    </div>
  );
};
