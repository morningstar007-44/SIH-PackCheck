import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Primitives';
import { Camera, FolderUp, AlertCircle } from 'lucide-react';
import { compressAndResizeImage } from '../utils/imageUtils';

export const NewInspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image under 10MB.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Please select an image under 10MB.');
      return;
    }

    try {
      const compressedBlob = await compressAndResizeImage(file, 2000, 0.85);
      navigate('/inspection/new/preview', { state: { imageBlob: compressedBlob } });
    } catch (err) {
      console.error('Error compressing image:', err);
      setError('Failed to process the selected image. Please try another file.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">New Inspection</h1>
        <p className="text-sm text-[#495057]">
          Scan or upload a product package image to initiate legal compliance verification.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-[#FFF5F5] border border-[#FFC9C9] text-[#C92A2A] rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Option */}
        <Card
          clickable
          onClick={() => navigate('/inspection/new/camera')}
          className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#DEE2E6] hover:border-[#1971C2] bg-white transition-all"
        >
          <div className="w-16 h-16 bg-[#E7F0F9] text-[#1971C2] rounded-full flex items-center justify-center mb-4">
            <Camera size={32} />
          </div>
          <h2 className="text-base font-semibold text-[#212529] mb-1">Scan with Camera</h2>
          <p className="text-xs text-[#868E96] max-w-xs">
            Use your device camera to capture high-clarity package label declarations live.
          </p>
        </Card>

        {/* Upload Option */}
        <Card
          clickable
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#DEE2E6] hover:border-[#1971C2] bg-white transition-all"
        >
          <div className="w-16 h-16 bg-[#E7F0F9] text-[#1971C2] rounded-full flex items-center justify-center mb-4">
            <FolderUp size={32} />
          </div>
          <h2 className="text-base font-semibold text-[#212529] mb-1">Upload Image</h2>
          <p className="text-xs text-[#868E96] max-w-xs">
            Select a clear package image (JPEG, PNG, WebP) from your device files.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
        </Card>
      </div>

      <div className="p-4 bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg text-xs text-[#495057] space-y-1">
        <p className="font-semibold text-[#212529]">Inspection Tips for Inspectors:</p>
        <ul className="list-disc list-inside space-y-0.5 text-[#868E96]">
          <li>Ensure package mandatory text panel is fully visible and free of reflections.</li>
          <li>Hold device steady to ensure sharp typography for accurate OCR text recognition.</li>
          <li>For multi-panel packages, take photos of principal display panel and side declaration panel.</li>
        </ul>
      </div>
    </div>
  );
};
