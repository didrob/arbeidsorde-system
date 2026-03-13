import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBrregLookup, type BrregResult } from './useBrregLookup';
import { cn } from '@/lib/utils';

interface BrregSearchInputProps {
  onSelect: (result: BrregResult) => void;
  onConfirm?: () => void;
  onReset?: () => void;
  label?: string;
  /** Apply glass styling for dark/transparent backgrounds */
  glass?: boolean;
  className?: string;
}

export function BrregSearchInput({
  onSelect,
  onConfirm,
  onReset,
  label = 'Søk i Brønnøysundregistrene',
  glass = false,
  className,
}: BrregSearchInputProps) {
  const [input, setInput] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [selectedResult, setSelectedResult] = useState<BrregResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { lookup, searchByName, isLoading, error, result, results, reset } = useBrregLookup();

  const inputClass = glass
    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/40'
    : '';
  const labelClass = glass ? 'text-white/80' : '';

  // Determine search type and trigger
  useEffect(() => {
    const trimmed = input.trim();
    const clean = trimmed.replace(/\s/g, '');

    // Pure digits, 9 chars → org number lookup
    if (/^\d{9}$/.test(clean)) {
      const timer = setTimeout(() => lookup(clean), 500);
      return () => clearTimeout(timer);
    }

    // Contains letters, min 3 chars → name search
    if (trimmed.length >= 3 && /[a-zA-ZæøåÆØÅ]/.test(trimmed)) {
      const timer = setTimeout(() => {
        searchByName(trimmed);
        setShowDropdown(true);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Clear results if input too short
    reset();
    setShowDropdown(false);
  }, [input, lookup, searchByName, reset]);

  // When single org number result comes back
  useEffect(() => {
    if (result && !confirmed) {
      setSelectedResult(result);
      setShowDropdown(false);
    }
  }, [result, confirmed]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (r: BrregResult) => {
    setSelectedResult(r);
    setConfirmed(true);
    setShowDropdown(false);
    setInput(r.name);
    onSelect(r);
    onConfirm?.();
  };

  const handleConfirmOrgNr = () => {
    if (selectedResult) {
      setConfirmed(true);
      onSelect(selectedResult);
      onConfirm?.();
    }
  };

  const handleReset = () => {
    setInput('');
    setConfirmed(false);
    setSelectedResult(null);
    reset();
    onReset?.();
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setConfirmed(false);
    setSelectedResult(null);
    reset();
    onReset?.();
  };

  if (confirmed && selectedResult) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && <Label className={labelClass}>{label}</Label>}
        <div className={cn(
          'flex items-center gap-2 p-3 rounded-md text-sm',
          glass ? 'bg-asco-teal/10' : 'bg-primary/5 border border-primary/20'
        )}>
          <CheckCircle2 className={cn('h-4 w-4 shrink-0', glass ? 'text-asco-teal' : 'text-primary')} />
          <div className="flex-1 min-w-0">
            <span className={cn('font-medium', glass ? 'text-white' : 'text-foreground')}>
              {selectedResult.name}
            </span>
            <span className={cn('text-xs ml-2', glass ? 'text-white/50' : 'text-muted-foreground')}>
              {selectedResult.org_number}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn('text-xs shrink-0', glass ? 'text-white/60 hover:text-white hover:bg-white/10' : '')}
            onClick={handleReset}
          >
            Endre
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('space-y-2 relative', className)}>
      {label && <Label className={labelClass}>{label}</Label>}
      <div className="relative">
        <Input
          placeholder="Søk på organisasjonsnummer eller bedriftsnavn"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          className={cn('pr-10', inputClass)}
        />
        {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
        {!isLoading && <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Org number direct result (not yet confirmed) */}
      {selectedResult && !confirmed && !showDropdown && (
        <div className={cn(
          'rounded-lg border-2 p-4 space-y-3',
          glass ? 'border-asco-teal/30 bg-asco-teal/5' : 'border-primary/30 bg-primary/5'
        )}>
          <div className="flex items-center gap-2">
            <Building2 className={cn('h-5 w-5', glass ? 'text-asco-teal' : 'text-primary')} />
            <span className={cn('font-semibold', glass ? 'text-white' : 'text-foreground')}>{selectedResult.name}</span>
          </div>
          <div className={cn('text-sm space-y-1', glass ? 'text-white/50' : 'text-muted-foreground')}>
            <p>{selectedResult.address}</p>
            <p>Organisasjonsform: {selectedResult.org_form}</p>
            {selectedResult.industry_code && <p>Næring: {selectedResult.industry_code}</p>}
          </div>
          <Button
            type="button"
            onClick={handleConfirmOrgNr}
            className={cn('w-full', glass ? 'bg-asco-teal text-asco-teal-foreground hover:bg-asco-teal/90' : '')}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Ja, dette er riktig bedrift
          </Button>
        </div>
      )}

      {/* Name search results dropdown */}
      {showDropdown && results.length > 0 && (
        <div className={cn(
          'absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-80 overflow-y-auto',
          glass ? 'bg-slate-900 border-white/20' : 'bg-popover border-border'
        )}>
          {results.map((r) => (
            <button
              key={r.org_number}
              type="button"
              className={cn(
                'w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors',
                glass
                  ? 'border-white/10 hover:bg-white/10'
                  : 'border-border hover:bg-accent'
              )}
              onClick={() => handleSelect(r)}
            >
              <div className="flex items-center gap-2">
                <Building2 className={cn('h-4 w-4 shrink-0', glass ? 'text-asco-teal' : 'text-primary')} />
                <span className={cn('font-medium text-sm', glass ? 'text-white' : 'text-foreground')}>
                  {r.name}
                </span>
                <span className={cn('text-xs ml-auto shrink-0', glass ? 'text-white/40' : 'text-muted-foreground')}>
                  {r.org_number}
                </span>
              </div>
              {r.address && (
                <p className={cn('text-xs mt-1 ml-6', glass ? 'text-white/40' : 'text-muted-foreground')}>
                  {r.address}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {showDropdown && !isLoading && results.length === 0 && input.trim().length >= 3 && (
        <div className={cn(
          'text-sm p-3 rounded-md',
          glass ? 'text-white/50' : 'text-muted-foreground'
        )}>
          Ingen treff for «{input.trim()}»
        </div>
      )}
    </div>
  );
}
