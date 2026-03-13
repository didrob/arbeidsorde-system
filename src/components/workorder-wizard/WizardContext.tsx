import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { WizardAction, WizardContextType, WizardFormData, WizardStep } from './types';

const initialFormData: WizardFormData = {
  title: '',
  description: '',
  customer_id: '',
  assigned_to: '',
  notes: '',
  pricing_model: 'fixed',
  price_value: 0,
  personnel: [],
  equipment: [],
  materials: [],
  attachments: [],
  scheduled_start: undefined,
  is_recurring: false,
  recurring_frequency: 'weekly',
  recurring_end_date: undefined,
  is_internal: false,
  cost_center: undefined,
  linked_order_id: undefined,
};

const initialSteps: WizardStep[] = [
  { id: 1, title: 'Grunnleggende info', description: 'Kunde, tittel og beskrivelse', isCompleted: false },
  { id: 2, title: 'Prismodell', description: 'Fastpris eller ressursbasert', isCompleted: false },
  { id: 3, title: 'Ressurser', description: 'Personell, utstyr og materiell', isCompleted: false, isOptional: true },
  { id: 4, title: 'Dokumentasjon', description: 'Bilder og dokumenter', isCompleted: false, isOptional: true },
  { id: 5, title: 'Planlegging', description: 'Terminering og gjentakelse', isCompleted: false, isOptional: true },
];

interface WizardState {
  currentStep: number;
  formData: WizardFormData;
  steps: WizardStep[];
}

const initialState: WizardState = {
  currentStep: 1,
  formData: initialFormData,
  steps: initialSteps,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'UPDATE_DATA':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload }
      };
    
    case 'MARK_STEP_COMPLETE':
      return {
        ...state,
        steps: state.steps.map(step =>
          step.id === action.payload 
            ? { ...step, isCompleted: true }
            : step
        )
      };
    
    case 'RESET_WIZARD':
      return initialState;
    
    default:
      return state;
  }
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const isStepCompleted = (stepId: number) => {
    return state.steps.find(step => step.id === stepId)?.isCompleted || false;
  };

  const canProceedToStep = (stepId: number) => {
    // Can always go to step 1
    if (stepId === 1) return true;
    
    // Special validation for step 2 (pricing model)
    if (stepId === 3 || stepId === 4 || stepId === 5) {
      // Validate step 2 requirements
      if (!state.formData.pricing_model) return false;
      if (state.formData.pricing_model === 'fixed' && (!state.formData.price_value || state.formData.price_value <= 0)) {
        return false;
      }
      
      // For step 3 (resources), only required if pricing_model is resource_based
      if (stepId === 3) {
        return state.formData.pricing_model === 'resource_based';
      }
      
      // For steps 4 and 5, skip step 3 if fixed pricing
      if (stepId === 4 || stepId === 5) {
        if (state.formData.pricing_model === 'fixed') {
          return true; // Step 2 is already validated above
        } else {
          return isStepCompleted(3); // Need step 3 completed for resource-based
        }
      }
    }
    
    // For other steps, just check if previous step is completed
    return isStepCompleted(stepId - 1);
  };

  const getTotalEstimatedCost = () => {
    const { formData } = state;
    
    if (formData.pricing_model === 'fixed') {
      return formData.price_value || 0;
    }

    // Calculate resource-based cost
    let total = 0;
    
    // Personnel costs
    formData.personnel.forEach(p => {
      total += p.estimated_hours * p.hourly_rate;
    });
    
    // Equipment costs
    formData.equipment.forEach(e => {
      total += e.estimated_quantity * e.rate;
    });
    
    // Material costs
    formData.materials.forEach(m => {
      total += m.quantity * m.unit_price;
    });
    
    return total;
  };

  const contextValue: WizardContextType = {
    currentStep: state.currentStep,
    formData: state.formData,
    steps: state.steps,
    dispatch,
    isStepCompleted,
    canProceedToStep,
    getTotalEstimatedCost,
  };

  return (
    <WizardContext.Provider value={contextValue}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}