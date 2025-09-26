import { createContext, useContext, useState, ReactNode } from 'react';

interface SiteFilterContextType {
  selectedSiteId: string | undefined;
  setSelectedSiteId: (siteId: string | undefined) => void;
}

const SiteFilterContext = createContext<SiteFilterContextType | undefined>(undefined);

export function SiteFilterProvider({ children }: { children: ReactNode }) {
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);

  return (
    <SiteFilterContext.Provider value={{ selectedSiteId, setSelectedSiteId }}>
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
