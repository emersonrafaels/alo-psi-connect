/** Quote a value for CSV and neutralise spreadsheet formulas (=, +, -, @, tab, CR) so exported cells are never executed. */
export function csvCell(v: unknown): string {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
