"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Download, Settings as SettingsIcon, Plus, Trash2 } from 'lucide-react';
import { UserSettings } from '@/utils/settingsUtils';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onExportSettings: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onExportSettings
}) => {
  const { isDarkMode } = useDarkMode();
  const [editedSettings, setEditedSettings] = useState<UserSettings>(settings);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    setEditedSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedSettings);
    onClose();
  };

  const addCategory = () => {
    if (newCategory.trim() && !editedSettings.customCategories?.includes(newCategory.trim())) {
      setEditedSettings(prev => ({
        ...prev,
        customCategories: [...(prev.customCategories || []), newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setEditedSettings(prev => ({
      ...prev,
      customCategories: prev.customCategories?.filter(cat => cat !== categoryToRemove) || []
    }));
  };

  const updateSetting = (key: keyof UserSettings, value: string | number | boolean | string[]) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className={`text-2xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Custom Categories */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Custom Categories
            </h3>
            <p className={`text-sm mb-4 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Define custom categories for AI to use when analyzing receipts
            </p>
            
            {/* Add Category Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category..."
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              />
              <button
                onClick={addCategory}
                disabled={!newCategory.trim()}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            {/* Categories List */}
            <div className="flex flex-wrap gap-2">
              {editedSettings.customCategories?.map((category, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-300 ${
                    isDarkMode 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <span className="text-sm font-medium">{category}</span>
                  <button
                    onClick={() => removeCategory(category)}
                    className={`p-1 rounded-full transition-colors duration-300 ${
                      isDarkMode 
                        ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300' 
                        : 'hover:bg-red-100 text-red-500 hover:text-red-600'
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Other Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Default Currency */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Default Currency
              </label>
              <input
                type="text"
                value={editedSettings.defaultCurrency || 'Dollar'}
                onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>

            {/* Date Format */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Date Format
              </label>
              <select
                value={editedSettings.dateFormat || 'MM/DD/YYYY'}
                onChange={(e) => updateSetting('dateFormat', e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
              </select>
            </div>

            {/* Tax Rate */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={(editedSettings.taxRate || 0) * 100}
                onChange={(e) => updateSetting('taxRate', parseFloat(e.target.value) / 100)}
                className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              />
            </div>

          </div>

          {/* Boolean Settings */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Analysis Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'autoCategorize', label: 'Auto-categorize products', description: 'Automatically categorize products using AI' },
                { key: 'includeDescriptions', label: 'Include descriptions', description: 'Generate product descriptions using AI' },
                { key: 'duplicateDetection', label: 'Duplicate detection', description: 'Detect and mark duplicate receipts' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={key}
                    checked={editedSettings[key as keyof UserSettings] as boolean || false}
                    onChange={(e) => updateSetting(key as keyof UserSettings, e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor={key} className={`text-sm font-medium transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {label}
                    </label>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onExportSettings}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Settings
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
