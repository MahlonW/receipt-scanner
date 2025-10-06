"use client";

import React from 'react';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface VersionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appVersion: string;
  fileVersion: string;
  compatibility: {
    compatible: boolean;
    type: 'major' | 'minor' | 'patch' | 'same';
    message: string;
  };
}

const VersionConfirmModal: React.FC<VersionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appVersion,
  fileVersion,
  compatibility,
}) => {
  const { isDarkMode } = useDarkMode();

  if (!isOpen) return null;

  const isMajorMismatch = compatibility.type === 'major';
  const isMinorMismatch = compatibility.type === 'minor';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-2xl shadow-2xl border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center gap-3 p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isMajorMismatch 
              ? 'bg-red-500' 
              : isMinorMismatch 
                ? 'bg-yellow-500' 
                : 'bg-blue-500'
          }`}>
            {isMajorMismatch ? (
              <AlertTriangle className="h-6 w-6 text-white" />
            ) : isMinorMismatch ? (
              <AlertTriangle className="h-6 w-6 text-white" />
            ) : (
              <Info className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h2 className={`text-xl font-bold transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {isMajorMismatch ? 'Version Compatibility Warning' : 'Version Mismatch'}
            </h2>
            <p className={`text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {isMajorMismatch ? 'Major version difference detected' : 'Version difference detected'}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`ml-auto p-2 rounded-full transition-colors duration-300 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className={`p-4 rounded-lg mb-6 transition-colors duration-300 ${
            isMajorMismatch 
              ? 'bg-red-50 border border-red-200' 
              : isMinorMismatch 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              {isMajorMismatch ? (
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              ) : isMinorMismatch ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`font-medium mb-2 transition-colors duration-300 ${
                  isMajorMismatch 
                    ? 'text-red-800' 
                    : isMinorMismatch 
                      ? 'text-yellow-800' 
                      : 'text-blue-800'
                }`}>
                  {compatibility.message}
                </p>
                <div className={`text-sm space-y-1 transition-colors duration-300 ${
                  isMajorMismatch 
                    ? 'text-red-700' 
                    : isMinorMismatch 
                      ? 'text-yellow-700' 
                      : 'text-blue-700'
                }`}>
                  <p><strong>App Version:</strong> {appVersion}</p>
                  <p><strong>File Version:</strong> {fileVersion}</p>
                </div>
              </div>
            </div>
          </div>

          {isMajorMismatch && (
            <div className={`p-4 rounded-lg mb-6 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700/50 border border-gray-600' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <h3 className={`font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Potential Issues:
              </h3>
              <ul className={`text-sm space-y-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>• Settings may not be compatible</li>
                <li>• Data format may have changed</li>
                <li>• Some features may not work correctly</li>
                <li>• Data loss or corruption possible</li>
              </ul>
            </div>
          )}

          {isMinorMismatch && (
            <div className={`p-4 rounded-lg mb-6 transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700/50 border border-gray-600' 
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <h3 className={`font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Minor Issues:
              </h3>
              <ul className={`text-sm space-y-1 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <li>• Some new features may not be available</li>
                <li>• Settings format may be slightly different</li>
                <li>• Generally safe to proceed</li>
              </ul>
            </div>
          )}

          <div className={`p-4 rounded-lg transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-blue-900/20 border border-blue-800' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-800'
                }`}>
                  Recommendation
                </p>
                <p className={`text-sm mt-1 transition-colors duration-300 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  {isMajorMismatch 
                    ? 'Consider updating your app or using a file created with the current version.'
                    : 'You can proceed, but consider updating your app for the best experience.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t transition-colors duration-300 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-300 ${
              isMajorMismatch 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : isMinorMismatch 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isMajorMismatch ? 'Proceed Anyway' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionConfirmModal;
