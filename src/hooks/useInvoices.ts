import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  line_items?: InvoiceLineItem[];
}

interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  work_order_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  item_type: 'service' | 'material' | 'equipment' | 'extra_time' | 'adjustment';
  reference_id?: string;
}

interface CreateInvoiceData {
  customer_id: string;
  due_date: string;
  work_order_ids?: string[];
  notes?: string;
}

// API functions
const fetchInvoices = async (): Promise<Invoice[]> => {
  // Fetch invoices without line items first
  const { data: invoicesData, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name, email)
    `)
    .order('created_at', { ascending: false });

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  if (!invoicesData || invoicesData.length === 0) {
    return [];
  }

  // Fetch line items separately
  const invoiceIds = invoicesData.map(invoice => invoice.id);
  const { data: lineItemsData, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .in('invoice_id', invoiceIds);

  if (lineItemsError) {
    throw new Error(lineItemsError.message);
  }

  // Combine data
  const invoicesWithLineItems = invoicesData.map(invoice => ({
    ...invoice,
    line_items: (lineItemsData || []).filter(item => item.invoice_id === invoice.id)
  }));

  return invoicesWithLineItems as unknown as Invoice[];
};

const fetchInvoice = async (id: string): Promise<Invoice> => {
  // Fetch invoice without line items first
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name, email, address, contact_person)
    `)
    .eq('id', id)
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (!invoiceData) {
    throw new Error('Faktura ikke funnet');
  }

  // Fetch line items separately
  const { data: lineItemsData, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id);

  if (lineItemsError) {
    throw new Error(lineItemsError.message);
  }

  // Combine data
  const invoiceWithLineItems = {
    ...invoiceData,
    line_items: lineItemsData || []
  };

  return invoiceWithLineItems as unknown as Invoice;
};

const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Ikke autentisert');
  }

  try {
    // Generate invoice number
    const { data: invoiceNumber, error: numberError } = await supabase
      .rpc('generate_invoice_number');

    if (numberError) {
      console.error('Invoice number generation error:', numberError);
      throw new Error('Kunne ikke generere fakturanummer: ' + numberError.message);
    }

    console.log('Generated invoice number:', invoiceNumber);

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: invoiceData.customer_id,
        due_date: invoiceData.due_date,
        notes: invoiceData.notes,
        created_by: user.id,
        status: 'draft',
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
      })
      .select(`
        *,
        customer:customers(id, name, email)
      `)
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      throw new Error('Kunne ikke opprette faktura: ' + invoiceError.message);
    }

    console.log('Created invoice:', invoice);

    // If work order IDs are provided, create line items from them
    if (invoiceData.work_order_ids && invoiceData.work_order_ids.length > 0) {
      await createLineItemsFromWorkOrders(invoice.id, invoiceData.work_order_ids);
    }

    return invoice as unknown as Invoice;
    
  } catch (error) {
    console.error('Full error creating invoice:', error);
    throw error;
  }
};

const createLineItemsFromWorkOrders = async (invoiceId: string, workOrderIds: string[]) => {
  // Fetch work orders with their related data
  const { data: workOrders, error } = await supabase
    .from('work_orders')
    .select(`
      id,
      title,
      description,
      price_value,
      pricing_model,
      actual_hours,
      work_order_materials(quantity, unit_price, material:materials(name)),
      work_order_equipment(actual_quantity, rate, equipment:equipment(name)),
      work_order_time_adjustments(id, extra_minutes, extra_cost, reason, adjustment_type)
    `)
    .in('id', workOrderIds);

  if (error) {
    throw new Error('Kunne ikke hente arbeidsordrer: ' + error.message);
  }

  const lineItems: any[] = [];

  for (const workOrder of workOrders || []) {
    // Main service line item
    lineItems.push({
      invoice_id: invoiceId,
      work_order_id: workOrder.id,
      description: `${workOrder.title} - ${workOrder.description || ''}`,
      quantity: 1,
      unit_price: workOrder.price_value || 0,
      line_total: workOrder.price_value || 0,
      item_type: 'service',
      reference_id: workOrder.id
    });

    // Materials
    if (workOrder.work_order_materials && Array.isArray(workOrder.work_order_materials)) {
      for (const material of workOrder.work_order_materials) {
        lineItems.push({
          invoice_id: invoiceId,
          work_order_id: workOrder.id,
          description: `Materiale: ${(material.material as any)?.name || 'Ukjent'}`,
          quantity: material.quantity || 0,
          unit_price: material.unit_price || 0,
          line_total: (material.quantity || 0) * (material.unit_price || 0),
          item_type: 'material',
          reference_id: null
        });
      }
    }

    // Equipment
    if (workOrder.work_order_equipment && Array.isArray(workOrder.work_order_equipment)) {
      for (const equipment of workOrder.work_order_equipment) {
        lineItems.push({
          invoice_id: invoiceId,
          work_order_id: workOrder.id,
          description: `Utstyr: ${(equipment.equipment as any)?.name || 'Ukjent'}`,
          quantity: equipment.actual_quantity || 0,
          unit_price: equipment.rate || 0,
          line_total: (equipment.actual_quantity || 0) * (equipment.rate || 0),
          item_type: 'equipment',
          reference_id: null
        });
      }
    }

    // Time adjustments
    if (workOrder.work_order_time_adjustments && Array.isArray(workOrder.work_order_time_adjustments)) {
      for (const adjustment of workOrder.work_order_time_adjustments) {
        lineItems.push({
          invoice_id: invoiceId,
          work_order_id: workOrder.id,
          description: `Tillegg: ${adjustment.reason} (${adjustment.adjustment_type})`,
          quantity: 1,
          unit_price: adjustment.extra_cost || 0,
          line_total: adjustment.extra_cost || 0,
          item_type: 'extra_time',
          reference_id: adjustment.id
        });
      }
    }
  }

  // Insert all line items if there are any
  if (lineItems.length > 0) {
    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItems);

    if (lineItemsError) {
      throw new Error('Kunne ikke opprette fakturalinjer: ' + lineItemsError.message);
    }

    // Update invoice totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = subtotal * 0.25; // 25% MVA
    const totalAmount = subtotal + taxAmount;

    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount
      })
      .eq('id', invoiceId);

    if (updateError) {
      throw new Error('Kunne ikke oppdatere fakturatotaler: ' + updateError.message);
    }
  }
};

const updateInvoiceStatus = async (id: string, status: Invoice['status']): Promise<Invoice> => {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('id', id)
    .select(`
      *,
      customer:customers(id, name, email)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as Invoice;
};

// Query keys
const QUERY_KEYS = {
  invoices: ['invoices'] as const,
  invoice: (id: string) => ['invoices', id] as const,
};

// Hooks
export const useInvoices = () => {
  return useQuery({
    queryKey: QUERY_KEYS.invoices,
    queryFn: fetchInvoices,
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.invoice(id),
    queryFn: () => fetchInvoice(id),
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      toast({
        title: "Faktura opprettet",
        description: "Fakturaen ble opprettet successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Feil ved oppretting",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Invoice['status'] }) =>
      updateInvoiceStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoice(data.id) });
      toast({
        title: "Status oppdatert",
        description: "Fakturastatus ble oppdatert successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Feil ved oppdatering",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};