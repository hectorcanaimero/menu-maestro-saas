/**
 * Export Utilities
 *
 * Provides functions to export data to CSV and PDF formats
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Export data to CSV format
 *
 * @param data - Array of objects to export
 * @param filename - Base filename (date will be appended)
 * @param headers - Optional custom headers (defaults to object keys)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Use provided headers or extract from first object
  const headerKeys = headers || Object.keys(data[0]);

  // Create CSV content
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headerKeys.join(','));

  // Add data rows
  data.forEach(row => {
    const values = headerKeys.map(key => {
      const value = row[key];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Convert to string
      let strValue = String(value);

      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        strValue = `"${strValue.replace(/"/g, '""')}"`;
      }

      return strValue;
    });

    csvRows.push(values.join(','));
  });

  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Column definition for PDF export
 */
export interface PDFColumn {
  header: string;
  dataKey: string;
  width?: number;
}

/**
 * Options for PDF export
 */
export interface PDFExportOptions {
  title: string;
  storeName?: string;
  subtitle?: string;
  filename: string;
  columns: PDFColumn[];
  data: Record<string, unknown>[];
  orientation?: 'portrait' | 'landscape';
  showFooter?: boolean;
}

/**
 * Export data to PDF format with professional styling
 *
 * @param options - PDF export configuration
 */
export function exportToPDF(options: PDFExportOptions): void {
  const {
    title,
    storeName,
    subtitle,
    filename,
    columns,
    data,
    orientation = 'portrait',
    showFooter = true
  } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  // Header section
  let yPosition = 20;

  // Store name (if provided)
  if (storeName) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, 14, yPosition);
    yPosition += 7;
  }

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, yPosition);
  yPosition += 7;

  // Subtitle (if provided)
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(subtitle, 14, yPosition);
    yPosition += 6;
  }

  // Generated date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(
    `Generado: ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`,
    14,
    yPosition
  );
  yPosition += 10;

  // Reset text color
  doc.setTextColor(0);

  // Table
  autoTable(doc, {
    startY: yPosition,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] ?? '-')),
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
    margin: { top: yPosition, left: 14, right: 14 },
  });

  // Footer (if enabled)
  if (showFooter) {
    const pageCount = (doc as any).internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  }

  // Save PDF
  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Format date for export
 */
export function formatDateForExport(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
}

/**
 * Prepare orders data for export
 */
export function prepareOrdersForExport(orders: Array<{
  id?: string;
  created_at?: string | null;
  customer_name?: string;
  customer_phone?: string | null;
  total_amount?: number;
  status?: string;
  order_items?: Array<{ quantity: number }>;
}>) {
  return orders.map(order => ({
    'Número': `#${order.id?.slice(0, 8) || 'N/A'}`,
    'Fecha': order.created_at ? formatDateForExport(order.created_at) : 'N/A',
    'Cliente': order.customer_name || 'N/A',
    'Teléfono': order.customer_phone || 'N/A',
    'Total': formatCurrencyForExport(order.total_amount || 0),
    'Estado': order.status || 'N/A',
    'Productos': order.order_items?.reduce((sum: number, item) => sum + item.quantity, 0) || 0,
  }));
}

/**
 * Prepare sales summary for export
 */
export function prepareSalesSummaryForExport(stats: {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  averageDailySales: number;
  period: string;
}) {
  return [
    { 'Métrica': 'Total de Ventas', 'Valor': formatCurrencyForExport(stats.totalSales) },
    { 'Métrica': 'Total de Pedidos', 'Valor': stats.totalOrders.toString() },
    { 'Métrica': 'Productos Vendidos', 'Valor': stats.totalProducts.toString() },
    { 'Métrica': 'Promedio Diario', 'Valor': formatCurrencyForExport(stats.averageDailySales) },
    { 'Métrica': 'Período', 'Valor': stats.period },
  ];
}

/**
 * Prepare top products for export
 */
export function prepareTopProductsForExport(products: Array<{ name: string; quantity: number; revenue: number }>) {
  return products.map((product, index) => ({
    'Ranking': (index + 1).toString(),
    'Producto': product.name,
    'Cantidad Vendida': product.quantity.toString(),
    'Ingresos': formatCurrencyForExport(product.revenue),
  }));
}
