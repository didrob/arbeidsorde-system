export interface WizardFormData {
  // Step 1: Basic Info
  title: string;
  description?: string;
  customer_id: string;
  assigned_to?: string;
  notes?: string;

  // Internal order fields
  is_internal?: boolean;
  cost_center?: string;
  linked_order_id?: string;

  // Step 2: Pricing Model
  pricing_model: 'fixed' | 'resource_based';
  price_value?: number;

  // Step 3: Resources (only for resource_based)
  personnel: {
    id: string;
    estimated_hours: number;
    hourly_rate: number;
  }[];
  equipment: {
    id: string;
    estimated_quantity: number;
    rate: number;
    pricing_type: 'hourly' | 'daily' | 'fixed';
  }[];
  materials: {
    id: string;
    quantity: number;
    unit_price: number;
  }[];

  // Step 4: Documentation
  attachments?: File[];

  // Step 5: Planning
  scheduled_start?: Date;
  is_recurring?: boolean;
  recurring_frequency?: 'weekly' | 'monthly' | 'custom';
  recurring_end_date?: Date;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isOptional?: boolean;
}

export type WizardAction = 
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<WizardFormData> }
  | { type: 'MARK_STEP_COMPLETE'; payload: number }
  | { type: 'RESET_WIZARD' };

export interface WizardContextType {
  currentStep: number;
  formData: WizardFormData;
  steps: WizardStep[];
  dispatch: React.Dispatch<WizardAction>;
  isStepCompleted: (stepId: number) => boolean;
  canProceedToStep: (stepId: number) => boolean;
  getTotalEstimatedCost: () => number;
}