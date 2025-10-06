import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { UserSettings } from '@/utils/settingsUtils';
import { APP_CONFIG } from '@/config';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] [EXPORT-SETTINGS] Starting settings export`);
  
  try {
    const { settings }: { settings: UserSettings } = await request.json();
    
    console.log(`[${requestId}] [EXPORT-SETTINGS] Exporting settings`);
    
    if (!settings) {
      return Response.json({ error: 'Invalid settings data' }, { status: 400 });
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Create settings worksheet
    const settingsData = [
      { 
        'Setting': 'Custom Categories', 
        'Value': settings.customCategories?.join(', ') || 'food, work, home, furniture, electronics, clothing, health, entertainment, travel, other', 
        'Description': 'Comma-separated list of custom categories for AI to use when analyzing receipts' 
      },
      { 
        'Setting': 'Default Currency', 
        'Value': settings.defaultCurrency || 'Dollar', 
        'Description': 'Default currency symbol for price formatting' 
      },
      { 
        'Setting': 'Date Format', 
        'Value': settings.dateFormat || 'MM/DD/YYYY', 
        'Description': 'Preferred date format for receipt dates' 
      },
      { 
        'Setting': 'Tax Rate', 
        'Value': ((settings.taxRate || 0) * 100).toFixed(2) + '%', 
        'Description': 'Default tax rate (as percentage)' 
      },
      { 
        'Setting': 'Auto-categorize', 
        'Value': (settings.autoCategorize !== false).toString(), 
        'Description': 'Whether to automatically categorize products using AI' 
      },
      { 
        'Setting': 'Include Descriptions', 
        'Value': (settings.includeDescriptions !== false).toString(), 
        'Description': 'Whether to generate product descriptions using AI' 
      },
      { 
        'Setting': 'Duplicate Detection', 
        'Value': (settings.duplicateDetection !== false).toString(), 
        'Description': 'Whether to detect and mark duplicate receipts' 
      },
      { 
        'Setting': 'Export Format', 
        'Value': settings.exportFormat || 'detailed', 
        'Description': 'Export format: detailed, summary, or minimal' 
      },
      { 
        'Setting': 'Receipt Scanner Version', 
        'Value': APP_CONFIG.VERSION, 
        'Description': 'Version of the receipt scanner application' 
      }
    ];

    const settingsSheet = XLSX.utils.json_to_sheet(settingsData);
    settingsSheet['!cols'] = [{ wch: 25 }, { wch: 50 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');

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
    const filename = `receipt-scanner-settings-${timestamp}.xlsx`;

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] [EXPORT-SETTINGS] Settings file generated successfully in ${duration}ms`);
    console.log(`[${requestId}] [EXPORT-SETTINGS] File size: ${excelBuffer.length} bytes, filename: ${filename}`);

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
    console.error(`[${requestId}] [EXPORT-SETTINGS] Error after ${duration}ms:`, error);
    return Response.json(
      { error: 'Failed to generate settings file' },
      { status: 500 }
    );
  }
}
