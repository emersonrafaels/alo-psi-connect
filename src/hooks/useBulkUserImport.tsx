import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { useBulkUserValidation, ParsedUser, ParsedUserWithValidation } from './useBulkUserValidation';

export type { ParsedUser, ParsedUserWithValidation };

export const useBulkUserImport = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { validateUsers } = useBulkUserValidation();

  const parseExcel = (file: File): Promise<ParsedUser[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          const users: ParsedUser[] = json.map((row: any) => ({
            nome: row['Nome'] || row['nome'],
            email: row['Email'] || row['email'],
            cpf: row['CPF'] || row['cpf'],
            data_nascimento: row['Data de Nascimento'] || row['data_nascimento'],
            genero: row['Gênero'] || row['genero'],
            telefone: row['Telefone'] || row['telefone'],
            tipo_usuario: (row['Tipo'] || row['tipo_usuario'] || 'paciente').toLowerCase(),
            senha: row['Senha'] || row['senha'],
            instituicao: row['Instituição'] || row['instituicao'],
            crp_crm: row['CRP/CRM'] || row['crp_crm'],
            profissao: row['Profissão'] || row['profissao'],
            preco_consulta: row['Preço Consulta'] || row['preco_consulta']
          }));

          resolve(users);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Método separado para parse e validação (sem importar)
  const parseAndValidate = async (file: File): Promise<ParsedUserWithValidation[]> => {
    try {
      toast({
        title: 'Processando arquivo...',
        description: 'Lendo planilha Excel',
      });

      const users = await parseExcel(file);

      if (users.length === 0) {
        throw new Error('Nenhum usuário encontrado na planilha');
      }

      // Validar todos os usuários
      const usersWithValidation = validateUsers(users);

      toast({
        title: `${users.length} usuários processados`,
        description: 'Revise os dados antes de confirmar a importação',
      });

      return usersWithValidation;
    } catch (error: any) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Método para importar apenas usuários válidos
  const importUsers = async (users: ParsedUser[], tenantSlug: string) => {
    setLoading(true);
    setProgress(0);

    try {
      toast({
        title: 'Importando usuários...',
        description: `Processando ${users.length} usuários`,
      });

      const { data, error } = await supabase.functions.invoke('bulk-import-users', {
        body: { users, tenantSlug }
      });

      if (error) throw error;

      setProgress(100);

      const { successCount, errorCount, results } = data;

      toast({
        title: 'Importação concluída!',
        description: `✅ ${successCount} usuários criados | ❌ ${errorCount} erros`,
      });

      return { success: true, data: results };

    } catch (error: any) {
      console.error('Error importing users:', error);
      toast({
        title: 'Erro na importação',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Nome': 'João Silva',
        'Email': 'joao@example.com',
        'CPF': '123.456.789-00',
        'Data de Nascimento': '1990-01-15',
        'Gênero': 'Masculino',
        'Telefone': '11999999999',
        'Tipo': 'paciente',
        'Senha': 'Senha@123',
        'Instituição': 'UNIFESP',
        'CRP/CRM': '',
        'Profissão': '',
        'Preço Consulta': ''
      },
      {
        'Nome': 'Maria Santos',
        'Email': 'maria@example.com',
        'CPF': '987.654.321-00',
        'Data de Nascimento': '1985-05-20',
        'Gênero': 'Feminino',
        'Telefone': '11988888888',
        'Tipo': 'profissional',
        'Senha': 'Senha@456',
        'Instituição': 'USP',
        'CRP/CRM': 'CRP 12345',
        'Profissão': 'Psicólogo(a)',
        'Preço Consulta': '150'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuários');
    XLSX.writeFile(wb, 'template_importacao_usuarios.xlsx');

    toast({
      title: 'Template baixado!',
      description: 'Use este arquivo como modelo para importação',
    });
  };

  return {
    loading,
    progress,
    parseAndValidate,
    importUsers,
    downloadTemplate
  };
};
