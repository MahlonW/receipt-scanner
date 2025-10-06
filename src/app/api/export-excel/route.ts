import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { ReceiptData } from '@/types/product';
import { APP_CONFIG } from '@/config';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [EXPORT-EXCEL] Starting Excel export`);
  
  try {
    const { receipts, existingWorkbook }: { receipts: ReceiptData[]; existingWorkbook?: ArrayBuffer } = await request.json();
    
    console.log(`[${requestId}] [EXPORT-EXCEL] Exporting ${receipts.length} receipts`);
    
    if (!receipts || !Array.isArray(receipts)) {
      return Response.json({ error: 'Invalid receipts data' }, { status: 400 });
    }

    // Create a new workbook or use existing one
    let workbook;
    if (existingWorkbook) {
      // Parse existing workbook to preserve all existing sheets
      workbook = XLSX.read(existingWorkbook, { type: 'buffer' });
      console.log(`[${requestId}] [EXPORT-EXCEL] Preserving existing workbook with ${workbook.SheetNames.length} sheets`);
    } else {
      // Create a new workbook
      workbook = XLSX.utils.book_new();
    }

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

    // Create or update products worksheet (preserve existing if it exists)
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

    // Only update our specific sheets, preserve all others
    if (workbook.SheetNames.includes('Products')) {
      workbook.Sheets['Products'] = productsSheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
    }

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
    
    // Only update our specific sheets, preserve all others
    if (workbook.SheetNames.includes('Summary')) {
      workbook.Sheets['Summary'] = summarySheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }

    // Create settings worksheet
    const settingsData = [
      { 'Setting': 'Custom Categories', 'Value': 'food, work, home, furniture, electronics, clothing, health, entertainment, travel, other', 'Description': 'Comma-separated list of custom categories for AI to use when analyzing receipts' },
      { 'Setting': 'Default Currency', 'Value': 'Dollar', 'Description': 'Default currency symbol for price formatting' },
      { 'Setting': 'Date Format', 'Value': 'MM/DD/YYYY', 'Description': 'Preferred date format for receipt dates' },
      { 'Setting': 'Tax Rate', 'Value': '0.00', 'Description': 'Default tax rate (as decimal, e.g., 0.08 for 8%)' },
      { 'Setting': 'Auto-categorize', 'Value': 'true', 'Description': 'Whether to automatically categorize products using AI' },
      { 'Setting': 'Include Descriptions', 'Value': 'true', 'Description': 'Whether to generate product descriptions using AI' },
      { 'Setting': 'Duplicate Detection', 'Value': 'true', 'Description': 'Whether to detect and mark duplicate receipts' },
      { 'Setting': 'Export Format', 'Value': 'detailed', 'Description': 'Export format: detailed, summary, or minimal' },
      { 'Setting': 'Receipt Scanner Version', 'Value': APP_CONFIG.VERSION, 'Description': 'Version of the receipt scanner application' }
    ];

    const settingsSheet = XLSX.utils.json_to_sheet(settingsData);
    settingsSheet['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 60 }];
    
    // Only update our specific sheets, preserve all others
    if (workbook.SheetNames.includes('Settings')) {
      workbook.Sheets['Settings'] = settingsSheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');
    }

    // Hide the Settings sheet using SheetJS visibility feature
    // Reference: https://docs.sheetjs.com/docs/csf/features/visibility
    if (!workbook.Workbook) workbook.Workbook = {};
    if (!workbook.Workbook.Sheets) workbook.Workbook.Sheets = [];
    
    // Find the Settings sheet index
    const settingsIndex = workbook.SheetNames.indexOf('Settings');
    if (settingsIndex !== -1) {
      // Ensure the metadata array is large enough
      while (workbook.Workbook.Sheets.length <= settingsIndex) {
        workbook.Workbook.Sheets.push({});
      }
      
      // Set the Settings sheet as hidden (value 1 = Hidden)
      // This makes it accessible via "Unhide" menu but not visible by default
      workbook.Workbook.Sheets[settingsIndex].Hidden = 1;
    }

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
