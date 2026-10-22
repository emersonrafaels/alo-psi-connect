import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AcademicLevel, AcademicUnit, LEVEL_LABELS, buildPath, childrenOf } from '@/features/academic/hierarchy';
import { useAcademicStructure } from '@/hooks/useAcademicStructure';
import { useStructureStats } from '@/features/academic/structure/useStructureStats';
import { StructureKpis } from '@/features/academic/structure/StructureKpis';
import { ModelPicker } from '@/features/academic/structure/ModelPicker';
import { StructureTree } from '@/features/academic/structure/StructureTree';
import { UnitDetailPanel } from '@/features/academic/structure/UnitDetailPanel';
import { UnitFormDialog, UnitFormState } from '@/features/academic/structure/UnitFormDialog';
import { studentsLabel } from '@/features/academic/structure/levelMeta';

type UnitInput = { id?: string; level: AcademicLevel; name: string; parent_id: string | null };

export const AcademicStructureManager = ({ institutionId, totalStudents = 0 }: { institutionId?: string; totalStudents?: number }) => {
  const { levels, units, placements, setLevels, saveUnit, deleteUnit } = useAcademicStructure(institutionId);
  const { byId, studentCount, descendantCount, placedTotal } = useStructureStats(units, placements);
  // The tree starts fully collapsed; `open` only grows from the user's expands and new-item reveals.
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<UnitFormState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AcademicUnit | null>(null);
  // The insert doesn't return the row, so after a create the new unit is found in the refetched list.
  const pendingSelect = useRef<(UnitInput & { known: Set<string> }) | null>(null);

  const roots = childrenOf(levels[0], null, units, levels);
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedUnit = selected && levels.includes(selected.level) ? selected : roots[0] ?? null;

  useEffect(() => {
    const p = pendingSelect.current;
    if (!p) return;
    const created = units.find((u) => !p.known.has(u.id) && u.level === p.level && u.name === p.name && u.parent_id === p.parent_id);
    if (!created) return;
    pendingSelect.current = null;
    setSelectedId(created.id);
    setOpen((prev) => new Set([...prev, ...buildPath(created.id, units, levels).slice(0, -1).map((u) => u.id)]));
  }, [units, levels]);

  const toggle = (id: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const startCreate = () => {
    if (!selectedUnit) return setForm({ mode: 'create', level: levels[0], parentId: null });
    const next = levels[levels.indexOf(selectedUnit.level) + 1];
    // From a leaf, "Novo cadastro" adds a sibling; otherwise a child of the selection.
    setForm(next ? { mode: 'create', level: next, parentId: selectedUnit.id } : { mode: 'create', level: selectedUnit.level, parentId: selectedUnit.parent_id });
  };

  const submitForm = (value: UnitInput) => {
    const renaming = !!value.id;
    const feminine = value.level === 'unit' || value.level === 'class';
    saveUnit.mutate(value, {
      onSuccess: () => {
        toast.success(renaming ? 'Nome salvo' : `${LEVEL_LABELS[value.level]} ${feminine ? 'cadastrada' : 'cadastrado'}`);
        if (!renaming) pendingSelect.current = { ...value, known: new Set(units.map((u) => u.id)) };
        setForm(null);
      },
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const parent = pendingDelete.parent_id ? byId.get(pendingDelete.parent_id) : undefined;
    deleteUnit.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Item removido da estrutura');
        setSelectedId(parent && levels.includes(parent.level) ? parent.id : null);
      },
    });
    setPendingDelete(null);
  };

  // One row per class with aggregate counts only; no student identities leave the page.
  const exportStructure = (kind: 'csv' | 'xlsx') => {
    const header = [...levels.map((l) => LEVEL_LABELS[l]), 'Alunos vinculados'];
    const rows = units
      .filter((u) => u.level === 'class')
      .map((c) => {
        const path = buildPath(c.id, units, levels);
        return [...levels.map((l) => path.find((p) => p.level === l)?.name ?? ''), studentCount.get(c.id) ?? 0];
      })
      .sort((a, b) => a.slice(0, -1).join('|').localeCompare(b.slice(0, -1).join('|'), 'pt-BR'));
    const fileName = `estrutura_academica_${format(new Date(), 'yyyy-MM-dd')}`;

    if (kind === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
      ws['!cols'] = header.map((h, i) => ({ wch: Math.max(h.length, ...rows.map((r) => String(r[i]).length)) + 2 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estrutura');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      return;
    }
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const pendingDescendants = pendingDelete ? descendantCount.get(pendingDelete.id) ?? 0 : 0;
  const pendingStudents = pendingDelete ? studentCount.get(pendingDelete.id) ?? 0 : 0;

  return (
    <div className="space-y-5">
      <StructureKpis levels={levels} units={units} totalStudents={totalStudents} placedTotal={placedTotal} />
      <ModelPicker levels={levels} onChange={(l) => setLevels.mutate(l)} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <StructureTree
          levels={levels} units={units} studentCount={studentCount}
          selectedId={selectedUnit?.id ?? null} onSelect={setSelectedId}
          open={open} onToggle={toggle} onSetOpen={setOpen}
          onNew={startCreate}
          onAddTop={() => setForm({ mode: 'create', level: levels[0], parentId: null })}
          onExport={exportStructure}
        />
        <UnitDetailPanel
          unit={selectedUnit} levels={levels} units={units} studentCount={studentCount}
          onAddChild={(level, parentId) => setForm({ mode: 'create', level, parentId })}
          onRename={(unit) => setForm({ mode: 'rename', unit })}
          onDelete={setPendingDelete}
        />
      </div>

      <UnitFormDialog state={form} levels={levels} units={units} onClose={() => setForm(null)} onSubmit={submitForm} />

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {pendingDelete && LEVEL_LABELS[pendingDelete.level].toLowerCase()} "{pendingDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDescendants === 0 && 'Não há itens abaixo deste.'}
              {pendingDescendants === 1 && 'O item abaixo deste também será removido.'}
              {pendingDescendants > 1 && `Os ${pendingDescendants} itens abaixo deste também serão removidos.`}
              {pendingStudents > 0 && ` ${studentsLabel(pendingStudents)} ${pendingStudents === 1 ? 'ficará sem turma e precisará' : 'ficarão sem turma e precisarão'} de novo vínculo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
