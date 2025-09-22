import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePDF } from '@/utils/pdfGenerator';

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
  // Fetch invoices with line items using correct FK
  const { data: invoicesData, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name, email),
      line_items:invoice_line_items!fk_invoice_line_items_invoice_id(*)
    `)
    .order('created_at', { ascending: false });

  if (invoicesError) {
    throw new Error(invoicesError.message);
  }

  return (invoicesData || []) as unknown as Invoice[];
};

const fetchInvoice = async (id: string): Promise<Invoice> => {
  // Fetch invoice with line items using correct FK
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(id, name, email, address, contact_person),
      line_items:invoice_line_items!fk_invoice_line_items_invoice_id(*)
    `)
    .eq('id', id)
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  if (!invoiceData) {
    throw new Error('Faktura ikke funnet');
  }

  return invoiceData as unknown as Invoice;
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
  try {
    // Fetch work orders with basic data only (avoid problematic relations for now)
    const { data: workOrders, error } = await supabase
      .from('work_orders')
      .select(`
        id,
        title,
        description,
        price_value,
        pricing_type,
        actual_hours
      `)
      .in('id', workOrderIds);

    if (error) {
      console.error('Work orders fetch error:', error);
      throw new Error('Kunne ikke hente arbeidsordrer: ' + error.message);
    }

    console.log('Fetched work orders for invoice:', workOrders);

    const lineItems: any[] = [];

    for (const workOrder of workOrders || []) {
      console.log('Processing work order:', workOrder);
      
      // Calculate price based on pricing type
      let unitPrice = 0;
      let description = `${workOrder.title}${workOrder.description ? ' - ' + workOrder.description : ''}`;
      // Annotate fixed price in description for clarity on invoice
      if (workOrder.pricing_type === 'fixed') {
        description += ' (Fastpris)';
      }
      
      if (workOrder.price_value && workOrder.price_value > 0) {
        unitPrice = workOrder.price_value;
      } else if (workOrder.pricing_type === 'hourly' && workOrder.actual_hours) {
        // For hourly pricing without fixed price, we need a default hourly rate
        // This should ideally come from a settings table or be configurable
        const defaultHourlyRate = 800; // Default rate per hour
        unitPrice = workOrder.actual_hours * defaultHourlyRate;
        description += ` (${workOrder.actual_hours} timer @ kr ${defaultHourlyRate}/time)`;
      } else {
        console.warn('Work order has no price_value:', workOrder);
        // Still create a line item but with 0 value
        description += ' (Pris ikke satt)';
      }

      // Main service line item
      lineItems.push({
        invoice_id: invoiceId,
        work_order_id: workOrder.id,
        description: description,
        quantity: 1,
        unit_price: unitPrice,
        line_total: unitPrice,
        item_type: 'service',
        reference_id: workOrder.id
      });
    }

    console.log('Created line items:', lineItems);

    // Insert all line items if there are any
    if (lineItems.length > 0) {
      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems);

      if (lineItemsError) {
        console.error('Line items insertion error:', lineItemsError);
        throw new Error('Kunne ikke opprette fakturalinjer: ' + lineItemsError.message);
      }

      console.log('Inserted line items successfully');

      // Update invoice totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
      const taxAmount = subtotal * 0.25; // 25% MVA
      const totalAmount = subtotal + taxAmount;

      console.log('Updating invoice totals:', { subtotal, taxAmount, totalAmount });

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Invoice totals update error:', updateError);
        throw new Error('Kunne ikke oppdatere fakturatotaler: ' + updateError.message);
      }

      console.log('Updated invoice totals successfully');
    }
  } catch (error) {
    console.error('Error in createLineItemsFromWorkOrders:', error);
    throw error;
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

// Add update invoice functionality
const updateInvoice = async (invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> => {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)
    .select(`
      *,
      customer:customers(id, name, email),
      line_items:invoice_line_items!fk_invoice_line_items_invoice_id(*)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as Invoice;
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Invoice> }) =>
      updateInvoice(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoice(data.id) });
      toast({
        title: "Faktura oppdatert",
        description: "Fakturaen ble oppdatert successfully.",
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

export const useDownloadInvoicePDF = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // Fetch the complete invoice data
      const invoice = await fetchInvoice(invoiceId);
      
      // Generate and download PDF
      generateInvoicePDF(invoice);
      
      return invoice;
    },
    onSuccess: (invoice) => {
      toast({
        title: "PDF lastet ned",
        description: `Faktura ${invoice.invoice_number} ble lastet ned som PDF.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Feil ved PDF-generering",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};