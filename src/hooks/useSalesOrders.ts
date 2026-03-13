import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSiteFilter } from '@/hooks/useSiteFilter';

// ── Types ──────────────────────────────────────────────
export interface SalesOrder {
  id: string;
  sales_order_number: string;
  customer_id: string;
  site_id: string;
  status: string;
  period_from: string | null;
  period_to: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  exported_at: string | null;
  exported_by: string | null;
  paid_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  customers?: { name: string; org_number: string | null; address: string | null; email: string | null; contact_person: string | null };
}

export interface SalesOrderLine {
  id: string;
  sales_order_id: string;
  work_order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  vat_rate: number;
  vat_amount: number;
  item_type: string | null;
  sort_order: number;
}

export interface ReadyCustomerGroup {
  customer_id: string;
  customer_name: string;
  org_number: string | null;
  site_id: string;
  orders: Array<{
    id: string;
    title: string;
    pricing_type: string;
    price_value: number | null;
    completed_at: string | null;
  }>;
  estimated_total: number;
}

// ── Ready for Sales Order ──────────────────────────────
export function useReadyForSalesOrder() {
  const { selectedSiteId } = useSiteFilter();

  return useQuery({
    queryKey: ['ready-for-sales-order', selectedSiteId],
    queryFn: async () => {
      let query = supabase
        .from('work_orders')
        .select('id, title, pricing_type, price_value, completed_at, customer_id, site_id, customers(name, org_number)')
        .eq('status', 'completed')
        .eq('is_internal', false)
        .eq('is_deleted', false)
        .is('sales_order_id', null);

      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by customer
      const grouped = new Map<string, ReadyCustomerGroup>();
      for (const wo of data || []) {
        const cust = wo.customers as any;
        if (!grouped.has(wo.customer_id)) {
          grouped.set(wo.customer_id, {
            customer_id: wo.customer_id,
            customer_name: cust?.name || 'Ukjent',
            org_number: cust?.org_number || null,
            site_id: wo.site_id!,
            orders: [],
            estimated_total: 0,
          });
        }
        const group = grouped.get(wo.customer_id)!;
        group.orders.push({
          id: wo.id,
          title: wo.title,
          pricing_type: wo.pricing_type,
          price_value: wo.price_value,
          completed_at: wo.completed_at,
        });
        group.estimated_total += wo.price_value || 0;
      }

      return Array.from(grouped.values());
    },
  });
}

// ── All Sales Orders ───────────────────────────────────
export function useSalesOrders() {
  const { selectedSiteId } = useSiteFilter();

  return useQuery({
    queryKey: ['sales-orders', selectedSiteId],
    queryFn: async () => {
      let query = supabase
        .from('sales_orders')
        .select('*, customers(name, org_number, address, email, contact_person)')
        .order('created_at', { ascending: false });

      if (selectedSiteId) {
        query = query.eq('site_id', selectedSiteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SalesOrder[];
    },
  });
}

// ── Single Sales Order with Lines ──────────────────────
export function useSalesOrder(id: string | null) {
  return useQuery({
    queryKey: ['sales-order', id],
    enabled: !!id,
    queryFn: async () => {
      const [soRes, linesRes] = await Promise.all([
        supabase
          .from('sales_orders')
          .select('*, customers(name, org_number, address, email, contact_person)')
          .eq('id', id!)
          .single(),
        supabase
          .from('sales_order_lines')
          .select('*')
          .eq('sales_order_id', id!)
          .order('sort_order'),
      ]);

      if (soRes.error) throw soRes.error;
      if (linesRes.error) throw linesRes.error;

      return {
        salesOrder: soRes.data as SalesOrder,
        lines: (linesRes.data || []) as SalesOrderLine[],
      };
    },
  });
}

// ── Create Sales Order ─────────────────────────────────
export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (group: ReadyCustomerGroup) => {
      const VAT_RATE = 25;
      const lines = group.orders.map((wo, i) => {
        const unitPrice = wo.price_value || 0;
        const lineTotal = unitPrice;
        const vatAmount = lineTotal * (VAT_RATE / 100);
        return {
          work_order_id: wo.id,
          description: wo.title,
          quantity: 1,
          unit_price: unitPrice,
          line_total: lineTotal,
          vat_rate: VAT_RATE,
          vat_amount: vatAmount,
          item_type: wo.pricing_type,
          sort_order: i,
        };
      });

      const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
      const taxAmount = lines.reduce((s, l) => s + l.vat_amount, 0);
      const totalAmount = subtotal + taxAmount;

      // Determine period
      const dates = group.orders
        .map(o => o.completed_at)
        .filter(Boolean)
        .sort();
      const periodFrom = dates[0] ? dates[0].split('T')[0] : null;
      const periodTo = dates[dates.length - 1] ? dates[dates.length - 1].split('T')[0] : null;

      // Insert sales order
      const { data: so, error: soErr } = await supabase
        .from('sales_orders')
        .insert({
          customer_id: group.customer_id,
          site_id: group.site_id,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          period_from: periodFrom,
          period_to: periodTo,
          created_by: user!.id,
        })
        .select()
        .single();

      if (soErr) throw soErr;

      // Insert lines
      const lineInserts = lines.map(l => ({ ...l, sales_order_id: so.id }));
      const { error: lineErr } = await supabase
        .from('sales_order_lines')
        .insert(lineInserts);
      if (lineErr) throw lineErr;

      // Link work orders
      const woIds = group.orders.map(o => o.id);
      const { error: linkErr } = await supabase
        .from('work_orders')
        .update({ sales_order_id: so.id })
        .in('id', woIds);
      if (linkErr) throw linkErr;

      return so;
    },
    onSuccess: (so) => {
      toast({ title: 'Salgsordre opprettet', description: `${so.sales_order_number}` });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['ready-for-sales-order'] });
    },
    onError: (err: any) => {
      toast({ title: 'Feil', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Update Status ──────────────────────────────────────
export function useUpdateSalesOrderStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: Record<string, any> = { status };
      if (status === 'approved') {
        updates.approved_by = user!.id;
        updates.approved_at = new Date().toISOString();
      } else if (status === 'exported') {
        updates.exported_by = user!.id;
        updates.exported_at = new Date().toISOString();
      } else if (status === 'paid') {
        updates.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sales_orders')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Status oppdatert' });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-order'] });
    },
    onError: (err: any) => {
      toast({ title: 'Feil', description: err.message, variant: 'destructive' });
    },
  });
}

// ── Delete Draft ───────────────────────────────────────
export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Unlink work orders first
      const { error: unlinkErr } = await supabase
        .from('work_orders')
        .update({ sales_order_id: null })
        .eq('sales_order_id', id);
      if (unlinkErr) throw unlinkErr;

      // Delete SO (cascade deletes lines)
      const { error } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Salgsordre slettet' });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['ready-for-sales-order'] });
    },
    onError: (err: any) => {
      toast({ title: 'Feil', description: err.message, variant: 'destructive' });
    },
  });
}
