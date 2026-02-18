import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnonymizationResult {
  isAnonymized: boolean;
  loading: boolean;
}

/**
 * Resolves the effective anonymization config for an institution.
 * Priority: institution override > global default > true (safe default)
 */
export function useAnonymizationConfig(institutionId: string | null): AnonymizationResult {
  const [isAnonymized, setIsAnonymized] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        // Fetch both in parallel
        const [instResult, globalResult] = await Promise.all([
          supabase
            .from('educational_institutions')
            .select('anonymize_students')
            .eq('id', institutionId)
            .single(),
          supabase
            .from('system_configurations')
            .select('value')
            .eq('category', 'institution')
            .eq('key', 'default_anonymize_students')
            .is('tenant_id', null)
            .maybeSingle(),
        ]);

        const instValue = instResult.data?.anonymize_students;

        // Priority 1: institution-specific override
        if (instValue !== null && instValue !== undefined) {
          setIsAnonymized(instValue);
        } else {
          // Priority 2: global default
          if (globalResult.data?.value != null) {
            const val = globalResult.data.value;
            const parsed = typeof val === 'string' ? val === 'true' : Boolean(val);
            setIsAnonymized(parsed);
          } else {
            // Priority 3: safe default
            setIsAnonymized(true);
          }
        }
      } catch (err) {
        console.error('Error fetching anonymization config:', err);
        setIsAnonymized(true); // safe default on error
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [institutionId]);

  return { isAnonymized, loading };
}

/**
 * Anonymizes a student name based on index.
 * Returns "Aluno #X" format for consistency.
 */
export function anonymizeStudentName(index: number): string {
  return `Aluno #${index + 1}`;
}

/**
 * Returns anonymized initials for avatar display.
 */
export function anonymizeInitials(index: number): string {
  return `A${index + 1}`;
}
