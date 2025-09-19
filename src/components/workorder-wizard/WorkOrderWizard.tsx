import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WizardProvider, useWizard } from './WizardContext';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PricingModelStep } from './steps/PricingModelStep';
import { ResourcesStep } from './steps/ResourcesStep';
import { DocumentationStep } from './steps/DocumentationStep';
import { PlanningStep } from './steps/PlanningStep';
import { Badge } from '@/components/ui/badge';

interface WorkOrderWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

function WizardContent({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => Promise<void> }) {
  const { currentStep, steps, dispatch, formData, canProceedToStep, getTotalEstimatedCost } = useWizard();

  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = (currentStep / steps.length) * 100;
  const isLastStep = currentStep === steps.length;
  const canGoNext = canProceedToStep(currentStep + 1) || isLastStep;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      // Skip step 3 if pricing model is fixed
      let nextStep = currentStep + 1;
      if (nextStep === 3 && formData.pricing_model === 'fixed') {
        nextStep = 4;
      }
      dispatch({ type: 'SET_STEP', payload: nextStep });
    }
  };

  const handlePrevious = () => {
    let prevStep = currentStep - 1;
    // Skip step 3 if pricing model is fixed when going backwards
    if (prevStep === 3 && formData.pricing_model === 'fixed') {
      prevStep = 2;
    }
    dispatch({ type: 'SET_STEP', payload: prevStep });
  };

  const handleSubmit = async () => {
    try {
      // Transform wizard data to API format
      const workOrderData = {
        title: formData.title,
        description: formData.description,
        customer_id: formData.customer_id,
        assigned_to: formData.assigned_to || null,
        notes: formData.notes,
        pricing_model: formData.pricing_model,
        price_value: formData.pricing_model === 'fixed' ? formData.price_value : getTotalEstimatedCost(),
        estimated_hours: formData.personnel.reduce((sum, p) => sum + p.estimated_hours, 0),
        // Add other fields as needed
      };

      await onSubmit(workOrderData);
      dispatch({ type: 'RESET_WIZARD' });
      onClose();
    } catch (error) {
      console.error('Error creating work order:', error);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <PricingModelStep />;
      case 3:
        return <ResourcesStep />;
      case 4:
        return <DocumentationStep />;
      case 5:
        return <PlanningStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl">Opprett arbeidsordre</DialogTitle>
          {formData.pricing_model === 'resource_based' && (
            <Badge variant="outline" className="text-sm">
              Estimert: {getTotalEstimatedCost().toLocaleString('no-NO')} kr
            </Badge>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Steg {currentStep} av {steps.length}</span>
            <span>{currentStepData?.title}</span>
          </div>
        </div>
      </DialogHeader>

      {/* Step indicators */}
      <div className="flex justify-center space-x-2 py-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              step.id === currentStep
                ? 'bg-primary text-primary-foreground border-primary'
                : step.isCompleted
                ? 'bg-muted text-muted-foreground border-muted'
                : step.id === 3 && formData.pricing_model === 'fixed'
                ? 'bg-muted/50 text-muted-foreground/50 border-muted/50'
                : 'bg-background text-foreground border-border'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              step.id === currentStep ? 'bg-primary-foreground text-primary' : ''
            }`}>
              {step.id}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
            {step.isOptional && (
              <Badge variant="secondary" className="text-xs hidden sm:inline">Valgfritt</Badge>
            )}
          </div>
        ))}
      </div>

      {/* Current step content */}
      <div className="py-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Tilbake</span>
        </Button>

        <div className="flex space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Avbryt
          </Button>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext && !isLastStep}
            className="flex items-center space-x-2"
          >
            <span>{isLastStep ? 'Opprett arbeidsordre' : 'Neste'}</span>
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export function WorkOrderWizard({ open, onClose, onSubmit }: WorkOrderWizardProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <WizardProvider>
        <WizardContent onClose={onClose} onSubmit={onSubmit} />
      </WizardProvider>
    </Dialog>
  );
}