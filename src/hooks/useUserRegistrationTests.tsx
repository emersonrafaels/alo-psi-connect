import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestResult {
  test_id: string;
  test_type: string;
  tenant: string;
  status: 'success' | 'failed' | 'running';
  duration_ms: number;
  created_entities?: {
    user_id?: string;
    profile_id?: string;
    professional_id?: number;
    patient_id?: string;
    tenant_association_id?: string;
  };
  validations: Array<{
    check: string;
    passed: boolean;
    details?: string;
  }>;
  errors: string[];
}

export const useUserRegistrationTests = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (type: 'professional' | 'patient', tenant: 'alopsi' | 'medcos') => {
    setIsRunning(true);
    
    // Add running status
    const runningResult: TestResult = {
      test_id: `${type}-${tenant}-running`,
      test_type: type === 'professional' ? 'professional_registration' : 'patient_registration',
      tenant,
      status: 'running',
      duration_ms: 0,
      validations: [],
      errors: []
    };
    
    setTestResults(prev => {
      const filtered = prev.filter(r => !(r.test_type === runningResult.test_type && r.tenant === tenant));
      return [...filtered, runningResult];
    });

    try {
      const action = type === 'professional' ? 'test_professional' : 'test_patient';
      
      const { data, error } = await supabase.functions.invoke('test-user-registration', {
        body: { action, tenant }
      });

      if (error) throw error;

      const result = data as TestResult;
      
      setTestResults(prev => {
        const filtered = prev.filter(r => !(r.test_type === result.test_type && r.tenant === result.tenant));
        return [...filtered, result];
      });

      if (result.status === 'success') {
        toast.success(`✓ Teste ${type} ${tenant} passou com sucesso!`);
      } else {
        toast.error(`✗ Teste ${type} ${tenant} falhou`);
      }
    } catch (error: any) {
      console.error('Test error:', error);
      toast.error(`Erro ao executar teste: ${error.message}`);
      
      // Update with failed status
      setTestResults(prev => {
        const filtered = prev.filter(r => !(r.test_type === runningResult.test_type && r.tenant === tenant));
        return [...filtered, {
          ...runningResult,
          status: 'failed',
          errors: [error.message]
        }];
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const tests = [
      { type: 'professional' as const, tenant: 'alopsi' as const },
      { type: 'patient' as const, tenant: 'alopsi' as const },
      { type: 'professional' as const, tenant: 'medcos' as const },
      { type: 'patient' as const, tenant: 'medcos' as const }
    ];

    for (const test of tests) {
      await runTest(test.type, test.tenant);
    }

    setIsRunning(false);
  };

  const cleanupTests = async () => {
    const userIds = testResults
      .filter(r => r.created_entities?.user_id)
      .map(r => r.created_entities!.user_id!);

    if (userIds.length === 0) {
      toast.info('Nenhum dado de teste para limpar');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('test-user-registration', {
        body: { action: 'cleanup', cleanup_user_ids: userIds }
      });

      if (error) throw error;

      toast.success(`✓ ${data.success.length} usuários de teste removidos`);
      
      if (data.failed.length > 0) {
        toast.warning(`${data.failed.length} usuários falharam ao ser removidos`);
      }

      // Clear test results
      setTestResults([]);
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(`Erro ao limpar dados: ${error.message}`);
    }
  };

  const cleanupAllTestUsers = async () => {
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-user-registration', {
        body: { action: 'cleanup', cleanup_all: true }
      });

      if (error) throw error;

      toast.success(`✓ ${data.success.length} de ${data.total} usuários de teste removidos`);
      
      if (data.failed.length > 0) {
        toast.warning(`${data.failed.length} usuários falharam ao ser removidos`);
      }

      // Clear test results
      setTestResults([]);
    } catch (error: any) {
      console.error('Cleanup all error:', error);
      toast.error(`Erro ao limpar todos os dados: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const overallStats = {
    total: testResults.filter(r => r.status !== 'running').length,
    success: testResults.filter(r => r.status === 'success').length,
    failed: testResults.filter(r => r.status === 'failed').length
  };

  return {
    runTest,
    runAllTests,
    cleanupTests,
    cleanupAllTestUsers,
    testResults,
    isRunning,
    overallStats
  };
};
