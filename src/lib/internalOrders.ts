// Internal order utilities for F1.5

export const COST_CENTERS = [
  'Intern drift',
  'Vedlikehold utstyr',
  'Klargjøring',
  'Annet',
] as const;

export type CostCenter = typeof COST_CENTERS[number];

export function isInternalOrder(order: { is_internal?: boolean }): boolean {
  return order.is_internal === true;
}

export function isInternalCustomer(customer: { registered_by?: string | null; name?: string }): boolean {
  return customer.registered_by === 'system' && customer.name === 'ASCO Intern';
}

export function getInternalCustomerForSite(
  customers: { id: string; site_id?: string | null; registered_by?: string | null; name: string }[],
  siteId: string | null | undefined
): { id: string; name: string } | undefined {
  if (!siteId) return undefined;
  return customers.find(
    c => c.site_id === siteId && c.registered_by === 'system' && c.name === 'ASCO Intern'
  );
}
