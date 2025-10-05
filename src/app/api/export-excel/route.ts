import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { ReceiptData } from '@/types/product';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [EXPORT-EXCEL] Starting Excel export`);
  
  try {
    const { receipts }: { receipts: ReceiptData[] } = await request.json();
    
    console.log(`[${requestId}] [EXPORT-EXCEL] Exporting ${receipts.length} receipts`);
    
    if (!receipts || !Array.isArray(receipts)) {
      return Response.json({ error: 'Invalid receipts data' }, { status: 400 });
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Prepare products data for Excel from all receipts
    const productsData: Record<string, string | number>[] = [];
    let itemCounter = 1;
    
    for (const receipt of receipts) {
      // Add receipt header with ID and source info
      const headerText = `=== ${receipt.store || 'Unknown Store'} - ${receipt.date || 'Unknown Date'} ===`;
      const idText = `ID: ${receipt.id || 'N/A'} | Source: ${receipt.source || 'unknown'}`;
      const duplicateText = receipt.duplicateOf ? ` | DUPLICATE of ${receipt.duplicateOf}` : '';
      
      productsData.push({
        'Item #': '',
        'Product Name': headerText,
        'Price': '',
        'Quantity': '',
        'Category': '',
        'Description': '',
        'Total': ''
      });
      
      productsData.push({
        'Item #': '',
        'Product Name': idText + duplicateText,
        'Price': '',
        'Quantity': '',
        'Category': '',
        'Description': '',
        'Total': ''
      });
      
      // Add products for this receipt
      for (const product of receipt.products) {
        productsData.push({
          'Item #': itemCounter++,
          'Product Name': product.name,
          'Price': product.price,
          'Quantity': product.quantity || 1,
          'Category': product.category || 'N/A',
          'Description': product.description || 'N/A',
          'Total': (product.price * (product.quantity || 1)).toFixed(2)
        });
      }
      
      // Add receipt totals
      productsData.push({
        'Item #': '',
        'Product Name': 'Subtotal:',
        'Price': '',
        'Quantity': '',
        'Category': '',
        'Description': '',
        'Total': receipt.subtotal?.toFixed(2) || '0.00'
      });
      
      if (receipt.tax) {
        productsData.push({
          'Item #': '',
          'Product Name': 'Tax:',
          'Price': '',
          'Quantity': '',
          'Category': '',
          'Description': '',
          'Total': receipt.tax.toFixed(2)
        });
      }
      
      productsData.push({
        'Item #': '',
        'Product Name': 'TOTAL:',
        'Price': '',
        'Quantity': '',
        'Category': '',
        'Description': '',
        'Total': receipt.total.toFixed(2)
      });
      
      // Add empty row between receipts
      productsData.push({
        'Item #': '',
        'Product Name': '',
        'Price': '',
        'Quantity': '',
        'Category': '',
        'Description': '',
        'Total': ''
      });
    }

    // Create products worksheet
    const productsSheet = XLSX.utils.json_to_sheet(productsData);
    
    // Set column widths
    const colWidths = [
      { wch: 8 },   // Item #
      { wch: 30 },  // Product Name
      { wch: 12 },  // Price
      { wch: 10 },  // Quantity
      { wch: 15 },  // Category
      { wch: 40 },  // Description
      { wch: 12 }   // Total
    ];
    productsSheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

    // Create summary worksheet
    const summaryData = [
      { 'Field': 'Total Receipts', 'Value': receipts.length },
      { 'Field': 'Total Items', 'Value': receipts.reduce((sum, r) => sum + r.products.length, 0) },
      { 'Field': 'Grand Total', 'Value': receipts.reduce((sum, r) => sum + r.total, 0).toFixed(2) },
      { 'Field': 'Total Tax', 'Value': receipts.reduce((sum, r) => sum + (r.tax || 0), 0).toFixed(2) },
      { 'Field': 'Total Subtotal', 'Value': receipts.reduce((sum, r) => sum + (r.subtotal || 0), 0).toFixed(2) }
    ];
    
    // Add individual receipt summaries
    for (const receipt of receipts) {
      summaryData.push(
        { 'Field': '', 'Value': '' },
        { 'Field': `Store: ${receipt.store || 'Unknown'}`, 'Value': '' },
        { 'Field': `Date: ${receipt.date || 'Unknown'}`, 'Value': '' },
        { 'Field': 'Items', 'Value': receipt.products.length },
        { 'Field': 'Subtotal', 'Value': receipt.subtotal?.toFixed(2) || '0.00' },
        { 'Field': 'Tax', 'Value': receipt.tax?.toFixed(2) || '0.00' },
        { 'Field': 'Total', 'Value': receipt.total.toFixed(2) }
      );
    }

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true 
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `receipts-${receipts.length}-receipts-${timestamp}.xlsx`;

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [EXPORT-EXCEL] Excel file generated successfully in ${duration}ms`);
    console.log(`[${requestId}] [EXPORT-EXCEL] File size: ${excelBuffer.length} bytes, filename: ${filename}`);

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [EXPORT-EXCEL] Error after ${duration}ms:`, error);
    return Response.json(
      { error: 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}
