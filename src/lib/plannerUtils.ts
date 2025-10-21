import { Personnel, WorkOrder } from '@/types';

export function calculateAllocatedHours(
  personnelId: string,
  orders: WorkOrder[],
  date: Date
): number {
  return orders
    .filter(order => {
      if (!order.scheduled_start || !order.scheduled_end) return false;
      
      const orderDate = new Date(order.scheduled_start);
      return orderDate.toDateString() === date.toDateString();
    })
    .filter(order => 
      order.personnel?.some(p => p.personnel_id === personnelId)
    )
    .reduce((sum, order) => {
      const start = new Date(order.scheduled_start!);
      const end = new Date(order.scheduled_end!);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
}

export function getUtilizationColor(utilization: number): string {
  if (utilization < 30) return 'success';
  if (utilization < 100) return 'warning';
  return 'destructive';
}

export function getUtilizationBgClass(utilization: number): string {
  if (utilization < 30) return 'bg-success/10 border-success/30';
  if (utilization < 100) return 'bg-warning/10 border-warning/30';
  return 'bg-destructive/10 border-destructive/30';
}

export function getUtilizationTextClass(utilization: number): string {
  if (utilization < 30) return 'text-success';
  if (utilization < 100) return 'text-warning';
  return 'text-destructive';
}

export function getUtilizationIcon(utilization: number): string {
  if (utilization < 30) return '🟢';
  if (utilization < 100) return '🟡';
  return '🔴';
}

export interface ResourceWithUtilization extends Personnel {
  allocatedHours: number;
  capacity: number;
  utilization: number;
  allocatedOrders: WorkOrder[];
}

export function groupResourcesByUtilization(
  personnel: Personnel[],
  orders: WorkOrder[],
  date: Date
) {
  const resourcesWithUtilization: ResourceWithUtilization[] = personnel.map(person => {
    const allocatedHours = calculateAllocatedHours(person.id, orders, date);
    const capacity = person.daily_capacity_hours || 7.5;
    const utilization = capacity > 0 ? (allocatedHours / capacity) * 100 : 0;
    const allocatedOrders = orders.filter(o => 
      o.personnel?.some(p => p.personnel_id === person.id)
    );
    
    return {
      ...person,
      allocatedHours,
      capacity,
      utilization,
      allocatedOrders,
    };
  });
  
  return {
    available: resourcesWithUtilization.filter(r => r.utilization < 30),
    partial: resourcesWithUtilization.filter(r => r.utilization >= 30 && r.utilization < 100),
    fullyBooked: resourcesWithUtilization.filter(r => r.utilization >= 100),
  };
}
