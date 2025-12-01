import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Mail, 
  Copy,
  Share2 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export const ShareButtons = ({ url, title, description }: ShareButtonsProps) => {
  const { toast } = useToast();
  
  const formatShareMessage = (platform: 'whatsapp' | 'linkedin' | 'email' | 'twitter') => {
    const baseMessage = {
      whatsapp: `📚 *${title}*\n\n${description ? `${description}\n\n` : ''}Leia o artigo completo:\n${url}\n\n💡 Compartilhe conhecimento sobre saúde emocional!`,
      linkedin: `${title}\n\n${description || ''}\n\nLeia mais em: ${url}\n\n#SaúdeEmocional #BemEstar #Psicologia #AlôPsi`,
      email: `Olá!\n\nEncontrei este artigo interessante que pode te interessar:\n\n${title}\n\n${description ? `${description}\n\n` : ''}Leia o artigo completo em:\n${url}\n\n--\nCompartilhado via Alô, Psi! - Sua plataforma de saúde emocional`,
      twitter: `📖 ${title}\n\n${url}\n\n#SaúdeEmocional #BemEstar`
    };
    return encodeURIComponent(baseMessage[platform]);
  };

  const copyToClipboard = async () => {
    const message = `${title}\n\n${description || ''}\n\nLeia mais em: ${url}`;
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Link copiado!",
        description: "O conteúdo foi copiado para a área de transferência."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'hover:text-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${formatShareMessage('twitter')}`,
      color: 'hover:text-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'hover:text-blue-700'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${formatShareMessage('whatsapp')}`,
      color: 'hover:text-green-600'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${formatShareMessage('email')}`,
      color: 'hover:text-gray-600'
    }
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Compartilhar este post</h4>
          
          <div className="grid grid-cols-5 gap-2">
            {shareLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors ${link.color}`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs">{link.name}</span>
                </a>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
