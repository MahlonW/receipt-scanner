'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle, ArrowLeft, Trash2, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { ReceiptData } from '@/types/product';
import { processReceipts } from '@/utils/receiptUtils';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { ButtonSkeleton, ReceiptCardSkeleton, UploadAreaSkeleton, HeaderSkeleton } from '@/components/LoadingSkeleton';
import { UserSettings, parseSettingsFromExcel } from '@/utils/settingsUtils';
import VersionConfirmModal from '@/components/VersionConfirmModal';
import { APP_CONFIG, VersionManager } from '@/config';

export default function MergePage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mergedData, setMergedData] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionCompatibility, setVersionCompatibility] = useState<{
    compatible: boolean;
    type: 'major' | 'minor' | 'patch' | 'same';
    message: string;
  } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileVersion, setFileVersion] = useState<string>('1.0.0');
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    setError(null);
    setValidationErrors([]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateExcelFormat = (data: unknown[]): string[] => {
    const errors: string[] = [];
    
    if (!Array.isArray(data)) {
      errors.push('File does not contain valid receipt data');
      return errors;
    }

    if (data.length === 0) {
      errors.push('File appears to be empty');
      return errors;
    }

    // // Check if data has expected structure
    // const hasValidStructure = data.every((item, index) => {
    //   if (!item || typeof item !== 'object') {
    //     errors.push(`Row ${index + 1}: Invalid data structure`);
    //     return false;
    //   }
      
    //   if (!item.products || !Array.isArray(item.products)) {
    //     errors.push(`Row ${index + 1}: Missing or invalid products array`);
    //     return false;
    //   }
      
    //   if (typeof item.total !== 'number' || item.total <= 0) {
    //     errors.push(`Row ${index + 1}: Missing or invalid total amount`);
    //     return false;
    //   }
      
    //   if (!item.store || typeof item.store !== 'string') {
    //     errors.push(`Row ${index + 1}: Missing or invalid store name`);
    //     return false;
    //   }
      
    //   return true;
    // });

    return errors;
  };

  const checkVersionCompatibility = (fileSettings: UserSettings) => {
    const fileVer = fileSettings.version || '1.0.0';
    setFileVersion(fileVer);
    const compatibility = VersionManager.isCompatible(APP_CONFIG.VERSION, fileVer);
    
    if (VersionManager.shouldShowWarning(compatibility)) {
      setVersionCompatibility(compatibility);
      return false; // Need user confirmation
    }
    
    return true; // Safe to proceed
  };

  const handleVersionConfirm = () => {
    setShowVersionModal(false);
    setVersionCompatibility(null);
    
    if (pendingFiles.length > 0) {
      processFiles(pendingFiles);
      setPendingFiles([]);
    }
  };

  const handleVersionCancel = () => {
    setShowVersionModal(false);
    setVersionCompatibility(null);
    setPendingFiles([]);
  };

  const processFiles = async (files: File[]) => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);
    setMergedData([]);

    try {
      // Process all files concurrently using Promise.all
      const filePromises = files.map(async (file, index) => {
        try {
          const formData = new FormData();
          formData.append('excel', file);

          const response = await fetch('/api/parse-excel', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            return {
              success: false,
              error: `File ${index + 1} (${file.name}): Failed to parse - ${response.statusText}`,
              receipts: []
            };
          }

          const data = await response.json();
          
          // Validate the format
          const validationErrors = validateExcelFormat(data);
          if (validationErrors.length > 0) {
            return {
              success: false,
              error: `File ${index + 1} (${file.name}): ${validationErrors.join(', ')}`,
              receipts: []
            };
          }

          // Process receipts
          const processedData = processReceipts(data, 'excel');
          return {
            success: true,
            error: null,
            receipts: processedData
          };
          
        } catch (err) {
          return {
            success: false,
            error: `File ${index + 1} (${file.name}): ${err instanceof Error ? err.message : 'Unknown error'}`,
            receipts: []
          };
        }
      });

      // Wait for all files to be processed
      const results = await Promise.all(filePromises);

      // Separate successful results from errors
      const allReceipts: ReceiptData[] = [];
      const allErrors: string[] = [];

      results.forEach(result => {
        if (result.success) {
          allReceipts.push(...result.receipts);
        } else {
          allErrors.push(result.error || 'Unknown error');
        }
      });

      if (allErrors.length > 0) {
        setValidationErrors(allErrors);
      }

      if (allReceipts.length > 0) {
        setMergedData(allReceipts);
      } else {
        setError('No valid receipts found in any of the uploaded files');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge files');
    } finally {
      setLoading(false);
    }
  };

  const mergeFiles = async () => {
    if (uploadedFiles.length === 0) return;

    // Check version compatibility for all files
    const versionChecks = await Promise.all(
      uploadedFiles.map(async (file) => {
        try {
          const fileBuffer = await file.arrayBuffer();
          const settings = parseSettingsFromExcel(fileBuffer);
          return { file, settings, compatible: checkVersionCompatibility(settings) };
        } catch (err) {
          console.error(`Error checking version for ${file.name}:`, err);
          return { file, settings: null, compatible: true }; // Skip version check if parsing fails
        }
      })
    );

    // Check if any files have version issues
    const incompatibleFiles = versionChecks.filter(check => !check.compatible);
    
    if (incompatibleFiles.length > 0) {
      // Show version warning for the first incompatible file
      const firstIncompatible = incompatibleFiles[0];
      if (firstIncompatible.settings) {
        const fileVer = firstIncompatible.settings.version || '1.0.0';
        setFileVersion(fileVer);
        const compatibility = VersionManager.isCompatible(APP_CONFIG.VERSION, fileVer);
        setVersionCompatibility(compatibility);
        setPendingFiles(uploadedFiles);
        setShowVersionModal(true);
        return;
      }
    }

    // All files are compatible, proceed with merge
    await processFiles(uploadedFiles);
  };

  const downloadMerged = async () => {
    if (uploadedFiles.length === 0) return;

    try {
      // Convert files to ArrayBuffers for proper workbook merging
      const fileBuffers = await Promise.all(
        uploadedFiles.map(file => file.arrayBuffer())
      );

      const response = await fetch('/api/merge-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: fileBuffers }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge Excel files');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merged-receipts-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download merged file');
    }
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setMergedData([]);
    setError(null);
    setValidationErrors([]);
  };


  if (isInitialLoading) {
    return (
      <div className={`min-h-screen py-4 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="max-w-5xl mx-auto px-4">
          <HeaderSkeleton />
          <UploadAreaSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Header with back button and dark mode toggle */}
          <div className="flex justify-between items-center mb-8">
            <Link 
              href="/"
              className={`p-3 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 ${
                isDarkMode 
                  ? 'bg-gray-800/60 hover:bg-gray-700/60' 
                  : 'bg-white/80 hover:bg-white/90'
              }`}
            >
              <ArrowLeft className={`h-6 w-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </Link>
            <div className="text-center">
              <h1 className={`text-5xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 pb-1 ${
                isDarkMode ? 'text-white' : ''
              }`}>
                Merge Excel Files
              </h1>
              <div className={`w-24 h-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mx-auto ${
                isDarkMode ? 'opacity-80' : 'opacity-60'
              }`}></div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white' 
                  : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white'
              } shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105`}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <p className={`text-xl mb-6 max-w-2xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Combine multiple Excel files into one organized spreadsheet
          </p>
        </div>

        {/* File Upload */}
        <div className={`backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border transition-all duration-300 hover:shadow-3xl ${
          isDarkMode 
            ? 'bg-gray-800/60 border-gray-700 hover:bg-gray-700/60' 
            : 'bg-white/80 border-white/20 hover:bg-white/90'
        }`}>
          <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 hover:border-opacity-60 ${
            isDarkMode 
              ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-700/60 hover:to-gray-600/60' 
              : 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100'
          }`}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full mb-6 shadow-xl">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <h3 className={`text-2xl font-bold mb-3 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Upload Excel Files</h3>
            <p className={`text-lg mb-8 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Select multiple Excel files to merge</p>
            
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center gap-3 mx-auto w-fit shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
            >
              <Upload className="h-5 w-5" />
              Choose Excel Files
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className={`text-lg font-semibold mb-3 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Uploaded Files ({uploadedFiles.length})</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className={`flex items-center justify-between rounded-lg p-3 transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>{file.name}</span>
                      <span className={`text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
               <div className="flex gap-4 mt-6">
                 {loading ? (
                   <>
                     <ButtonSkeleton />
                     <ButtonSkeleton />
                   </>
                 ) : (
                   <>
                     <button
                       onClick={mergeFiles}
                       disabled={loading}
                       className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                     >
                       <FileSpreadsheet className="h-5 w-5" />
                       Merge Files
                     </button>
                     
                     <button
                       onClick={clearAll}
                       className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-4 rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
                     >
                       <Trash2 className="h-5 w-5" />
                       Clear All
                     </button>
                   </>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className={`border rounded-xl p-4 mb-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>Format Validation Errors</h3>
            </div>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <p key={index} className={`text-sm rounded-lg p-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-red-300 bg-red-900/30' 
                    : 'text-red-700 bg-red-100'
                }`}>
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`border rounded-xl p-4 mb-6 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className={`transition-colors duration-300 ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>{error}</p>
            </div>
          </div>
        )}

        {/* Merged Results */}
        {mergedData.length > 0 && (
          <div className={`backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/60 border-gray-700' 
              : 'bg-white/90 border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h2 className={`text-xl font-bold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Merge Complete ({mergedData.length} receipts)
                </h2>
              </div>
              <button
                onClick={downloadMerged}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
              >
                <Download className="h-5 w-5" />
                Download Merged File
              </button>
            </div>

             <div className="grid gap-3">
               {loading ? (
                 Array.from({ length: 3 }).map((_, index) => (
                   <ReceiptCardSkeleton key={index} />
                 ))
               ) : (
                 mergedData.map((receipt, index) => (
                <div key={index} className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
                    : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`font-bold mb-1 transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{receipt.store}</h3>
                      <p className={`text-sm mb-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{receipt.date}</p>
                      <div className={`flex items-center gap-4 text-xs transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" />
                          {receipt.products.length} items
                        </span>
                        <span className={`px-2 py-1 rounded-full font-semibold transition-colors duration-300 ${
                          isDarkMode 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {receipt.source}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        ${receipt.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                ))
               )}
            </div>
          </div>
        )}

        {/* Version Confirmation Modal */}
        {versionCompatibility && (
          <VersionConfirmModal
            isOpen={showVersionModal}
            onClose={handleVersionCancel}
            onConfirm={handleVersionConfirm}
            appVersion={APP_CONFIG.VERSION}
            fileVersion={fileVersion}
            compatibility={versionCompatibility}
          />
        )}
      </div>
    </div>
  );
}
