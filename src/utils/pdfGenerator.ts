import { jsPDF } from 'jspdf';

interface InvoicePDFData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  customer: {
    name: string;
    email?: string;
    address?: string;
    contact_person?: string;
  };
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    item_type: string;
  }>;
}

export const generateInvoicePDF = (invoice: InvoicePDFData): void => {
  console.log('Generating PDF for invoice:', invoice);
  console.log('Line items:', invoice.line_items);
  console.log('Totals:', { 
    subtotal: invoice.subtotal, 
    tax_amount: invoice.tax_amount, 
    total_amount: invoice.total_amount 
  });

  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Company header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('ASCO Group', 20, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Arbeidsordresystem', 20, 40);
  
  // Invoice title
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('FAKTURA', 150, 30);
  
  // Invoice number and dates
  doc.setFontSize(12);
  doc.text(`Fakturanr: ${invoice.invoice_number}`, 150, 45);
  doc.text(`Utstedelsesdato: ${new Date(invoice.issue_date).toLocaleDateString('nb-NO')}`, 150, 55);
  doc.text(`Forfallsdato: ${new Date(invoice.due_date).toLocaleDateString('nb-NO')}`, 150, 65);
  
  // Customer information
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Faktureres til:', 20, 80);
  
  doc.setFontSize(12);
  let yPos = 90;
  doc.text(invoice.customer.name, 20, yPos);
  
  if (invoice.customer.contact_person) {
    yPos += 8;
    doc.text(`Attn: ${invoice.customer.contact_person}`, 20, yPos);
  }
  
  if (invoice.customer.address) {
    yPos += 8;
    doc.text(invoice.customer.address, 20, yPos);
  }
  
  if (invoice.customer.email) {
    yPos += 8;
    doc.text(invoice.customer.email, 20, yPos);
  }
  
  // Line items table
  const tableStartY = yPos + 20;
  
  // Table headers
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(60, 60, 60);
  doc.rect(20, tableStartY, 170, 8, 'F');
  
  doc.text('Beskrivelse', 22, tableStartY + 6);
  doc.text('Antall', 120, tableStartY + 6);
  doc.text('Enhetspris', 140, tableStartY + 6);
  doc.text('Total', 170, tableStartY + 6);
  
  // Table rows
  doc.setTextColor(40, 40, 40);
  let currentY = tableStartY + 12;
  
  // Handle empty line items
  if (!invoice.line_items || invoice.line_items.length === 0) {
    doc.setFontSize(10);
    doc.text('Ingen linjevarer funnet for denne fakturaen.', 22, currentY);
    currentY += 15;
  } else {
    invoice.line_items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    
    if (isEven) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY - 4, 170, 8, 'F');
    }
    
    // Wrap long descriptions
    const maxWidth = 95;
    const splitDescription = doc.splitTextToSize(item.description, maxWidth);
    const lineHeight = 6;
    
    doc.text(splitDescription, 22, currentY);
    doc.text(item.quantity.toString(), 120, currentY);
    doc.text(`kr ${item.unit_price.toFixed(2)}`, 140, currentY);
    doc.text(`kr ${item.line_total.toFixed(2)}`, 170, currentY);
    
    currentY += Math.max(splitDescription.length * lineHeight, 8);
    });
  }
  
  // Totals
  const totalsY = currentY + 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(120, totalsY, 190, totalsY);
  
  doc.setFontSize(10);
  doc.text('Subtotal:', 120, totalsY + 10);
  doc.text(`kr ${invoice.subtotal.toFixed(2)}`, 170, totalsY + 10);
  
  doc.text('MVA (25%):', 120, totalsY + 18);
  doc.text(`kr ${invoice.tax_amount.toFixed(2)}`, 170, totalsY + 18);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 120, totalsY + 28);
  doc.text(`kr ${invoice.total_amount.toFixed(2)}`, 170, totalsY + 28);
  
  // Notes
  if (invoice.notes) {
    const notesY = totalsY + 45;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Notater:', 20, notesY);
    
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, notesY + 8);
  }
  
  // Footer
  const footerY = 270;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Takk for din bestilling!', 20, footerY);
  doc.text(`Status: ${getStatusText(invoice.status)}`, 20, footerY + 6);
  
  // Save the PDF
  doc.save(`faktura-${invoice.invoice_number}.pdf`);
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'draft': return 'Utkast';
    case 'sent': return 'Sendt';
    case 'paid': return 'Betalt';
    case 'overdue': return 'Forfalt';
    case 'cancelled': return 'Kansellert';
    default: return status;
  }
};
