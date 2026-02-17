import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type DemoDataAction = 
  | "create_institution"
  | "seed_all" 
  | "seed_professionals" 
  | "seed_students" 
  | "seed_coupons" 
  | "seed_mood_entries" 
  | "seed_appointments" 
  | "cleanup";

export interface DemoDataParams {
  action: DemoDataAction;
  institutionId?: string;
  institutionName?: string;
  institutionType?: "public" | "private";
  professionalsCount?: number;
  studentsCount?: number;
  moodEntriesPerStudent?: number;
  tenantId?: string;
  dataPatterns?: string[];
}

export interface DemoDataResult {
  action: DemoDataAction;
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
  institutionId?: string;
  institutionName?: string;
}

export const useDemoData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<DemoDataAction | null>(null);
  const [results, setResults] = useState<DemoDataResult[]>([]);

  const addResult = useCallback((result: Omit<DemoDataResult, "timestamp">) => {
    setResults(prev => [...prev, { ...result, timestamp: new Date().toISOString() }]);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const executeAction = useCallback(async (params: DemoDataParams) => {
    setIsLoading(true);
    setCurrentAction(params.action);

    try {
      console.log(`[DemoData] Executing action: ${params.action}`, params);

      const { data, error } = await supabase.functions.invoke("seed-demo-data", {
        body: {
          action: params.action,
          institution_id: params.institutionId,
          institution_name: params.institutionName,
          institution_type: params.institutionType,
          professionals_count: params.professionalsCount || 5,
          students_count: params.studentsCount || 10,
          mood_entries_per_student: params.moodEntriesPerStudent || 12,
          tenant_id: params.tenantId,
          data_patterns: params.dataPatterns,
        },
      });

      if (error) {
        console.error(`[DemoData] Error:`, error);
        addResult({
          action: params.action,
          success: false,
          message: error.message || "Erro desconhecido",
        });
        toast({
          title: "Erro",
          description: error.message || "Falha ao executar ação",
          variant: "destructive",
        });
        return null;
      }

      console.log(`[DemoData] Success:`, data);
      addResult({
        action: params.action,
        success: true,
        message: data?.message || "Ação executada com sucesso",
        details: data?.details,
        institutionId: data?.institution_id,
        institutionName: data?.institution_name,
      });

      toast({
        title: "Sucesso",
        description: data?.message || "Ação executada com sucesso",
      });

      return data;
    } catch (err: any) {
      console.error(`[DemoData] Exception:`, err);
      addResult({
        action: params.action,
        success: false,
        message: err.message || "Erro inesperado",
      });
      toast({
        title: "Erro",
        description: err.message || "Erro inesperado",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  }, [addResult]);

  return {
    executeAction,
    isLoading,
    currentAction,
    results,
    clearResults,
  };
};
