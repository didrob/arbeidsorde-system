import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useWizard } from '../WizardContext';
import { Calculator, Clock, DollarSign } from 'lucide-react';

export function PricingModelStep() {
  const { formData, dispatch } = useWizard();

  const updatePricingModel = (value: 'fixed' | 'resource_based') => {
    dispatch({ 
      type: 'UPDATE_DATA', 
      payload: { pricing_model: value } 
    });
    
    // Mark step as completed
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: 2 });
  };

  const updateFixedPrice = (value: number) => {
    dispatch({ 
      type: 'UPDATE_DATA', 
      payload: { price_value: value } 
    });
  };

  React.useEffect(() => {
    // Mark step complete if pricing model is selected and requirements are met
    const isComplete = () => {
      if (!formData.pricing_model) return false;
      if (formData.pricing_model === 'fixed' && (!formData.price_value || formData.price_value <= 0)) {
        return false;
      }
      return true;
    };

    if (isComplete()) {
      dispatch({ type: 'MARK_STEP_COMPLETE', payload: 2 });
    }
  }, [formData.pricing_model, formData.price_value, dispatch]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Velg prismodell</h3>
        <p className="text-sm text-muted-foreground">
          Hvordan vil du beregne prisen for denne arbeidsordren?
        </p>
      </div>

      <RadioGroup
        value={formData.pricing_model}
        onValueChange={updatePricingModel}
        className="space-y-4"
      >
        {/* Fixed Price Option */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed" id="fixed" />
            <Label htmlFor="fixed" className="text-base font-medium">Fastpris</Label>
          </div>
          
          <Card className={`transition-all ${formData.pricing_model === 'fixed' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Fast pris for hele oppdraget</CardTitle>
              </div>
              <CardDescription>
                Sett en fast totalsum for arbeidsordren. Enklest for både deg og kunden.
              </CardDescription>
            </CardHeader>
            {formData.pricing_model === 'fixed' && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Label htmlFor="fixed-price">Totalpris (NOK)</Label>
                  <Input
                    id="fixed-price"
                    type="number"
                    placeholder="0"
                    value={formData.price_value || ''}
                    onChange={(e) => updateFixedPrice(Number(e.target.value))}
                    className="max-w-xs"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Resource Based Option */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="resource_based" id="resource_based" />
            <Label htmlFor="resource_based" className="text-base font-medium">Ressursbasert</Label>
          </div>
          
          <Card className={`transition-all ${formData.pricing_model === 'resource_based' ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Beregn pris basert på ressurser</CardTitle>
              </div>
              <CardDescription>
                Pris beregnes automatisk basert på timer, utstyr og materialer. Mer detaljert og transparent.
              </CardDescription>
            </CardHeader>
            {formData.pricing_model === 'resource_based' && (
              <CardContent className="pt-0">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Du vil kunne legge til personell, utstyr og materialer i neste steg</span>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </RadioGroup>

      {/* Benefits comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Fastpris - Fordeler:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Enkel og rask opprettelse</li>
            <li>• Forutsigbar pris for kunden</li>
            <li>• Mindre administrasjon</li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Ressursbasert - Fordeler:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Detaljert kostnadsoversikt</li>
            <li>• Automatisk prisberegning</li>
            <li>• Bedre sporing av ressursbruk</li>
          </ul>
        </div>
      </div>
    </div>
  );
}