import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrregResult {
  name: string;
  address: string;
  org_form: string;
  industry_code: string;
  org_number: string;
}

function parseBrregEnhet(data: any): BrregResult {
  const forretningsadresse = data.forretningsadresse || {};
  const adresseLinjer = forretningsadresse.adresse || [];
  const fullAddress = [
    ...adresseLinjer,
    [forretningsadresse.postnummer, forretningsadresse.poststed].filter(Boolean).join(' '),
  ].filter(Boolean).join(', ');

  return {
    name: data.navn || '',
    address: fullAddress,
    org_form: data.organisasjonsform?.beskrivelse || '',
    industry_code: data.naeringskode1?.beskrivelse || '',
    org_number: data.organisasjonsnummer || '',
  };
}

export function useBrregLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrregResult | null>(null);
  const [results, setResults] = useState<BrregResult[]>([]);

  const lookup = useCallback(async (orgNumber: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setResults([]);

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

  const searchByName = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setResults([]);

    try {
      const response = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(query)}&size=10`,
        { headers: { Accept: 'application/json' } }
      );

      if (!response.ok) {
        setError('Kunne ikke søke i Brønnøysundregistrene. Prøv igjen.');
        return [];
      }

      const data = await response.json();
      const enheter = data._embedded?.enheter || [];
      const parsed = enheter.map(parseBrregEnhet);
      setResults(parsed);
      return parsed;
    } catch {
      setError('Nettverksfeil. Sjekk tilkoblingen og prøv igjen.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setResults([]);
    setError(null);
  }, []);

  return { lookup, searchByName, isLoading, error, result, results, reset };
}
