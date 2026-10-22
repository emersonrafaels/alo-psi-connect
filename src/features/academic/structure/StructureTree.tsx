import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight, Download, FileSpreadsheet, FileText, Plus, Search } from 'lucide-react';
import { AcademicLevel, AcademicUnit, LEVEL_LABELS, childrenOf } from '@/features/academic/hierarchy';
import { cn } from '@/lib/utils';
import { DEPTH_RAIL, LEVEL_PLURALS, allOf, countOf, joinList, studentsLabel } from './levelMeta';
import { LevelGlyph } from './LevelGlyph';

interface TreeNode { unit: AcademicUnit; depth: number; children: TreeNode[]; forceOpen: boolean }

interface Props {
  levels: AcademicLevel[];
  units: AcademicUnit[];
  studentCount: Map<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  open: Set<string>;
  onToggle: (id: string) => void;
  onSetOpen: (ids: Set<string>) => void;
  onNew: () => void;
  onAddTop: () => void;
  onExport: (kind: 'csv' | 'xlsx') => void;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');

export const StructureTree = ({ levels, units, studentCount, selectedId, onSelect, open, onToggle, onSetOpen, onNew, onAddTop, onExport }: Props) => {
  const [query, setQuery] = useState('');
  const [rootFilter, setRootFilter] = useState('all');
  const [onlyWithStudents, setOnlyWithStudents] = useState(false);
  const q = normalize(query.trim());
  const filtering = !!q || rootFilter !== 'all' || onlyWithStudents;
  const roots = childrenOf(levels[0], null, units, levels);

  const tree = useMemo(() => {
    // A matching node keeps its whole subtree; ancestors of a match stay visible and are forced open.
    const build = (depth: number, parentId: string | null, inMatch: boolean): TreeNode[] => {
      const level = levels[depth];
      if (!level) return [];
      return childrenOf(level, parentId, units, levels).flatMap((u) => {
        if (depth === 0 && rootFilter !== 'all' && u.id !== rootFilter) return [];
        if (onlyWithStudents && !studentCount.get(u.id)) return [];
        const selfMatch = inMatch || !q || normalize(u.name).includes(q);
        const children = build(depth + 1, u.id, selfMatch);
        if (!selfMatch && children.length === 0) return [];
        return [{ unit: u, depth, children, forceOpen: !!q && !selfMatch }];
      });
    };
    return build(0, null, false);
  }, [levels, units, studentCount, q, rootFilter, onlyWithStudents]);

  const branchIds = useMemo(() => {
    const ids: string[] = [];
    const walk = (nodes: TreeNode[]) => nodes.forEach((n) => { if (n.children.length) { ids.push(n.unit.id); walk(n.children); } });
    walk(tree);
    return ids;
  }, [tree]);

  const clearFilters = () => { setQuery(''); setRootFilter('all'); setOnlyWithStudents(false); };
  const strip = levels.map((l) => countOf(units.filter((u) => u.level === l).length, l));

  const renderNodes = (nodes: TreeNode[], depth: number): JSX.Element => (
    <ul role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? 'Estrutura acadêmica' : undefined}
      className={cn('space-y-0.5', depth > 0 && cn('ml-[21px] border-l-2 pl-2 sm:pl-3', DEPTH_RAIL[depth - 1]))}>
      {nodes.map((n) => {
        const { unit: u } = n;
        const isLeaf = depth === levels.length - 1;
        const childLevel = levels[depth + 1];
        const childTotal = isLeaf ? 0 : childrenOf(childLevel, u.id, units, levels).length;
        const isOpen = n.forceOpen || open.has(u.id);
        const selected = selectedId === u.id;
        const count = studentCount.get(u.id) ?? 0;
        return (
          <li key={u.id} role="treeitem" aria-level={depth + 1} aria-selected={selected} aria-expanded={n.children.length ? isOpen : undefined}>
            <div
              tabIndex={0}
              onClick={() => onSelect(u.id)}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(u.id); }
                if (e.key === 'ArrowRight' && n.children.length && !isOpen) onToggle(u.id);
                if (e.key === 'ArrowLeft' && n.children.length && isOpen && !n.forceOpen) onToggle(u.id);
              }}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:bg-muted/60',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected && 'border-primary/20 bg-primary/5 hover:bg-primary/[0.07]',
              )}
            >
              {n.children.length ? (
                <Button
                  size="icon" variant="ghost" className="h-6 w-6 shrink-0" tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); if (!n.forceOpen) onToggle(u.id); }}
                  aria-label={isOpen ? `Recolher ${u.name}` : `Expandir ${u.name}`}
                >
                  <ChevronRight className={cn('h-4 w-4 motion-safe:transition-transform', isOpen && 'rotate-90')} />
                </Button>
              ) : <span className="w-6 shrink-0" />}
              <LevelGlyph level={u.level} depth={depth} />
              <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className={cn('truncate text-sm', depth === 0 ? 'font-semibold' : 'font-medium')}>{u.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {isLeaf ? LEVEL_LABELS[u.level] : countOf(childTotal, childLevel)}
                </span>
              </span>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums', count ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {studentsLabel(count)}
              </span>
            </div>
            {n.children.length > 0 && isOpen && <div className="mt-0.5">{renderNodes(n.children, depth + 1)}</div>}
          </li>
        );
      })}
    </ul>
  );

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6 sm:pb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Árvore da instituição</h2>
          <p className="text-sm text-muted-foreground">Selecione um item para ver detalhes, adicionar níveis abaixo ou renomear.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!units.length}>
                <Download className="mr-1.5 h-4 w-4" />Exportar<ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('xlsx')}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel (.xlsx)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('csv')}><FileText className="mr-2 h-4 w-4" />CSV (.csv)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={onNew}><Plus className="mr-1.5 h-4 w-4" />Novo cadastro</Button>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-3 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Buscar ${levels.map((l) => LEVEL_LABELS[l].toLowerCase()).join(', ')}`} className="pl-9" aria-label="Buscar na estrutura" />
          </div>
          {levels.length > 1 && (
            <Select value={rootFilter} onValueChange={setRootFilter}>
              <SelectTrigger className="sm:w-56" aria-label={`Filtrar por ${LEVEL_LABELS[levels[0]].toLowerCase()}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{allOf(levels[0])}</SelectItem>
                {roots.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch id="only-with-students" checked={onlyWithStudents} onCheckedChange={setOnlyWithStudents} />
            <Label htmlFor="only-with-students" className="text-sm font-normal text-muted-foreground">Só grupos com alunos</Label>
          </div>
          {branchIds.length > 0 && !q && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => onSetOpen(new Set([...open, ...branchIds]))}>Expandir tudo</Button>
              <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => onSetOpen(new Set())}>Recolher tudo</Button>
            </div>
          )}
        </div>
      </div>

      <p className="border-y bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
        <span className="font-semibold text-foreground">{strip[0]}</span>
        {strip.length > 1 && `${strip.length > 2 ? ', ' : ' e '}${joinList(strip.slice(1))}`}
      </p>

      <div className="max-h-[640px] min-h-[280px] overflow-y-auto p-2 sm:p-3">
        {units.filter((u) => levels.includes(u.level)).length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <LevelGlyph level={levels[0]} depth={0} className="h-11 w-11 rounded-xl" iconClassName="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Nada cadastrado ainda</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Comece pelo nível {LEVEL_LABELS[levels[0]]}
                {levels.length > 1 && <>; depois, adicione {joinList(levels.slice(1).map((l) => LEVEL_PLURALS[l]))} dentro de cada item</>}.
              </p>
            </div>
            <Button size="sm" onClick={onAddTop}><Plus className="mr-1.5 h-4 w-4" />Adicionar {LEVEL_LABELS[levels[0]].toLowerCase()}</Button>
          </div>
        ) : tree.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <Search className="h-6 w-6 text-muted-foreground" aria-hidden />
            <div>
              <h3 className="font-semibold">Nenhum item encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tente outro termo ou revise os filtros.</p>
            </div>
            {filtering && <Button variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>}
          </div>
        ) : renderNodes(tree, 0)}
      </div>
    </Card>
  );
};
