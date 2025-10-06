'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Receipt, Loader2, AlertCircle, CheckCircle, FileSpreadsheet, History, AlertTriangle, X, FileImage, Store, Calendar, Package, Zap, Trash2, LogOut, Moon, Sun } from 'lucide-react';
import { ReceiptData } from '@/types/product';
import { processReceipts, findDuplicates } from '@/utils/receiptUtils';
import { useDarkMode } from '@/contexts/DarkModeContext';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [batchResults, setBatchResults] = useState<ReceiptData[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [tokenUsage, setTokenUsage] = useState<{
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: string;
  } | null>(null);
  const [cachedReceipts, setCachedReceipts] = useState<ReceiptData[]>([]);
  const [existingData, setExistingData] = useState<ReceiptData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [duplicates, setDuplicates] = useState<ReceiptData[]>([]);
  const [allReceipts, setAllReceipts] = useState<ReceiptData[]>([]);
  const [autoClearImages, setAutoClearImages] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Load cached receipts on component mount
  useEffect(() => {
    const cached = localStorage.getItem('receipt-scanner-cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Separate receipts by source
        const excelReceipts = parsed.filter((r: ReceiptData) => r.source === 'excel');
        const otherReceipts = parsed.filter((r: ReceiptData) => r.source !== 'excel');
        
        setExistingData(excelReceipts);
        setCachedReceipts(otherReceipts);
      } catch (error) {
        console.error('Error loading cached receipts:', error);
      }
    }
  }, []);

  // Save receipt data to cache
  const saveToCache = (data: ReceiptData) => {
    // Get all current receipts from all sources
    const allCurrentReceipts = [...existingData, ...cachedReceipts, ...batchResults, ...(receiptData ? [receiptData] : [])];
    
    // Check if this receipt already exists (by ID)
    const existingIndex = allCurrentReceipts.findIndex(r => r.id === data.id);
    
    let updatedReceipts;
    if (existingIndex >= 0) {
      // Update existing receipt
      updatedReceipts = [...allCurrentReceipts];
      updatedReceipts[existingIndex] = data;
    } else {
      // Add new receipt
      updatedReceipts = [...allCurrentReceipts, data];
    }
    
    // Save to localStorage
    localStorage.setItem('receipt-scanner-cache', JSON.stringify(updatedReceipts));
    
    // Update state based on source
    if (data.source === 'excel') {
      const excelReceipts = updatedReceipts.filter(r => r.source === 'excel');
      setExistingData(excelReceipts);
    } else {
      const otherReceipts = updatedReceipts.filter(r => r.source !== 'excel');
      setCachedReceipts(otherReceipts);
    }
  };

  // Clear cache
  const clearCache = () => {
    setCachedReceipts([]);
    setExistingData([]);
    localStorage.removeItem('receipt-scanner-cache');
    updateAllReceipts();
  };

  // Clear all data completely
  const clearAllData = () => {
    setCachedReceipts([]);
    setExistingData([]);
    setBatchResults([]);
    setReceiptData(null);
    setDuplicates([]);
    setAllReceipts([]);
    setImage(null);
    setImages([]);
    setTokenUsage(null);
    setError(null);
    localStorage.removeItem('receipt-scanner-cache');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  // Update all receipts and check for duplicates
  const updateAllReceipts = () => {
    // Create a map to deduplicate receipts by ID
    const receiptMap = new Map<string, ReceiptData>();
    
    // Add receipts in priority order: excel > cached > batch > current
    const allReceipts = [
      ...existingData.map(r => ({ ...r, source: 'excel' as const })),
      ...cachedReceipts.map(r => ({ ...r, source: 'cached' as const })),
      ...batchResults.map(r => ({ ...r, source: 'analyzed' as const })),
      ...(receiptData ? [{ ...receiptData, source: 'analyzed' as const }] : [])
    ];
    
    
    // Process and deduplicate
    allReceipts.forEach(receipt => {
      // Skip null or undefined receipts
      if (!receipt) return;
      
      const processed = processReceipts([receipt], receipt.source)[0];
      const id = processed.id!;
      
      // Only keep the first occurrence (highest priority)
      if (!receiptMap.has(id)) {
        receiptMap.set(id, processed);
      }
    });
    
    const uniqueReceipts = Array.from(receiptMap.values());
    const duplicatesFound = findDuplicates(uniqueReceipts);
    
    setAllReceipts(uniqueReceipts);
    setDuplicates(duplicatesFound);
  };

  // Check for duplicates when data changes
  useEffect(() => {
    updateAllReceipts();
  }, [existingData, cachedReceipts, batchResults, receiptData]);

  // Save all data to cache when it changes
  useEffect(() => {
    const allReceipts = [...existingData, ...cachedReceipts, ...batchResults, ...(receiptData ? [receiptData] : [])];
    if (allReceipts.length > 0) {
      localStorage.setItem('receipt-scanner-cache', JSON.stringify(allReceipts));
    }
  }, [existingData, cachedReceipts, batchResults, receiptData]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setImages([]); // Clear multiple images when doing single upload
      setReceiptData(null);
      setBatchResults([]);
      setError(null);
    }
  };

  const handleMultipleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setImages(files);
      setImage(null); // Clear single image when doing multiple upload
      setReceiptData(null);
      setBatchResults([]);
      setError(null);
    }
  };

  const deleteImage = (indexToDelete: number) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      const updatedImages = images.filter((_, index) => index !== indexToDelete);
      setImages(updatedImages);
      
      // If no images left, clear related state
      if (updatedImages.length === 0) {
        setBatchResults([]);
      }
    }
  };

  const analyzeReceipt = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze receipt');
      }

      const data = await response.json();
      
      // Process the receipt to assign ID and mark source
      const processedData = processReceipts([data], 'analyzed')[0];
      setReceiptData(processedData);
      
      // Extract token usage from API response
      if (data.tokenUsage) {
        setTokenUsage(data.tokenUsage);
      }
      
      // Save to cache
      saveToCache(processedData);
      
      // Clear single image after successful analysis (if auto-clear is enabled)
      if (autoClearImages) {
        // Auto-clearing single image after analysis
        setImage(null);
      } else {
        // Auto-clear disabled, keeping single image
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const analyzeBatch = async () => {
    if (images.length === 0) return;

    setBatchLoading(true);
    setError(null);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: images.length });

    const results: ReceiptData[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;

    try {
      for (let i = 0; i < images.length; i++) {
        setBatchProgress({ current: i + 1, total: images.length });
        
        const formData = new FormData();
        formData.append('image', images[i]);

        const response = await fetch('/api/analyze-receipt', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error(`Failed to analyze image ${i + 1}`);
          continue;
        }

        const data = await response.json();
        
        // Process the receipt to assign ID and mark source
        const processedData = processReceipts([data], 'analyzed')[0];
        results.push(processedData);
        
        // Accumulate token usage
        if (data.tokenUsage) {
          totalPromptTokens += data.tokenUsage.promptTokens;
          totalCompletionTokens += data.tokenUsage.completionTokens;
          totalTokens += data.tokenUsage.totalTokens;
        }
      }

      // Batch analysis completed
      setBatchResults(results);
      setTokenUsage({
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens,
        cost: `$${((totalPromptTokens * 0.0005) + (totalCompletionTokens * 0.0015) / 1000).toFixed(4)}`
      });
      
      // Clear images after successful batch analysis (if auto-clear is enabled)
      if (autoClearImages) {
        // Auto-clearing batch images after analysis
        setImages([]);
      } else {
        // Auto-clear disabled, keeping batch images
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during batch processing');
    } finally {
      setBatchLoading(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('excel', file);

      const response = await fetch('/api/parse-excel', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse Excel file');
      }

      const data = await response.json();
      // Excel upload - processing data
      
      // Process receipts to assign IDs and mark as from Excel
      const processedData = processReceipts(data, 'excel');
      // Excel upload - processed data
      
      // Append to existing data instead of replacing
      setExistingData(prevData => {
        const newData = [...prevData, ...processedData];
        // Excel upload - updated existing data
        return newData;
      });
      
      // Don't call saveToCache here - let updateAllReceipts handle the caching
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file');
    }
  };

  const exportToExcel = async () => {
    if (allReceipts.length === 0) return;

    setExporting(true);
    try {
      // Use the deduplicated receipts
      const allData = allReceipts;
      
      const response = await fetch('/api/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receipts: allData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipts-${allReceipts.length}-receipts-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className={`min-h-screen py-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg">
              <img src="/logo.svg" alt="Receipt Scanner" className="w-8 h-8" />
            </div>
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              } shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <h1 className={`text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 ${
            isDarkMode ? 'text-white' : ''
          }`}>
            Receipt Scanner
          </h1>
          <p className={`text-lg mb-4 max-w-xl mx-auto transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Transform your receipts into organized data with AI-powered analysis
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <History className="h-4 w-4" />
              {showHistory ? 'Hide' : 'Show'} History ({cachedReceipts.length})
            </button>
            
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
            
            {/* Auto-clear images toggle */}
            <div className={`flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/60 border-gray-700' 
                : 'bg-white/80 border-white/20'
            }`}>
              <input
                type="checkbox"
                id="auto-clear"
                checked={autoClearImages}
                onChange={(e) => {
                  setAutoClearImages(e.target.checked);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded accent-blue-600"
              />
              <label htmlFor="auto-clear" className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Auto-clear images
              </label>
            </div>
            
            {cachedReceipts.length > 0 && (
              <button
                onClick={clearCache}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Trash2 className="h-4 w-4" />
                Clear Cache
              </button>
            )}
            
            {(cachedReceipts.length > 0 || existingData.length > 0 || batchResults.length > 0 || receiptData) && (
              <button
                onClick={clearAllData}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <X className="h-4 w-4" />
                Clear All Data
              </button>
            )}
          </div>
          
          {/* Excel upload */}
          <div className="mb-6">
            <div className={`backdrop-blur-sm rounded-xl p-4 shadow-lg border transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/60 border-gray-700' 
                : 'bg-white/80 border-white/20'
            }`}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <label
                  htmlFor="excel-upload"
                  className="cursor-pointer bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Upload Excel File
                </label>
                <Link
                  href="/merge"
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  Merge Excel Files
                </Link>
              </div>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className={`backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-800/60 border-gray-700' 
            : 'bg-white/90 border-white/20'
        }`}>
          <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-300 ${
            isDarkMode 
              ? 'border-gray-600 bg-gradient-to-br from-gray-800/50 to-gray-700/50' 
              : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
          }`}>
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4 shadow-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Upload Your Receipts</h3>
            <p className={`mb-6 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Choose single or multiple receipt upload</p>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div>
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Upload className="h-4 w-4" />
                    Single Image
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
        </div>
                <div>
                  <label
                    htmlFor="multiple-image-upload"
                    className="cursor-pointer bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <Upload className="h-4 w-4" />
                    Multiple Images
                  </label>
                  <input
                    id="multiple-image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Single image preview */}
              {image && (
                <div className="mt-8">
                  <div className={`backdrop-blur-sm rounded-2xl p-6 shadow-lg border transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800/60 border-gray-700' 
                      : 'bg-white/80 border-white/20'
                  }`}>
                    <p className={`text-sm font-medium mb-4 flex items-center gap-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <FileImage className="h-4 w-4 text-blue-600" />
                      Selected: {image.name}
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={URL.createObjectURL(image)}
                        alt="Preview"
                        className="max-w-xs max-h-64 rounded-xl shadow-lg border-2 border-white/50"
                      />
                      <button
                        onClick={() => setImage(null)}
                        className="absolute -top-3 -right-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full p-2 hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Multiple images preview */}
              {images.length > 0 && (
                <div className="mt-4">
                  <p className={`text-sm mb-2 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Selected {images.length} image{images.length > 1 ? 's' : ''}:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {images.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg shadow-sm"
                        />
                        <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                        <button
                          onClick={() => deleteImage(index)}
                          className="absolute top-1 left-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Delete image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center space-x-4">
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all images?')) {
                          setImages([]);
                          setBatchResults([]);
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Clear All Images
                    </button>
                    
                    {!autoClearImages && (
                      <button
                        onClick={() => {
                          setImages([]);
                          setBatchResults([]);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Clear & Start Fresh
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 text-center space-y-4">
            {image && (
              <button
                onClick={analyzeReceipt}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-5 w-5" />
                    Analyze Single Receipt
                  </>
                )}
              </button>
            )}
            
            {images.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={analyzeBatch}
                  disabled={batchLoading}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                >
                  {batchLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing Batch ({batchProgress.current}/{batchProgress.total})...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-5 w-5" />
                      Analyze {images.length} Receipts
                    </>
                  )}
                </button>
                
                {batchLoading && (
                  <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        {showHistory && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <History className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Receipt History ({cachedReceipts.length} receipts)
              </h2>
            </div>
            {cachedReceipts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No receipts in history</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {cachedReceipts.map((receipt, index) => (
                  <div key={index} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {receipt.store || 'Unknown Store'}
                          </h3>
                          {receipt.duplicateOf && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                              Duplicate
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {receipt.date || 'Unknown Date'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {receipt.products.length} items
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {receipt.source}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                          {formatPrice(receipt.total)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Items: {receipt.products.map(p => p.name).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Existing Data Section */}
        {existingData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Loaded from Excel ({existingData.length} receipts)
            </h2>
            <div className="space-y-4">
              {existingData.map((receipt, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {receipt.store || 'Unknown Store'}
                        {receipt.duplicateOf && (
                          <span className="ml-2 text-sm text-yellow-600">
                            (Duplicate)
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {receipt.date || 'Unknown Date'} • {receipt.products.length} items
                        <span className="ml-2 text-xs text-green-600">
                          ID: {receipt.id?.slice(0, 8)}... • Source: {receipt.source}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatPrice(receipt.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch Results Section */}
        {batchResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Batch Analysis Complete ({batchResults.length} receipts)
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {batchResults.map((receipt, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {receipt.store || 'Unknown Store'}
                        {receipt.duplicateOf && (
                          <span className="ml-2 text-sm text-yellow-600">
                            (Duplicate)
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {receipt.date || 'Unknown Date'} • {receipt.products.length} items
                        <span className="ml-2 text-xs text-purple-600">
                          ID: {receipt.id?.slice(0, 8)}... • Source: {receipt.source}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatPrice(receipt.total)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Items: {receipt.products.map(p => p.name).join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Duplicates Section */}
        {duplicates.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Duplicate Receipts Found ({duplicates.length})
              </h2>
            </div>
            <p className="text-yellow-700 mb-4">
              The following receipts appear to be duplicates of existing ones. They will be marked in the export but you may want to review them.
            </p>
            <div className="space-y-3">
              {duplicates.map((duplicate, index) => (
                <div key={index} className="bg-white border border-yellow-300 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {duplicate.store || 'Unknown Store'}
                        <span className="ml-2 text-sm text-yellow-600">
                          (Duplicate of {duplicate.duplicateOf})
                        </span>
                      </h3>
                      <p className="text-sm text-gray-500">
                        {duplicate.date || 'Unknown Date'} • {duplicate.products.length} items
                        <span className="ml-2 text-xs text-yellow-600">
                          Source: {duplicate.source}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatPrice(duplicate.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Section - Remove this in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-2">Debug Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Cached Receipts: {cachedReceipts.length}</p>
              <p>Existing Data: {existingData.length}</p>
              <p>Batch Results: {batchResults.length}</p>
              <p>Current Receipt: {receiptData ? 'Yes' : 'No'}</p>
              <p>All Receipts: {allReceipts.length}</p>
              <p>Duplicates: {duplicates.length}</p>
              {batchResults.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Batch Results Details:</p>
                  {batchResults.map((receipt, i) => (
                    <p key={i} className="ml-2">
                      - {receipt.store} ({receipt.id}) - {receipt.products.length} items
                    </p>
                  ))}
                </div>
              )}
              {duplicates.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Duplicate Details:</p>
                  {duplicates.map((dup, i) => (
                    <p key={i} className="ml-2">
                      - {dup.store} ({dup.id}) → {dup.duplicateOf}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Export Button - Always visible when there are receipts */}
        {allReceipts.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                  Export Receipts
                </h2>
              </div>
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-5 w-5" />
                    Export All to Excel ({allReceipts.length} receipts)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {receiptData && (
          <div className={`backdrop-blur-sm rounded-3xl shadow-2xl p-8 border transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/60 border-gray-700' 
              : 'bg-white/90 border-white/20'
          }`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className={`text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent ${
                isDarkMode ? 'text-white' : ''
              }`}>
                Receipt Analysis Complete
              </h2>
            </div>

            {receiptData.store && (
              <div className={`mb-8 p-6 rounded-2xl border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-600' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
              }`}>
                <h3 className={`font-bold mb-3 flex items-center gap-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Store className="h-5 w-5 text-blue-600" />
                  Store Information
                </h3>
                <div className="space-y-2">
                  <p className={`text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>{receiptData.store}</p>
                  {receiptData.date && (
                    <p className={`flex items-center gap-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Calendar className="h-4 w-4" />
                      {receiptData.date}
                    </p>
                  )}
                </div>
              </div>
            )}

            {tokenUsage && (
              <div className={`mb-8 p-6 rounded-2xl border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-600' 
                  : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
              }`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <Zap className="h-5 w-5 text-purple-600" />
                  API Usage
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className={`text-center p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                  }`}>
                    <p className={`text-sm mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Prompt Tokens</p>
                    <p className="text-xl font-bold text-purple-700">{tokenUsage.promptTokens.toLocaleString()}</p>
                  </div>
                  <div className={`text-center p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                  }`}>
                    <p className={`text-sm mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Completion Tokens</p>
                    <p className="text-xl font-bold text-purple-700">{tokenUsage.completionTokens.toLocaleString()}</p>
                  </div>
                  <div className={`text-center p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                  }`}>
                    <p className={`text-sm mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Total Tokens</p>
                    <p className="text-xl font-bold text-purple-700">{tokenUsage.totalTokens.toLocaleString()}</p>
                  </div>
                  <div className={`text-center p-4 rounded-xl transition-colors duration-300 ${
                    isDarkMode ? 'bg-gray-800/60' : 'bg-white/60'
                  }`}>
                    <p className={`text-sm mb-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Estimated Cost</p>
                    <p className="text-xl font-bold text-green-600">{tokenUsage.cost}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className={`text-2xl font-bold mb-6 flex items-center gap-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <Package className="h-6 w-6 text-blue-600" />
                Products ({receiptData.products.length})
              </h3>
              <div className="grid gap-4">
                {receiptData.products.map((product, index) => (
                  <div
                    key={index}
                    className={`border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                      isDarkMode 
                        ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
                        : 'bg-gradient-to-r from-white to-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{product.name}</h4>
                        {product.description && (
                          <p className={`text-sm mb-3 transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {product.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm">
                          {product.quantity && (
                            <span className={`px-2 py-1 rounded-full font-semibold transition-colors duration-300 ${
                              isDarkMode 
                                ? 'bg-blue-900/50 text-blue-300' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              Qty: {product.quantity}
                            </span>
                          )}
                          {product.category && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t-2 border-gray-200 pt-6">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
                <div className="space-y-3">
                  {receiptData.subtotal && (
                    <div className="flex justify-between text-gray-700 text-lg">
                      <span className="font-semibold">Subtotal:</span>
                      <span className="font-bold">{formatPrice(receiptData.subtotal)}</span>
                    </div>
                  )}
                  {receiptData.tax && (
                    <div className="flex justify-between text-gray-700 text-lg">
                      <span className="font-semibold">Tax:</span>
                      <span className="font-bold">{formatPrice(receiptData.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent border-t-2 border-gray-300 pt-3">
                    <span>Total:</span>
                    <span>{formatPrice(receiptData.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}