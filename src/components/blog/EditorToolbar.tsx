import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Minus,
  MoveVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditorToolbarProps {
  editor: Editor;
}

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleSetLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkDialogOpen(false);
    setLinkUrl('');
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setImageDialogOpen(false);
    setImageUrl('');
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    icon: Icon, 
    label 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: any; 
    label: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0"
      title={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const getActiveHeadingLevel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'Título';
  };

  return (
    <>
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1 items-center">
        {/* Text Formatting */}
        <ToolbarButton
          icon={Bold}
          label="Negrito (Ctrl+B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        />
        <ToolbarButton
          icon={Italic}
          label="Itálico (Ctrl+I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        />
        <ToolbarButton
          icon={UnderlineIcon}
          label="Sublinhado (Ctrl+U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Tachado"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
        />
        <ToolbarButton
          icon={Code}
          label="Código"
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
        />

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Headings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2">
              <Heading1 className="h-4 w-4 mr-1" />
              {getActiveHeadingLevel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}>
              <Heading1 className="h-4 w-4 mr-2" /> Título 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}>
              <Heading2 className="h-4 w-4 mr-2" /> Título 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}>
              <Heading3 className="h-4 w-4 mr-2" /> Título 3
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>
              Parágrafo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Lists */}
        <ToolbarButton
          icon={List}
          label="Lista"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Lista Numerada"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        />

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          icon={AlignLeft}
          label="Alinhar à Esquerda"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
        />
        <ToolbarButton
          icon={AlignCenter}
          label="Centralizar"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
        />
        <ToolbarButton
          icon={AlignRight}
          label="Alinhar à Direita"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
        />

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Media */}
        <ToolbarButton
          icon={Link}
          label="Inserir Link (Ctrl+K)"
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href;
            setLinkUrl(previousUrl || '');
            setLinkDialogOpen(true);
          }}
          isActive={editor.isActive('link')}
        />
        <ToolbarButton
          icon={Image}
          label="Inserir Imagem"
          onClick={() => setImageDialogOpen(true)}
        />

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* Special Blocks */}
        <ToolbarButton
          icon={Quote}
          label="Citação"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
        />
        <ToolbarButton
          icon={Minus}
          label="Linha Horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <ToolbarButton
          icon={Table}
          label="Inserir Tabela"
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Adicionar Espaço Extra">
              <MoveVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setSpacer('5px').run()}>
              Pequeno (5px)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setSpacer('10px').run()}>
              Médio (10px)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setSpacer('15px').run()}>
              Grande (15px)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-8 mx-1" />

        {/* History */}
        <ToolbarButton
          icon={Undo}
          label="Desfazer (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          icon={Redo}
          label="Refazer (Ctrl+Shift+Z)"
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
            <DialogDescription>
              Adicione a URL que deseja vincular ao texto selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://exemplo.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSetLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            {editor.isActive('link') && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setLinkDialogOpen(false);
                }}
              >
                Remover Link
              </Button>
            )}
            <Button type="button" onClick={handleSetLink}>
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
            <DialogDescription>
              Adicione a URL da imagem que deseja inserir.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="image-url">URL da Imagem</Label>
              <Input
                id="image-url"
                placeholder="https://exemplo.com/imagem.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInsertImage();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleInsertImage}>
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
