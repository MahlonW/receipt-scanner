import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [MERGE-EXCEL] Starting Excel merge`);
  
  try {
    const { files }: { files: ArrayBuffer[] } = await request.json();
    
    console.log(`[${requestId}] [MERGE-EXCEL] Merging ${files.length} Excel files`);
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return Response.json({ error: 'No files provided for merging' }, { status: 400 });
    }

    // Start with the first file as the base workbook
    const mergedWorkbook = XLSX.read(files[0], { type: 'buffer' });
    console.log(`[${requestId}] [MERGE-EXCEL] Base workbook has ${mergedWorkbook.SheetNames.length} sheets`);
    
    // Track our app-specific sheets to merge
    const appSheets = ['Products', 'Summary', 'Settings'];
    const mergedProducts: Record<string, unknown>[] = [];
    const mergedSummary: Record<string, unknown>[] = [];
    let mergedSettings: Record<string, unknown>[] = [];
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const fileBuffer = files[i];
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      console.log(`[${requestId}] [MERGE-EXCEL] Processing file ${i + 1} with ${workbook.SheetNames.length} sheets`);
      
      // Merge our app-specific sheets
      for (const sheetName of appSheets) {
        if (workbook.SheetNames.includes(sheetName)) {
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
          
          if (sheetName === 'Products') {
            mergedProducts.push(...data);
          } else if (sheetName === 'Summary') {
            mergedSummary.push(...data);
          } else if (sheetName === 'Settings') {
            // For settings, we'll use the most recent one (last file wins)
            mergedSettings = data;
          }
        }
      }
      
      // Preserve all non-app sheets from each file
      for (const sheetName of workbook.SheetNames) {
        if (!appSheets.includes(sheetName)) {
          // Check if this sheet already exists in merged workbook
          if (mergedWorkbook.SheetNames.includes(sheetName)) {
            // Sheet exists, append data or create a numbered version
            let newSheetName = sheetName;
            let counter = 1;
            while (mergedWorkbook.SheetNames.includes(newSheetName)) {
              newSheetName = `${sheetName}_${counter}`;
              counter++;
            }
            
            // Copy the sheet with the new name
            mergedWorkbook.Sheets[newSheetName] = workbook.Sheets[sheetName];
            mergedWorkbook.SheetNames.push(newSheetName);
            console.log(`[${requestId}] [MERGE-EXCEL] Preserved sheet '${sheetName}' as '${newSheetName}'`);
          } else {
            // Sheet doesn't exist, add it directly
            mergedWorkbook.Sheets[sheetName] = workbook.Sheets[sheetName];
            mergedWorkbook.SheetNames.push(sheetName);
            console.log(`[${requestId}] [MERGE-EXCEL] Preserved sheet '${sheetName}'`);
          }
        }
      }
    }
    
    // Update our app-specific sheets in the merged workbook
    if (mergedProducts.length > 0) {
      const productsSheet = XLSX.utils.json_to_sheet(mergedProducts);
      productsSheet['!cols'] = [
        { wch: 8 },   // Item #
        { wch: 30 },  // Product Name
        { wch: 12 },  // Price
        { wch: 10 },  // Quantity
        { wch: 15 },  // Category
        { wch: 40 },  // Description
        { wch: 12 }   // Total
      ];
      
      if (mergedWorkbook.SheetNames.includes('Products')) {
        mergedWorkbook.Sheets['Products'] = productsSheet;
      } else {
        XLSX.utils.book_append_sheet(mergedWorkbook, productsSheet, 'Products');
      }
    }
    
    if (mergedSummary.length > 0) {
      const summarySheet = XLSX.utils.json_to_sheet(mergedSummary);
      summarySheet['!cols'] = [{ wch: 15 }, { wch: 20 }];
      
      if (mergedWorkbook.SheetNames.includes('Summary')) {
        mergedWorkbook.Sheets['Summary'] = summarySheet;
      } else {
        XLSX.utils.book_append_sheet(mergedWorkbook, summarySheet, 'Summary');
      }
    }
    
    if (mergedSettings.length > 0) {
      const settingsSheet = XLSX.utils.json_to_sheet(mergedSettings);
      settingsSheet['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 60 }];
      
      if (mergedWorkbook.SheetNames.includes('Settings')) {
        mergedWorkbook.Sheets['Settings'] = settingsSheet;
      } else {
        XLSX.utils.book_append_sheet(mergedWorkbook, settingsSheet, 'Settings');
      }
      
      // Hide the Settings sheet
      if (!mergedWorkbook.Workbook) mergedWorkbook.Workbook = {};
      if (!mergedWorkbook.Workbook.Sheets) mergedWorkbook.Workbook.Sheets = [];
      
      const settingsIndex = mergedWorkbook.SheetNames.indexOf('Settings');
      if (settingsIndex !== -1) {
        while (mergedWorkbook.Workbook.Sheets.length <= settingsIndex) {
          mergedWorkbook.Workbook.Sheets.push({});
        }
        mergedWorkbook.Workbook.Sheets[settingsIndex].Hidden = 1;
      }
    }
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(mergedWorkbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      compression: true
    });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`[${requestId}] [MERGE-EXCEL] Merge completed in ${processingTime}ms`);
    console.log(`[${requestId}] [MERGE-EXCEL] Final workbook has ${mergedWorkbook.SheetNames.length} sheets: ${mergedWorkbook.SheetNames.join(', ')}`);
    
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="merged-receipts.xlsx"',
        'X-Processing-Time': processingTime.toString(),
        'X-Request-ID': requestId,
      },
    });
    
  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.error(`[${requestId}] [MERGE-EXCEL] Error after ${processingTime}ms:`, error);
    
    return Response.json(
      { 
        error: 'Failed to merge Excel files',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        processingTime
      }, 
      { status: 500 }
    );
  }
}

