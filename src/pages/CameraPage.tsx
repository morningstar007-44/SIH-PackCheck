import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../hooks/useCamera';
import { Button } from '../components/ui/Primitives';
import { Camera, RefreshCw, X, FolderUp, AlertCircle } from 'lucide-react';
import { compressAndResizeImage } from '../utils/imageUtils';

export const CameraPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    videoRef,
    canvasRef,
    status,
    capture,
    switchCamera,
    start,
    stop,
    errorMessage,
    hasMultipleCameras,
  } = useCamera();

  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, []);

  const handleCapture = async () => {
    setCaptureError(null);
    const rawBlob = capture();
    if (!rawBlob) {
      setCaptureError('Camera not ready. Please wait a moment and try again.');
      return;
    }
    try {
      const compressed = await compressAndResizeImage(rawBlob, 2000, 0.85);
      setCapturedBlob(compressed);
      setCapturedUrl(URL.createObjectURL(compressed));
    } catch (e) {
      setCapturedBlob(rawBlob);
      setCapturedUrl(URL.createObjectURL(rawBlob));
    }
  };

  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    setCapturedBlob(null);
    setCapturedUrl(null);
  };

  const handleUsePhoto = () => {
    if (capturedBlob) {
      stop();
      navigate('/inspection/new/preview', { state: { imageBlob: capturedBlob } });
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-4 text-white">
      {/* Hidden canvas for snapshot capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Header Controls */}
      <div className="flex items-center justify-between z-10">
        <button
          onClick={() => {
            stop();
            navigate('/inspection/new');
          }}
          className="p-2 text-white/80 hover:text-white bg-black/40 rounded-full"
          aria-label="Cancel camera scan"
        >
          <X size={24} />
        </button>
        <span className="text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
          {capturedUrl ? 'Review Snapshot' : 'Align Package Label'}
        </span>
        {hasMultipleCameras && !capturedUrl && (
          <button
            onClick={switchCamera}
            className="p-2 text-white/80 hover:text-white bg-black/40 rounded-full"
            aria-label="Switch camera"
          >
            <RefreshCw size={20} />
          </button>
        )}
      </div>

      {/* Center Camera Stream / Captured Preview */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden rounded-lg bg-zinc-900 border border-white/10">
        {capturedUrl ? (
          <img
            src={capturedUrl}
            alt="Captured Package Label"
            className="max-h-full max-w-full object-contain"
          />
        ) : status === 'active' ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            {/* Standard dashed guide rectangle per prompt standard */}
            <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-lg pointer-events-none flex flex-col items-center justify-between p-4">
              <span className="text-xs text-white/80 bg-black/50 px-2 py-1 rounded">
                Position declarations inside frame
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="mx-auto text-amber-400 mb-3" size={36} />
            <p className="text-sm font-medium mb-2">
              {errorMessage || 'Initializing camera stream...'}
            </p>
            <p className="text-xs text-zinc-400 mb-6">
              Camera access requires HTTPS connection and device permissions. You can upload an image file instead.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => navigate('/inspection/new')}
                icon={<FolderUp size={16} />}
              >
                Upload File Instead
              </Button>
              {status !== 'requesting' && (
                <Button variant="primary" onClick={start}>
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Capture Error Feedback */}
      {captureError && (
        <div className="text-center text-xs text-amber-400 bg-black/60 px-3 py-1.5 rounded-full mb-1 z-10">
          {captureError}
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-center gap-6 py-2 z-10">
        {capturedUrl ? (
          <>
            <Button variant="secondary" onClick={handleRetake} size="lg">
              Retake
            </Button>
            <Button variant="primary" onClick={handleUsePhoto} size="lg">
              Use Photo
            </Button>
          </>
        ) : (
          status === 'active' && (
            <button
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Capture Photo"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Camera className="text-[#1971C2]" size={24} />
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );
};
