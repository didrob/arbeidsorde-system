import { jsPDF } from 'jspdf';
import type { SalesOrder, SalesOrderLine } from '@/hooks/useSalesOrders';

function sanitize(val: any): string {
  if (val == null) return '';
  return String(val).replace(/;/g, ',');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

// ── CSV Export ──────────────────────────────────────────
export function exportSalesOrderCSV(
  salesOrder: SalesOrder,
  lines: SalesOrderLine[],
) {
  const customerName = salesOrder.customers?.name || 'Ukjent';
  const orgNumber = salesOrder.customers?.org_number || '';

  const headers = [
    'Salgsordrenr', 'Kundenavn', 'Kundenr (org.nr)', 'Linjenr',
    'Beskrivelse', 'Type', 'Antall', 'Enhetspris',
    'MVA-sats (%)', 'MVA-beløp', 'Linjetotal',
  ];

  const rows = lines.map((line, i) => [
    sanitize(salesOrder.sales_order_number),
    sanitize(customerName),
    sanitize(orgNumber),
    String(i + 1),
    sanitize(line.description),
    sanitize(line.item_type || ''),
    formatCurrency(line.quantity),
    formatCurrency(line.unit_price),
    formatCurrency(line.vat_rate),
    formatCurrency(line.vat_amount),
    formatCurrency(line.line_total),
  ]);

  // Total row
  rows.push([
    '', '', '', '', '', '', '', '',
    'TOTAL',
    formatCurrency(salesOrder.tax_amount),
    formatCurrency(salesOrder.total_amount),
  ]);

  const BOM = '\uFEFF';
  const csv = BOM + [headers, ...rows].map(r => r.join(';')).join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const period = salesOrder.period_from ? salesOrder.period_from.substring(0, 7) : 'udatert';
  const safeName = customerName.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '_');
  a.href = url;
  a.download = `${salesOrder.sales_order_number}_${safeName}_${period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF Export ──────────────────────────────────────────
export function exportSalesOrderPDF(
  salesOrder: SalesOrder,
  lines: SalesOrderLine[],
) {
  const doc = new jsPDF();
  const customerName = salesOrder.customers?.name || 'Ukjent';
  const customerAddress = salesOrder.customers?.address || '';
  const customerEmail = salesOrder.customers?.email || '';
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ASCO', 14, y);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Salgsordre', 14, y + 8);
  y += 20;

  // SO info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(salesOrder.sales_order_number, 14, y);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const period = [salesOrder.period_from, salesOrder.period_to].filter(Boolean).join(' — ');
  if (period) doc.text(`Periode: ${period}`, 14, y + 6);
  doc.text(`Status: ${salesOrder.status}`, 14, y + 12);
  y += 22;

  // Customer
  doc.setFont('helvetica', 'bold');
  doc.text('Kunde:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(customerName, 50, y);
  if (customerAddress) { y += 5; doc.text(customerAddress, 50, y); }
  if (customerEmail) { y += 5; doc.text(customerEmail, 50, y); }
  y += 12;

  // Group lines by item_type
  const groups = new Map<string, SalesOrderLine[]>();
  for (const line of lines) {
    const type = line.item_type || 'Annet';
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type)!.push(line);
  }

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y - 4, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Beskrivelse', 16, y);
  doc.text('Antall', 110, y);
  doc.text('Enhetspris', 130, y);
  doc.text('MVA', 155, y);
  doc.text('Total', 175, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  const typeLabels: Record<string, string> = {
    hourly: 'Timebasert', fixed: 'Fastpris', material_only: 'Kun materiell',
  };

  for (const [type, groupLines] of groups) {
    // Type header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(typeLabels[type] || type, 16, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    for (const line of groupLines) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(line.description.substring(0, 50), 16, y);
      doc.text(formatCurrency(line.quantity), 110, y);
      doc.text(formatCurrency(line.unit_price), 130, y);
      doc.text(`${line.vat_rate}%`, 155, y);
      doc.text(formatCurrency(line.line_total), 175, y);
      y += 5;
    }
    y += 3;
  }

  // Totals
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 6;
  doc.setFontSize(9);
  doc.text('Subtotal:', 130, y);
  doc.text(`kr ${formatCurrency(salesOrder.subtotal)}`, 165, y);
  y += 6;
  doc.text('MVA (25%):', 130, y);
  doc.text(`kr ${formatCurrency(salesOrder.tax_amount)}`, 165, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', 130, y);
  doc.text(`kr ${formatCurrency(salesOrder.total_amount)}`, 165, y);

  const period2 = salesOrder.period_from ? salesOrder.period_from.substring(0, 7) : 'udatert';
  const safeName = customerName.replace(/[^a-zA-Z0-9æøåÆØÅ]/g, '_');
  doc.save(`${salesOrder.sales_order_number}_${safeName}_${period2}.pdf`);
}
