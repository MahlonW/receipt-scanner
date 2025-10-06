'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useDarkMode } from '@/contexts/DarkModeContext';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onMultipleCapture?: (files: File[]) => void;
  multiple?: boolean;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onCapture,
  onMultipleCapture,
  multiple = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const { isDarkMode } = useDarkMode();

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else if (err.name === 'NotSupportedError') {
          setError('Camera not supported on this device.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });

        if (multiple) {
          setCapturedImages(prev => [...prev, file]);
        } else {
          onCapture(file);
          onClose();
        }
      }
    }, 'image/jpeg', 0.9);
  }, [multiple, onCapture, onClose]);

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const finishMultipleCapture = useCallback(() => {
    if (onMultipleCapture && capturedImages.length > 0) {
      onMultipleCapture(capturedImages);
    }
    onClose();
  }, [onMultipleCapture, capturedImages, onClose]);

  const removeCapturedImage = useCallback((index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Start camera when modal opens
  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImages([]);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4">
      <div className={`relative rounded-2xl shadow-2xl w-full max-w-4xl mx-auto transition-all duration-300 ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-2xl font-bold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {multiple ? 'Capture Multiple Receipts' : 'Capture Receipt'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors duration-300 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Camera View */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Camera Error</h3>
              <p className={`text-lg mb-6 transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>{error}</p>
              <button
                onClick={startCamera}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-96 object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Camera Controls Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={toggleCamera}
                    className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800/80 hover:bg-gray-700/80 text-white' 
                        : 'bg-white/80 hover:bg-white/90 text-gray-800'
                    }`}
                    title="Switch Camera"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>

                {/* Capture Button */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    disabled={!isStreaming}
                    className={`p-4 rounded-full transition-all duration-300 ${
                      isStreaming
                        ? 'bg-white hover:bg-gray-100 text-gray-800 shadow-lg hover:shadow-xl'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="h-8 w-8" />
                  </button>
                </div>
              </div>

              {/* Captured Images (Multiple Mode) */}
              {multiple && capturedImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Captured Images ({capturedImages.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Captured ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeCapturedImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                {multiple ? (
                  <>
                    <button
                      onClick={finishMultipleCapture}
                      disabled={capturedImages.length === 0}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        capturedImages.length > 0
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <Check className="h-5 w-5 inline mr-2" />
                      Process {capturedImages.length} Images
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
