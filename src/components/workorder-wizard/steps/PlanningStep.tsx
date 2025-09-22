import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWizard } from '../WizardContext';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { CalendarIcon, Clock, Repeat, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PlanningStep() {
  const { formData, dispatch } = useWizard();

  const updateFormData = (field: string, value: any) => {
    dispatch({ 
      type: 'UPDATE_DATA', 
      payload: { [field]: value } 
    });
  };

  React.useEffect(() => {
    // Mark step as completed (optional step)
    dispatch({ type: 'MARK_STEP_COMPLETE', payload: 5 });
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Planlegging</h3>
        <p className="text-sm text-muted-foreground">
          Sett opp terminering og eventuelle gjentakende oppgaver
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scheduled Start */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Planlagt oppstart</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Ønsket startdato (valgfritt)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.scheduled_start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_start ? (
                      format(formData.scheduled_start, "PPP", { locale: nb })
                    ) : (
                      <span>Velg dato</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_start}
                    onSelect={(date) => updateFormData('scheduled_start', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Hvis du ikke setter dato, kan feltarbeideren starte når som helst
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recurring Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Repeat className="w-5 h-5" />
              <span>Gjentakende oppdrag</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dette er et gjentakende oppdrag</Label>
                <p className="text-sm text-muted-foreground">
                  Opprett flere arbeidsordrer automatisk
                </p>
              </div>
              <Switch
                checked={formData.is_recurring || false}
                onCheckedChange={(checked) => updateFormData('is_recurring', checked)}
              />
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Frekvens</Label>
                  <Select
                    value={formData.recurring_frequency}
                    onValueChange={(value) => updateFormData('recurring_frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="weekly">Ukentlig</SelectItem>
                      <SelectItem value="monthly">Månedlig</SelectItem>
                      <SelectItem value="custom">Tilpasset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sluttdato for gjentakelser</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.recurring_end_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.recurring_end_date ? (
                          format(formData.recurring_end_date, "PPP", { locale: nb })
                        ) : (
                          <span>Velg sluttdato</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.recurring_end_date}
                        onSelect={(date) => updateFormData('recurring_end_date', date)}
                        disabled={(date) => {
                          const minDate = formData.scheduled_start 
                            ? new Date(formData.scheduled_start.getTime() + 24 * 60 * 60 * 1000)
                            : new Date(Date.now() + 24 * 60 * 60 * 1000);
                          return date < minDate;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Planning Summary */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-base text-green-900">Sammendrag av planlegging</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-green-700">
            <div className="flex justify-between">
              <span>Startdato:</span>
              <span className="font-medium">
                {formData.scheduled_start 
                  ? format(formData.scheduled_start, "PPP", { locale: nb })
                  : "Ikke planlagt (flexibel start)"
                }
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Gjentakende:</span>
              <span className="font-medium">
                {formData.is_recurring 
                  ? `Ja, ${formData.recurring_frequency === 'weekly' ? 'ukentlig' : 
                       formData.recurring_frequency === 'monthly' ? 'månedlig' : 'tilpasset'}`
                  : "Nei, engangsoppdrag"
                }
              </span>
            </div>
            
            {formData.is_recurring && formData.recurring_end_date && (
              <div className="flex justify-between">
                <span>Slutt gjentakelser:</span>
                <span className="font-medium">
                  {format(formData.recurring_end_date, "PPP", { locale: nb })}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Tips for planlegging</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Gi tilstrekkelig tid for forberedelse og mobilisering</li>
            <li>• Husk å koordinere med kundens tilgjengelighet</li>
            <li>• For gjentakende oppdrag: vurder sesongvariasjoner</li>
            <li>• Sett realistiske datoer basert på ressurstilgjengelighet</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}