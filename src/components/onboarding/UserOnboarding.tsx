import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Building2, MapPin, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizations, useSites } from '@/hooks/useOrganizations';

interface OnboardingFormData {
  organizationId: string;
  siteId: string;
  phone?: string;
  requestMessage?: string;
}

export function UserOnboarding() {
  const { user } = useAuth();
  const { data: organizations } = useOrganizations();
  const { data: sites } = useSites();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    organizationId: '',
    siteId: '',
    phone: '',
    requestMessage: ''
  });
  const [submitType, setSubmitType] = useState<'direct' | 'request' | null>(null);

  // Filter sites based on selected organization
  const availableSites = sites?.filter(site => 
    !formData.organizationId || site.organization_id === formData.organizationId
  );

  // Direct assignment mutation (for when user can directly choose)
  const directAssignMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          organization_id: data.organizationId,
          site_id: data.siteId,
          phone: data.phone || null
        })
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Profil oppdatert! Velkomenn til systemet.');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // Force page reload to update auth context
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering av profil: ' + error.message);
    }
  });

  // Access request mutation (for when user needs approval)
  const accessRequestMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      // Create access request (this would be a new table in a real implementation)
      // For now, we'll just update the profile with a pending status
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: data.phone || null,
          // We could add a 'pending_organization_id' and 'pending_site_id' fields
          // For now, we'll use a workaround
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // In a real implementation, we'd also create a notification for admins
      console.log('Access request:', {
        userId: user?.id,
        organizationId: data.organizationId,
        siteId: data.siteId,
        message: data.requestMessage
      });
    },
    onSuccess: () => {
      toast.success('Tilgangsforespørsel sendt! En administrator vil behandle den snart.');
    },
    onError: (error: any) => {
      toast.error('Feil ved sending av forespørsel: ' + error.message);
    }
  });

  const handleSubmit = (type: 'direct' | 'request') => {
    if (!formData.organizationId || !formData.siteId) {
      toast.error('Vennligst velg organisasjon og site');
      return;
    }

    if (type === 'direct') {
      directAssignMutation.mutate(formData);
    } else {
      accessRequestMutation.mutate(formData);
    }
  };

  const selectedOrganization = organizations?.find(org => org.id === formData.organizationId);
  const selectedSite = availableSites?.find(site => site.id === formData.siteId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Velkommen til Asco Workorder!</CardTitle>
          <CardDescription>
            For å komme i gang trenger vi å knytte deg til en organisasjon og et arbeidssted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Selection */}
          <div className="space-y-2">
            <Label htmlFor="organization" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organisasjon
            </Label>
            <Select
              value={formData.organizationId}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                organizationId: value,
                siteId: '' // Reset site when organization changes
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg organisasjon" />
              </SelectTrigger>
              <SelectContent>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Site Selection */}
          {formData.organizationId && (
            <div className="space-y-2">
              <Label htmlFor="site" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Arbeidssted
              </Label>
              <Select
                value={formData.siteId}
                onValueChange={(value) => setFormData({ ...formData, siteId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg arbeidssted" />
                </SelectTrigger>
                <SelectContent>
                  {availableSites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} {site.location && `(${site.location})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer (valgfritt)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ditt telefonnummer"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Selected Summary */}
          {selectedOrganization && selectedSite && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Ditt valg:</h4>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">{selectedOrganization.name}</span>
                {' → '}
                <span className="font-medium">{selectedSite.name}</span>
                {selectedSite.location && ` (${selectedSite.location})`}
              </p>
            </div>
          )}

          {/* Request Message for Access Request */}
          {submitType === 'request' && (
            <div className="space-y-2">
              <Label htmlFor="message">Melding til administrator</Label>
              <Textarea
                id="message"
                placeholder="Fortell kort hvem du er og hvorfor du trenger tilgang..."
                value={formData.requestMessage}
                onChange={(e) => setFormData({ ...formData, requestMessage: e.target.value })}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleSubmit('direct')}
              disabled={!formData.organizationId || !formData.siteId || directAssignMutation.isPending}
              className="flex-1"
            >
              {directAssignMutation.isPending ? 'Oppdaterer...' : 'Fullfør registrering'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                if (submitType === 'request') {
                  handleSubmit('request');
                } else {
                  setSubmitType('request');
                }
              }}
              disabled={!formData.organizationId || !formData.siteId || accessRequestMutation.isPending}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitType === 'request' 
                ? (accessRequestMutation.isPending ? 'Sender...' : 'Send forespørsel')
                : 'Send tilgangsforespørsel'
              }
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Hvis du ikke finner din organisasjon eller har spørsmål, ta kontakt med din administrator.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}