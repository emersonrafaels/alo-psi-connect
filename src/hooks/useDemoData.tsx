import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type DemoDataAction = 
  | "seed_all" 
  | "seed_professionals" 
  | "seed_students" 
  | "seed_coupons" 
  | "seed_mood_entries" 
  | "seed_appointments" 
  | "cleanup";

export interface DemoDataResult {
  action: DemoDataAction;
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
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

  const executeAction = useCallback(async (action: DemoDataAction) => {
    setIsLoading(true);
    setCurrentAction(action);

    try {
      console.log(`[DemoData] Executing action: ${action}`);

      const { data, error } = await supabase.functions.invoke("seed-unifoa-demo-data", {
        body: { action },
      });

      if (error) {
        console.error(`[DemoData] Error:`, error);
        addResult({
          action,
          success: false,
          message: error.message || "Erro desconhecido",
        });
        toast({
          title: "Erro",
          description: error.message || "Falha ao executar ação",
          variant: "destructive",
        });
        return;
      }

      console.log(`[DemoData] Success:`, data);
      addResult({
        action,
        success: true,
        message: data?.message || "Ação executada com sucesso",
        details: data?.details,
      });

      toast({
        title: "Sucesso",
        description: data?.message || "Ação executada com sucesso",
      });
    } catch (err: any) {
      console.error(`[DemoData] Exception:`, err);
      addResult({
        action,
        success: false,
        message: err.message || "Erro inesperado",
      });
      toast({
        title: "Erro",
        description: err.message || "Erro inesperado",
        variant: "destructive",
      });
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
