import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailType {
  value: string;
  label: string;
  description: string;
  requiredVariables: string[];
}

export const EMAIL_TYPES: EmailType[] = [
  {
    value: 'confirmation_patient',
    label: 'Confirmação de Cadastro - Paciente',
    description: 'Email enviado após cadastro de novo paciente',
    requiredVariables: ['recipientName', 'confirmationUrl']
  },
  {
    value: 'password_reset',
    label: 'Redefinição de Senha',
    description: 'Email para redefinir senha esquecida',
    requiredVariables: ['recipientName', 'resetUrl']
  },
  {
    value: 'appointment_notification',
    label: 'Notificação de Agendamento',
    description: 'Confirmação de agendamento de consulta',
    requiredVariables: ['recipientName', 'professionalName', 'appointmentDate', 'appointmentTime', 'appointmentPrice']
  },
  {
    value: 'newsletter_confirmation',
    label: 'Confirmação de Newsletter',
    description: 'Confirmação de inscrição na newsletter',
    requiredVariables: ['recipientName']
  },
  {
    value: 'institution_link_request',
    label: 'Solicitação de Vínculo Institucional',
    description: 'Notificação de pedido de vínculo com instituição',
    requiredVariables: ['recipientName', 'institutionName', 'portalUrl', 'requestMessage']
  }
];

interface TestEmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
  resend_email_id: string | null;
}

export const useEmailTester = () => {
  const [emailType, setEmailType] = useState<string>(EMAIL_TYPES[0].value);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [variables, setVariables] = useState<Record<string, any>>({});
  const [customHtml, setCustomHtml] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch test logs
  const { data: testLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['email-test-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_test_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as TestEmailLog[];
    }
  });

  // Get current email type config
  const currentEmailType = EMAIL_TYPES.find(t => t.value === emailType) || EMAIL_TYPES[0];

  // Initialize variables when email type changes
  useEffect(() => {
    const defaultVars: Record<string, any> = {};
    currentEmailType.requiredVariables.forEach(varName => {
      defaultVars[varName] = variables[varName] || '';
    });
    setVariables(defaultVars);
  }, [emailType]);

  // Generate preview HTML
  const previewHtml = () => {
    if (customHtml) return customHtml;

    // Simple variable replacement for preview
    let html = `
      <div style="font-family: sans-serif; background: #f8fafc; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px;">
          <div style="background: #0ea5e9; padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Preview - ${currentEmailType.label}</h1>
          </div>
          <div style="padding: 40px 20px;">
            <p>Destinatário: ${recipientEmail || '[email]'}</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
    `;

    Object.entries(variables).forEach(([key, value]) => {
      html += `<p style="margin: 5px 0;"><strong>${key}:</strong> ${value || `[${key}]`}</p>`;
    });

    html += `
            </div>
          </div>
        </div>
      </div>
    `;

    return html;
  };

  // Update a specific variable
  const updateVariable = (key: string, value: any) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  // Send test email mutation
  const sendTestEmailMutation = useMutation({
    mutationFn: async () => {
      if (!recipientEmail || !tenantId) {
        throw new Error('Email e tenant são obrigatórios');
      }

      // Validate required variables
      const missingVars = currentEmailType.requiredVariables.filter(
        varName => !variables[varName] || variables[varName].toString().trim() === ''
      );

      if (missingVars.length > 0) {
        throw new Error(`Variáveis obrigatórias faltando: ${missingVars.join(', ')}`);
      }

      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          emailType,
          recipientEmail,
          tenantId,
          variables,
          customHtml: customHtml || undefined
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Email de teste enviado com sucesso!', {
        description: `ID: ${data.emailId || 'N/A'}`
      });
      queryClient.invalidateQueries({ queryKey: ['email-test-logs'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar email de teste', {
        description: error.message
      });
    }
  });

  return {
    // State
    emailType,
    setEmailType,
    recipientEmail,
    setRecipientEmail,
    tenantId,
    setTenantId,
    variables,
    updateVariable,
    customHtml,
    setCustomHtml,
    
    // Computed
    currentEmailType,
    previewHtml: previewHtml(),
    
    // Actions
    sendTestEmail: sendTestEmailMutation.mutate,
    isSending: sendTestEmailMutation.isPending,
    
    // Logs
    testLogs: testLogs || [],
    loadingLogs
  };
};
