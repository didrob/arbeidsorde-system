import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrregResult {
  name: string;
  address: string;
  org_form: string;
  industry_code: string;
  org_number: string;
}

export function useBrregLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrregResult | null>(null);

  const lookup = useCallback(async (orgNumber: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('lookup-organization', {
        body: { org_number: orgNumber },
      });

      if (fnError) {
        setError('Kunne ikke slå opp organisasjonsnummer. Prøv igjen.');
        return null;
      }

      if (data?.error) {
        setError(data.error);
        return null;
      }

      setResult(data as BrregResult);
      return data as BrregResult;
    } catch {
      setError('Nettverksfeil. Sjekk tilkoblingen og prøv igjen.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { lookup, isLoading, error, result, reset };
}
