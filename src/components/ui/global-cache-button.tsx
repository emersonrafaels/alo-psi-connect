import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { clearAllCache, clearSpecificCache, getCacheInfo, CacheType, ClearCacheOptions } from '@/utils/configCache';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface GlobalCacheButtonProps {
  variant?: 'icon' | 'text' | 'minimal';
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

export const GlobalCacheButton = ({ variant = 'text', size = 'sm', className }: GlobalCacheButtonProps) => {
  const { hasRole } = useAdminAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [preserveTheme, setPreserveTheme] = useState(true);
  const [preserveAuth, setPreserveAuth] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<CacheType[]>(['config']);
  const { toast } = useToast();

  // Only show for super admins
  if (!hasRole('super_admin')) {
    return null;
  }

  const cacheTypeOptions = [
    { value: 'config' as CacheType, label: 'Configurações', description: 'Cache de configurações do sistema e AI' },
    { value: 'mood' as CacheType, label: 'Dados Emocionais', description: 'Cache do diário emocional e análises' },
    { value: 'forms' as CacheType, label: 'Formulários', description: 'Rascunhos de formulários salvos' },
    { value: 'session' as CacheType, label: 'Sessão', description: 'Dados temporários de navegação' },
    { value: 'all' as CacheType, label: 'Limpar Tudo', description: 'Remove todos os dados em cache' },
  ];

  const handleClearCache = async () => {
    setIsClearing(true);
    
    try {
      const options: ClearCacheOptions = {
        preserveTheme,
        preserveAuth,
        preserveLanguage: true
      };

      let result;
      if (selectedTypes.includes('all')) {
        result = clearAllCache(options);
      } else {
        result = clearSpecificCache(selectedTypes, options);
      }

      if (result.success) {
        toast({
          title: "Cache limpo com sucesso!",
          description: `${result.itemsCleared} itens foram removidos do cache.`,
          variant: "default"
        });
        
        // Recarregar a página após um delay para mostrar o toast
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error('Falha ao limpar cache');
      }
    } catch (error) {
      toast({
        title: "Erro ao limpar cache",
        description: "Ocorreu um erro durante a limpeza do cache. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsClearing(false);
      setIsOpen(false);
    }
  };

  const toggleCacheType = (type: CacheType) => {
    if (type === 'all') {
      setSelectedTypes(['all']);
      return;
    }

    setSelectedTypes(prev => {
      const filtered = prev.filter(t => t !== 'all');
      if (filtered.includes(type)) {
        return filtered.filter(t => t !== type);
      } else {
        return [...filtered, type];
      }
    });
  };

  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <Button
          variant="ghost"
          size={size}
          className={className}
          title="Limpar Cache"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      );
    }

    if (variant === 'minimal') {
      return (
        <Button
          variant="ghost"
          size={size}
          className={`text-muted-foreground hover:text-foreground ${className}`}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Cache
        </Button>
      );
    }

    return (
      <Button
        variant="outline"
        size={size}
        className={`border-destructive/20 text-destructive hover:bg-destructive/10 ${className}`}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Limpar Cache
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div data-cache-trigger onClick={() => setIsOpen(true)}>
          {renderButton()}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Limpar Cache do Sistema
          </DialogTitle>
          <DialogDescription>
            Selecione quais tipos de cache deseja limpar. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opções de tipos de cache */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Tipos de Cache:</h4>
            {cacheTypeOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <Checkbox
                  id={option.value}
                  checked={selectedTypes.includes(option.value)}
                  onCheckedChange={() => toggleCacheType(option.value)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={option.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Opções de preservação */}
          {!selectedTypes.includes('all') && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-sm font-medium">Preservar:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserve-theme"
                    checked={preserveTheme}
                    onCheckedChange={(checked) => setPreserveTheme(checked === true)}
                  />
                  <label htmlFor="preserve-theme" className="text-sm cursor-pointer">
                    Tema (claro/escuro)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserve-auth"
                    checked={preserveAuth}
                    onCheckedChange={(checked) => setPreserveAuth(checked === true)}
                  />
                  <label htmlFor="preserve-auth" className="text-sm cursor-pointer">
                    Sessão de login
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearCache}
            disabled={isClearing || selectedTypes.length === 0}
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Limpeza
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};