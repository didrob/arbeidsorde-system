import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const customerDetailKeys = {
  detail: (id: string) => ['customer-detail', id] as const,
  orders: (id: string) => ['customer-orders', id] as const,
  economy: (id: string) => ['customer-economy', id] as const,
  notes: (id: string) => ['customer-notes', id] as const,
  attachments: (id: string) => ['customer-attachments', id] as const,
  agreements: (id: string) => ['customer-agreements', id] as const,
};

export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: customerDetailKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;

      // Get site name
      let siteName: string | null = null;
      if (data.site_id) {
        const { data: site } = await supabase
          .from('sites')
          .select('name')
          .eq('id', data.site_id)
          .single();
        siteName = site?.name || null;
      }

      // Get approved by name
      let approvedByName: string | null = null;
      if (data.approved_by) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', data.approved_by)
          .single();
        approvedByName = profile?.full_name || null;
      }

      return { ...data, site_name: siteName, approved_by_name: approvedByName };
    },
    enabled: !!id,
  });
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: customerDetailKeys.orders(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });
}

export function useCustomerEconomy(customerId: string) {
  return useQuery({
    queryKey: customerDetailKeys.economy(customerId),
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('work_orders')
        .select('id, status, price_value, pricing_type, title, completed_at, created_at')
        .eq('customer_id', customerId)
        .eq('is_deleted', false);
      if (error) throw error;

      const allOrders = orders || [];
      const totalRevenue = allOrders
        .filter(o => o.status === 'completed' && o.price_value)
        .reduce((sum, o) => sum + (o.price_value || 0), 0);

      const pendingRevenue = allOrders
        .filter(o => o.status === 'completed' && o.price_value)
        .reduce((sum, o) => sum + (o.price_value || 0), 0);

      // Uninvoiced = completed orders (simplified — no invoice join needed for now)
      const uninvoiced = allOrders
        .filter(o => o.status === 'completed' && o.price_value)
        .reduce((sum, o) => sum + (o.price_value || 0), 0);

      // Group by month
      const monthlyRevenue: Record<string, number> = {};
      allOrders
        .filter(o => o.status === 'completed' && o.price_value)
        .forEach(o => {
          const date = new Date(o.completed_at || o.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (o.price_value || 0);
        });

      // Group by pricing type
      const byType: Record<string, { count: number; revenue: number }> = {};
      allOrders.forEach(o => {
        const type = o.pricing_type || 'unknown';
        if (!byType[type]) byType[type] = { count: 0, revenue: 0 };
        byType[type].count++;
        byType[type].revenue += o.price_value || 0;
      });

      return {
        totalRevenue,
        pendingRevenue,
        uninvoiced,
        monthlyRevenue,
        byType,
        totalOrders: allOrders.length,
      };
    },
    enabled: !!customerId,
  });
}

export function useCustomerNotes(customerId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: customerDetailKeys.notes(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profile names for note authors
      const userIds = [...new Set((data || []).map(n => n.user_id))];
      const profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        (profiles || []).forEach(p => {
          profileMap[p.user_id] = p.full_name || 'Ukjent';
        });
      }

      return (data || []).map(n => ({
        ...n,
        author_name: profileMap[n.user_id] || 'Ukjent',
      }));
    },
    enabled: !!customerId,
  });

  const addNote = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from('customer_notes')
        .insert({ customer_id: customerId, user_id: user!.id, content });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerDetailKeys.notes(customerId) }),
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('customer_notes')
        .delete()
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerDetailKeys.notes(customerId) }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
      const { error } = await supabase
        .from('customer_notes')
        .update({ content })
        .eq('id', noteId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerDetailKeys.notes(customerId) }),
  });

  return { ...query, addNote, deleteNote, updateNote };
}

export function useCustomerAttachments(customerId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: customerDetailKeys.attachments(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_attachments')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(a => a.uploaded_by))];
      const profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        (profiles || []).forEach(p => {
          profileMap[p.user_id] = p.full_name || 'Ukjent';
        });
      }

      return (data || []).map(a => ({
        ...a,
        uploader_name: profileMap[a.uploaded_by] || 'Ukjent',
      }));
    },
    enabled: !!customerId,
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const filePath = `${customerId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('customer-attachments')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('customer-attachments')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('customer_attachments')
        .insert({
          customer_id: customerId,
          uploaded_by: user!.id,
          file_name: file.name,
          file_url: filePath,
          file_type: file.type,
          file_size: file.size,
        });
      if (dbError) throw dbError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerDetailKeys.attachments(customerId) }),
  });

  const deleteAttachment = useMutation({
    mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
      await supabase.storage.from('customer-attachments').remove([fileUrl]);
      const { error } = await supabase
        .from('customer_attachments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerDetailKeys.attachments(customerId) }),
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('customer-attachments')
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  return { ...query, uploadAttachment, deleteAttachment, getDownloadUrl };
}

export function useCustomerAgreements(customerId: string) {
  return useQuery({
    queryKey: customerDetailKeys.agreements(customerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_pricing_agreements')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });
}
