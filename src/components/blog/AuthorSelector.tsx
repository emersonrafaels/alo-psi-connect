import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthorUsers } from '@/hooks/useAuthorUsers';
import { User, ExternalLink } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthorSelectorProps {
  type: 'original' | 'user' | 'custom';
  onTypeChange: (type: 'original' | 'user' | 'custom') => void;
  displayAuthorId: string | null;
  onDisplayAuthorIdChange: (id: string | null) => void;
  customName: string;
  onCustomNameChange: (name: string) => void;
  customUrl: string;
  onCustomUrlChange: (url: string) => void;
  originalAuthorName: string;
}

export const AuthorSelector = ({
  type,
  onTypeChange,
  displayAuthorId,
  onDisplayAuthorIdChange,
  customName,
  onCustomNameChange,
  customUrl,
  onCustomUrlChange,
  originalAuthorName,
}: AuthorSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const { data: users = [], isLoading } = useAuthorUsers(searchTerm);

  const selectedUser = users.find(u => u.user_id === displayAuthorId);

  return (
    <div className="space-y-4">
      <RadioGroup value={type} onValueChange={(v) => onTypeChange(v as typeof type)}>
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="original" id="original" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="original" className="font-medium cursor-pointer">
              Autor Original
            </Label>
            <p className="text-sm text-muted-foreground">
              {originalAuthorName || 'Quem criou o post'}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <RadioGroupItem value="user" id="user" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="user" className="font-medium cursor-pointer">
              Selecionar Usuário
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Escolha outro autor do sistema
            </p>
            {type === 'user' && (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedUser ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedUser.foto_perfil_url || ''} />
                          <AvatarFallback>
                            {selectedUser.nome.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedUser.nome}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Selecione um usuário...</span>
                    )}
                    <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar usuário..." 
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {isLoading ? 'Carregando...' : 'Nenhum usuário encontrado.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.user_id}
                            value={user.user_id}
                            onSelect={() => {
                              onDisplayAuthorIdChange(user.user_id);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                displayAuthorId === user.user_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={user.foto_perfil_url || ''} />
                              <AvatarFallback>
                                {user.nome.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.nome}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <RadioGroupItem value="custom" id="custom" className="mt-1" />
          <div className="flex-1">
            <Label htmlFor="custom" className="font-medium cursor-pointer">
              Nome Personalizado
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Digite manualmente o nome do autor
            </p>
            {type === 'custom' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="customName" className="text-sm">Nome do Autor</Label>
                  <Input
                    id="customName"
                    value={customName}
                    onChange={(e) => onCustomNameChange(e.target.value)}
                    placeholder="Ex: Dr. João Silva"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customUrl" className="text-sm flex items-center gap-1">
                    Link do Autor <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="customUrl"
                      type="url"
                      value={customUrl}
                      onChange={(e) => onCustomUrlChange(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="pr-8"
                    />
                    {customUrl && (
                      <ExternalLink className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
