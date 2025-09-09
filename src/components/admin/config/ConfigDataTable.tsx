import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { SystemConfig } from '@/hooks/useSystemConfig';

interface ConfigDataTableProps {
  title: string;
  description: string;
  data: SystemConfig[];
  onEdit?: (config: SystemConfig) => void;
}

type SortField = 'category' | 'key' | 'updated_at';
type SortDirection = 'asc' | 'desc';

export const ConfigDataTable = ({ title, description, data, onEdit }: ConfigDataTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter(config => 
      config.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (config.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    filtered.sort((a, b) => {
      let aValue: string | Date = '';
      let bValue: string | Date = '';

      switch (sortField) {
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'key':
          aValue = a.key;
          bValue = b.key;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Categoria', 'Chave', 'Valor', 'Descrição', 'Última Atualização'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedData.map(config => [
        config.category,
        config.key,
        JSON.stringify(config.value).replace(/,/g, ';'),
        config.description || '',
        new Date(config.updated_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuracoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar configurações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Categoria
                    <SortIcon field="category" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('key')}
                >
                  <div className="flex items-center gap-1">
                    Chave
                    <SortIcon field="key" />
                  </div>
                </TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center gap-1">
                    Última Atualização
                    <SortIcon field="updated_at" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((config) => (
                <TableRow 
                  key={config.id}
                  className={onEdit ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onEdit?.(config)}
                >
                  <TableCell>
                    <Badge variant="outline">{config.category}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{config.key}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={JSON.stringify(config.value)}>
                      {typeof config.value === 'object' 
                        ? JSON.stringify(config.value).substring(0, 50) + '...'
                        : String(config.value).substring(0, 50)
                      }
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {config.description || 'Sem descrição'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(config.updated_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Nenhuma configuração encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};