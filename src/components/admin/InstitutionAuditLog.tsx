import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, Filter, Search, Calendar, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useInstitutionAudit, getActionLabel, getEntityLabel, getActionIcon, AuditLogEntry } from '@/hooks/useInstitutionAudit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface InstitutionAuditLogProps {
  institutionId: string;
  institutionName: string;
}

export const InstitutionAuditLog = ({ institutionId, institutionName }: InstitutionAuditLogProps) => {
  const { auditLogs, isLoading, exportToCSV, fetchFilteredLogs } = useInstitutionAudit(institutionId);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const filteredLogs = auditLogs.filter(log => {
    // Filtro de busca por texto
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      getActionLabel(log.action_type).toLowerCase().includes(searchLower) ||
      getEntityLabel(log.entity_type).toLowerCase().includes(searchLower) ||
      log.performer?.nome?.toLowerCase().includes(searchLower) ||
      log.performer?.email?.toLowerCase().includes(searchLower);

    // Filtro por tipo de ação
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;

    // Filtro por tipo de entidade
    const matchesEntity = entityFilter === 'all' || log.entity_type === entityFilter;

    // Filtro por data
    const logDate = new Date(log.created_at);
    const matchesStartDate = !startDate || logDate >= new Date(startDate);
    const matchesEndDate = !endDate || logDate <= new Date(endDate);

    return matchesSearch && matchesAction && matchesEntity && matchesStartDate && matchesEndDate;
  });

  const handleExport = () => {
    exportToCSV(filteredLogs);
  };

  const renderChangesSummary = (log: AuditLogEntry) => {
    if (!log.changes_summary || log.changes_summary.length === 0) {
      return <p className="text-sm text-muted-foreground italic">Sem detalhes de alterações</p>;
    }

    return (
      <div className="space-y-2">
        {log.changes_summary.map((change, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <Badge variant="outline" className="shrink-0">
              {change.field}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground line-through">
                  {String(change.old_value || '-')}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">
                  {String(change.new_value || '-')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Auditoria
            </CardTitle>
            <CardDescription>
              Registro de todas as ações realizadas em {institutionName}
            </CardDescription>
          </div>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-xs">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-filter" className="text-xs">Tipo de Ação</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger id="action-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Atualização</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
                <SelectItem value="link_user">Vincular Usuário</SelectItem>
                <SelectItem value="unlink_user">Desvincular Usuário</SelectItem>
                <SelectItem value="add_professional">Adicionar Profissional</SelectItem>
                <SelectItem value="remove_professional">Remover Profissional</SelectItem>
                <SelectItem value="create_coupon">Criar Cupom</SelectItem>
                <SelectItem value="update_coupon">Atualizar Cupom</SelectItem>
                <SelectItem value="delete_coupon">Excluir Cupom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-filter" className="text-xs">Tipo de Entidade</Label>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger id="entity-filter" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="institution">Instituição</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="coupon">Cupom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-range" className="text-xs">Período</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Resultado dos filtros */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'} encontrado{filteredLogs.length !== 1 ? 's' : ''}
          </span>
          {(searchTerm || actionFilter !== 'all' || entityFilter !== 'all' || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setActionFilter('all');
                setEntityFilter('all');
                setStartDate('');
                setEndDate('');
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Lista de logs */}
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div key={log.id}>
                  <Collapsible>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 text-2xl mt-1">
                            {getActionIcon(log.action_type)}
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary">
                                    {getActionLabel(log.action_type)}
                                  </Badge>
                                  <Badge variant="outline">
                                    {getEntityLabel(log.entity_type)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  {log.performer?.nome || log.performer?.email || 'Usuário desconhecido'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </div>
                                </div>
                                {log.changes_summary && log.changes_summary.length > 0 && (
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleExpanded(log.id)}
                                    >
                                      {expandedLogs.has(log.id) ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                )}
                              </div>
                            </div>

                            <CollapsibleContent>
                              <div className="pt-2 mt-2 border-t">
                                {renderChangesSummary(log)}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                      Metadados:
                                    </p>
                                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Collapsible>
                  {index < filteredLogs.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
