'use client';

import { useState } from 'react';
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ReceiptData } from '@/types/product';
import { processReceipts } from '@/utils/receiptUtils';

export default function MergePage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mergedData, setMergedData] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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

  const mergeFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setValidationErrors([]);
    setMergedData([]);

    try {
      const allReceipts: ReceiptData[] = [];
      const allErrors: string[] = [];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        try {
          const formData = new FormData();
          formData.append('excel', file);

          const response = await fetch('/api/parse-excel', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            allErrors.push(`File ${i + 1} (${file.name}): Failed to parse - ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          
          // Validate the format
          const validationErrors = validateExcelFormat(data);
          if (validationErrors.length > 0) {
            allErrors.push(`File ${i + 1} (${file.name}): ${validationErrors.join(', ')}`);
            continue;
          }

          // Process receipts
          const processedData = processReceipts(data, 'excel');
          allReceipts.push(...processedData);
          
        } catch (err) {
          allErrors.push(`File ${i + 1} (${file.name}): ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

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

  const downloadMerged = async () => {
    if (mergedData.length === 0) return;

    try {
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receipts: mergedData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel file');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link 
              href="/"
              className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full shadow-lg">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
            Merge Excel Files
          </h1>
          <p className="text-gray-600">
            Combine multiple Excel files into one organized spreadsheet
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-white/20">
          <div className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-4 shadow-lg">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Upload Excel Files</h3>
            <p className="text-gray-600 mb-4">Select multiple Excel files to merge</p>
            
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2 mx-auto w-fit shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Upload className="h-4 w-4" />
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
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Files ({uploadedFiles.length})</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">
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
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={mergeFiles}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4" />
                      Merge Files
                    </>
                  )}
                </button>
                
                <button
                  onClick={clearAll}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Format Validation Errors</h3>
            </div>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-700 bg-red-100 rounded-lg p-2">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Merged Results */}
        {mergedData.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Merge Complete ({mergedData.length} receipts)
                </h2>
              </div>
              <button
                onClick={downloadMerged}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Download className="h-4 w-4" />
                Download Merged File
              </button>
            </div>

            <div className="grid gap-3">
              {mergedData.map((receipt, index) => (
                <div key={index} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{receipt.store}</h3>
                      <p className="text-sm text-gray-600 mb-2">{receipt.date}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="h-3 w-3" />
                          {receipt.products.length} items
                        </span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                          {receipt.source}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${receipt.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
