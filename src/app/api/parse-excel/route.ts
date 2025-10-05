import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { ReceiptData } from '@/types/product';
import { processReceipts } from '@/utils/receiptUtils';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [PARSE-EXCEL] Starting Excel file parsing`);
  
  try {
    const formData = await request.formData();
    const excelFile = formData.get('excel') as File;
    
    console.log(`[${requestId}] [PARSE-EXCEL] File: ${excelFile?.name}, size: ${excelFile?.size} bytes`);
    
    if (!excelFile) {
      return Response.json({ error: 'No Excel file provided' }, { status: 400 });
    }

    // Read the Excel file
    const buffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first worksheet (Products sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Group products by receipt
    const receipts: ReceiptData[] = [];
    const receiptMap = new Map<string, ReceiptData>();
    let currentReceipt: ReceiptData | null = null;
    
    for (const row of jsonData as Record<string, unknown>[]) {
      const productName = String(row['Product Name'] || '');
      
      // Check if this is a receipt header (starts with "===")
      if (productName.includes('===')) {
        // Extract store and date from header like "=== Store Name - Date ==="
        const headerMatch = productName.match(/=== (.+?) - (.+?) ===/);
        if (headerMatch) {
          const store = headerMatch[1].trim();
          const date = headerMatch[2].trim();
          const receiptId = `${store}-${date}`;
          
          if (!receiptMap.has(receiptId)) {
            currentReceipt = {
              products: [],
              total: 0,
              store: store,
              date: date,
              subtotal: 0,
              tax: 0
            };
            receiptMap.set(receiptId, currentReceipt);
          } else {
            currentReceipt = receiptMap.get(receiptId)!;
          }
        }
        continue;
      }
      
      // Check if this is a total row
      if (productName === 'TOTAL:' && currentReceipt) {
        currentReceipt.total = parseFloat(String(row['Total'] || '0')) || 0;
        continue;
      }
      
      // Check if this is a subtotal row
      if (productName === 'Subtotal:' && currentReceipt) {
        currentReceipt.subtotal = parseFloat(String(row['Total'] || '0')) || 0;
        continue;
      }
      
      // Check if this is a tax row
      if (productName === 'Tax:' && currentReceipt) {
        currentReceipt.tax = parseFloat(String(row['Total'] || '0')) || 0;
        continue;
      }
      
      // Skip empty rows or non-product rows
      if (!productName || productName === '' || productName.includes('ID:') || productName.includes('Source:')) {
        continue;
      }
      
      // This should be a product row
      if (currentReceipt && productName && !isNaN(parseFloat(String(row['Price'] || '0')))) {
        currentReceipt.products.push({
          name: productName,
          price: parseFloat(String(row['Price'] || '0')) || 0,
          quantity: parseInt(String(row['Quantity'] || '1')) || 1,
          category: String(row['Category'] || 'N/A'),
          description: String(row['Description'] || 'N/A')
        });
      }
    }
    
    // Finalize receipts and add to results
    for (const receipt of receiptMap.values()) {
      // If we didn't parse totals from the Excel, calculate them
      if (receipt.total === 0) {
        receipt.subtotal = receipt.products.reduce((sum, product) => 
          sum + (product.price * (product.quantity || 1)), 0
        );
        receipt.total = receipt.subtotal + (receipt.tax || 0);
      }
      receipts.push(receipt);
    }
    
    // Process receipts to assign IDs and mark as from Excel
    const processedReceipts = processReceipts(receipts, 'excel');
    
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [PARSE-EXCEL] Excel parsing completed successfully in ${duration}ms`);
    console.log(`[${requestId}] [PARSE-EXCEL] Parsed ${processedReceipts.length} receipts from Excel file`);
    
    return Response.json(processedReceipts);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] [PARSE-EXCEL] Error after ${duration}ms:`, error);
    return Response.json(
      { error: 'Failed to parse Excel file' },
      { status: 500 }
    );
  }
}
