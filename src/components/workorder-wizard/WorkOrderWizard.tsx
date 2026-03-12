import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { WizardProvider, useWizard } from './WizardContext';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { PricingModelStep } from './steps/PricingModelStep';
import { ResourcesStep } from './steps/ResourcesStep';
import { DocumentationStep } from './steps/DocumentationStep';
import { PlanningStep } from './steps/PlanningStep';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WorkOrderWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onSaveDraft?: (data: any) => Promise<void>;
  embedded?: boolean;
}

function WizardContent({ onClose, onSubmit, onSaveDraft, embedded }: { 
  onClose: () => void; 
  onSubmit: (data: any) => Promise<void>;
  onSaveDraft?: (data: any) => Promise<void>;
  embedded?: boolean;
}) {
  const { currentStep, steps, dispatch, formData, canProceedToStep, getTotalEstimatedCost } = useWizard();

  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = (currentStep / steps.length) * 100;
  const isLastStep = currentStep === steps.length;
  
  const getIntendedNextStep = () => {
    let nextStep = currentStep + 1;
    if (nextStep === 3 && formData.pricing_model === 'fixed') {
      nextStep = 4;
    }
    return nextStep;
  };
  
  const intendedNextStep = getIntendedNextStep();
  const canGoNext = canProceedToStep(intendedNextStep) || isLastStep;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      let nextStep = currentStep + 1;
      if (nextStep === 3 && formData.pricing_model === 'fixed') {
        nextStep = 4;
      }
      dispatch({ type: 'SET_STEP', payload: nextStep });
    }
  };

  const handlePrevious = () => {
    let prevStep = currentStep - 1;
    if (prevStep === 3 && formData.pricing_model === 'fixed') {
      prevStep = 2;
    }
    dispatch({ type: 'SET_STEP', payload: prevStep });
  };

  const getWorkOrderData = () => ({
    title: formData.title,
    description: formData.description,
    customer_id: formData.customer_id,
    assigned_to: formData.assigned_to || null,
    notes: formData.notes,
    pricing_model: formData.pricing_model,
    pricing_type: formData.pricing_model === 'fixed' ? 'fixed' : 'hourly',
    price_value: formData.pricing_model === 'fixed' ? formData.price_value : undefined,
    estimated_hours: formData.personnel.reduce((sum, p) => sum + p.estimated_hours, 0),
  });

  const handleSubmit = async () => {
    try {
      await onSubmit(getWorkOrderData());
      dispatch({ type: 'RESET_WIZARD' });
      onClose();
    } catch (error) {
      console.error('Error creating work order:', error);
    }
  };

  const handleDraft = async () => {
    if (!onSaveDraft) return;
    try {
      await onSaveDraft(getWorkOrderData());
      dispatch({ type: 'RESET_WIZARD' });
      onClose();
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return <BasicInfoStep />;
      case 2: return <PricingModelStep />;
      case 3: return <ResourcesStep />;
      case 4: return <DocumentationStep />;
      case 5: return <PlanningStep />;
      default: return <BasicInfoStep />;
    }
  };

  const content = (
    <>
      {/* Fixed header */}
      <div className="flex-shrink-0 border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-foreground">Opprett arbeidsordre</h2>
          <div className="flex items-center space-x-4">
            {formData.pricing_model === 'resource_based' && (
              <Badge variant="outline" className="text-base px-3 py-1">
                Estimert: {getTotalEstimatedCost().toLocaleString('no-NO')} kr
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-3">
          <Progress value={progress} className="w-full h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Steg {currentStep} av {steps.length}</span>
            <span className="font-medium">{currentStepData?.title}</span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center space-x-1 mt-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center space-x-2 px-2 py-1 rounded-md text-xs transition-colors",
                step.id === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : step.isCompleted
                  ? 'bg-muted text-muted-foreground'
                  : step.id === 3 && formData.pricing_model === 'fixed'
                  ? 'bg-muted/50 text-muted-foreground/50'
                  : 'bg-background text-foreground border'
              )}
            >
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium",
                step.id === currentStep && 'bg-primary-foreground text-primary'
              )}>
                {step.id}
              </div>
              <span className="font-medium hidden lg:inline">{step.title}</span>
              {step.isOptional && (
                <Badge variant="secondary" className="text-xs hidden xl:inline">Valgfritt</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("mx-auto p-6", !embedded && "container max-w-4xl")}>
          {renderCurrentStep()}
        </div>
      </div>

      {/* Fixed footer */}
      <div className="flex-shrink-0 border-t bg-background p-6">
        <div className={cn("flex justify-between", !embedded && "max-w-4xl mx-auto")}>
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

          <div className="flex space-x-3">
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDraft}
                disabled={!formData.title || !formData.customer_id}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Lagre som kladd</span>
              </Button>
            )}
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
              size="lg"
            >
              <span>{isLastStep ? 'Opprett arbeidsordre' : 'Neste'}</span>
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  // When embedded in the slide-in panel, don't wrap in Dialog
  if (embedded) {
    return <div className="flex flex-col h-full">{content}</div>;
  }

  return (
    <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 flex flex-col">
      {content}
    </DialogContent>
  );
}

export function WorkOrderWizard({ open, onClose, onSubmit, onSaveDraft, embedded }: WorkOrderWizardProps) {
  if (embedded) {
    return (
      <WizardProvider>
        <WizardContent onClose={onClose} onSubmit={onSubmit} onSaveDraft={onSaveDraft} embedded />
      </WizardProvider>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <WizardProvider>
        <WizardContent onClose={onClose} onSubmit={onSubmit} onSaveDraft={onSaveDraft} />
      </WizardProvider>
    </Dialog>
  );
}

export default WorkOrderWizard;
