import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Query keys
const QUERY_KEYS = {
  organizations: ['organizations'] as const,
  sites: ['sites'] as const,
  userSiteAccess: ['userSiteAccess'] as const,
};

export interface Organization {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Site {
  id: string;
  organization_id: string;
  name: string;
  location?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface UserSiteAccess {
  id: string;
  user_id: string;
  site_id: string;
  granted_by: string;
  granted_at: string;
}

// Organizations hooks
export const useOrganizations = () => {
  return useQuery({
    queryKey: QUERY_KEYS.organizations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Organization[];
    },
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organization: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert([organization])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success('Organisasjon opprettet');
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke opprette organisasjon: ${error.message}`);
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Organization> }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success('Organisasjon oppdatert');
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke oppdatere organisasjon: ${error.message}`);
    },
  });
};

export const useToggleOrganizationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.organizations });
      toast.success(`Organisasjon ${data.is_active ? 'aktivert' : 'deaktivert'}`);
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke endre organisasjonsstatus: ${error.message}`);
    },
  });
};

// Sites hooks
export const useSites = (organizationId?: string) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.sites, organizationId],
    queryFn: async () => {
      let query = supabase
        .from('sites')
        .select(`
          *,
          organizations!inner (
            id,
            name
          )
        `)
        .eq('is_active', true);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data;
    },
  });
};

export const useUserAccessibleSites = () => {
  return useQuery({
    queryKey: [...QUERY_KEYS.sites, 'accessible'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_accessible_sites');

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (site: Omit<Site, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
      const { data, error } = await supabase
        .from('sites')
        .insert([site])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sites });
      toast.success('Site opprettet');
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke opprette site: ${error.message}`);
    },
  });
};

export const useUpdateSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Site> }) => {
      const { data, error } = await supabase
        .from('sites')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sites });
      toast.success('Site oppdatert');
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke oppdatere site: ${error.message}`);
    },
  });
};

export const useToggleSiteStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('sites')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sites });
      toast.success(`Site ${data.is_active ? 'aktivert' : 'deaktivert'}`);
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke endre site-status: ${error.message}`);
    },
  });
};

// User site access hooks
export const useUserSiteAccess = () => {
  return useQuery({
    queryKey: QUERY_KEYS.userSiteAccess,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_site_access')
        .select(`
          *,
          sites!inner (
            id,
            name,
            organizations!inner (
              id,
              name
            )
          )
        `);

      if (error) throw error;
      return data;
    },
  });
};

export const useGrantSiteAccess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, siteId }: { userId: string; siteId: string }) => {
      const { data, error } = await supabase
        .from('user_site_access')
        .insert([{
          user_id: userId,
          site_id: siteId,
          granted_by: (await supabase.auth.getUser()).data.user?.id!
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSiteAccess });
      toast.success('Site-tilgang tildelt');
    },
    onError: (error: any) => {
      toast.error(`Kunne ikke tildele site-tilgang: ${error.message}`);
    },
  });
};