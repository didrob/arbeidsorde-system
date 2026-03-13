import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface WorkOrderWizardContextType {
  isOpen: boolean;
  openWizard: () => void;
  closeWizard: () => void;
}

const WorkOrderWizardContext = createContext<WorkOrderWizardContextType | null>(null);

export function WorkOrderWizardProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openWizard = useCallback(() => setIsOpen(true), []);
  const closeWizard = useCallback(() => setIsOpen(false), []);

  // Keyboard shortcut: "N" opens wizard (when no input focused)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        const isEditable = (e.target as HTMLElement)?.isContentEditable;
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <WorkOrderWizardContext.Provider value={{ isOpen, openWizard, closeWizard }}>
      {children}
    </WorkOrderWizardContext.Provider>
  );
}

export function useWorkOrderWizard() {
  const context = useContext(WorkOrderWizardContext);
  if (!context) {
    throw new Error('useWorkOrderWizard must be used within WorkOrderWizardProvider');
  }
  return context;
}
