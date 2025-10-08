import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBlogTags } from '@/hooks/useBlogTags';

interface TagSelectorProps {
  selectedTags: Array<{ id: string; name: string; slug: string }>;
  onChange: (tags: Array<{ id: string; name: string; slug: string }>) => void;
}

export const TagSelector = ({ selectedTags, onChange }: TagSelectorProps) => {
  const { data: allTags = [], createTag } = useBlogTags();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleSelectTag = (tag: { id: string; name: string; slug: string }) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      onChange([...selectedTags, tag]);
    }
    setOpen(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter(t => t.id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const slug = newTagName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    try {
      const newTag = await createTag.mutateAsync({ name: newTagName.trim(), slug });
      handleSelectTag(newTag);
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const availableTags = allTags.filter(
    tag => !selectedTags.find(t => t.id === tag.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Buscar tag..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 space-y-2">
                  <p className="text-sm text-muted-foreground">Nenhuma tag encontrada.</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da nova tag"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateTag();
                        }
                      }}
                    />
                    <Button type="button" size="sm" onClick={handleCreateTag} disabled={createTag.isPending}>
                      Criar
                    </Button>
                  </div>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {availableTags.map(tag => (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => handleSelectTag(tag)}
                  >
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
