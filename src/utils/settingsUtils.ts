import * as XLSX from 'xlsx';
import { APP_CONFIG } from '@/config';

export interface UserSettings {
  customCategories?: string[];
  defaultCurrency?: string;
  dateFormat?: string;
  taxRate?: number;
  autoCategorize?: boolean;
  includeDescriptions?: boolean;
  duplicateDetection?: boolean;
  exportFormat?: string;
  version?: string;
}

export function parseSettingsFromExcel(buffer: ArrayBuffer): UserSettings {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const settingsSheet = workbook.Sheets['Settings'];
    
    if (!settingsSheet) {
      console.log('No Settings sheet found in Excel file');
      return {};
    }
    
    const settingsData = XLSX.utils.sheet_to_json(settingsSheet) as Array<{
      Setting: string;
      Value: string;
      Description?: string;
    }>;
    
    const settings: UserSettings = {};
    
    for (const row of settingsData) {
      const setting = row.Setting?.toLowerCase().replace(/\s+/g, '');
      const value = row.Value?.trim();
      
      if (!setting || !value) continue;
      
      switch (setting) {
        case 'customcategories':
          settings.customCategories = value.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);
          break;
        case 'defaultcurrency':
          settings.defaultCurrency = value;
          break;
        case 'dateformat':
          settings.dateFormat = value;
          break;
        case 'taxrate':
          settings.taxRate = parseFloat(value);
          break;
        case 'auto-categorize':
        case 'autocategorize':
          settings.autoCategorize = value.toLowerCase() === 'true';
          break;
        case 'includedescriptions':
          settings.includeDescriptions = value.toLowerCase() === 'true';
          break;
        case 'duplicatedetection':
          settings.duplicateDetection = value.toLowerCase() === 'true';
          break;
        case 'exportformat':
          settings.exportFormat = value;
          break;
        case 'receiptscannerversion':
        case 'version':
          settings.version = value;
          break;
      }
    }
    
    console.log('Parsed settings from Excel:', settings);
    return settings;
  } catch (error) {
    console.error('Error parsing settings from Excel:', error);
    return {};
  }
}

export function getDefaultSettings(): UserSettings {
  return {
    customCategories: ['food', 'work', 'home', 'furniture', 'electronics', 'clothing', 'health', 'entertainment', 'travel', 'other'],
    defaultCurrency: 'Dollar',
    dateFormat: 'MM/DD/YYYY',
    taxRate: 0.0,
    autoCategorize: true,
    includeDescriptions: true,
    duplicateDetection: true,
    exportFormat: 'detailed',
    version: APP_CONFIG.VERSION
  };
}
