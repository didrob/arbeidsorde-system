import { createContext, useContext, useState, ReactNode } from 'react';

interface SiteFilterContextType {
  selectedSiteId: string | undefined;
  setSelectedSiteId: (siteId: string | undefined) => void;
}

const SiteFilterContext = createContext<SiteFilterContextType | undefined>(undefined);

export function SiteFilterProvider({ children }: { children: ReactNode }) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem('selectedSiteId') || undefined;
    } catch {
      return undefined;
    }
  });

  const handleSetSelectedSiteId = (siteId: string | undefined) => {
    setSelectedSiteId(siteId);
    try {
      if (siteId) {
        localStorage.setItem('selectedSiteId', siteId);
      } else {
        localStorage.removeItem('selectedSiteId');
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <SiteFilterContext.Provider value={{ selectedSiteId, setSelectedSiteId: handleSetSelectedSiteId }}>
      {children}
    </SiteFilterContext.Provider>
  );
}

export function useSiteFilter() {
  const context = useContext(SiteFilterContext);
  if (context === undefined) {
    throw new Error('useSiteFilter must be used within a SiteFilterProvider');
  }
  return context;
}
