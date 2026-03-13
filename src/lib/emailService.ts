import { supabase } from '@/integrations/supabase/client';

export type OrderEmailType = 'order_confirmation' | 'status_update' | 'quote_sent' | 'urgent_alert';

/**
 * Fire-and-forget email sender. Does not block UI.
 */
export function sendOrderEmail(
  type: OrderEmailType,
  workOrderId: string,
  extra?: Record<string, unknown>
) {
  supabase.functions
    .invoke('send-order-email', {
      body: { type, work_order_id: workOrderId, extra },
    })
    .then(({ error }) => {
      if (error) console.warn('[emailService] Failed to send email:', error.message);
    })
    .catch((err) => {
      console.warn('[emailService] Network error:', err);
    });
}
