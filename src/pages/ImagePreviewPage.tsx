import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui/Primitives';
import { CheckCircle2, ArrowRight, ArrowLeft, Trash2, ImagePlus } from 'lucide-react';

export const ImagePreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialBlob = (location.state as { imageBlob?: Blob })?.imageBlob;

  const [imageBlob] = useState<Blob | null>(initialBlob || null);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Food & Beverages');
  const [zoomScale, setZoomScale] = useState(1);

  if (!imageBlob) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-4">
        <h2 className="text-xl font-semibold text-[#212529]">No package image selected</h2>
        <p className="text-sm text-[#495057]">
          Please scan a package label with your camera or select an image file to begin inspection.
        </p>
        <Button onClick={() => navigate('/inspection/new')}>Return to New Inspection</Button>
      </div>
    );
  }

  const imageUrl = URL.createObjectURL(imageBlob);

  const handleStartInspection = () => {
    navigate('/inspection/processing', {
      state: {
        imageBlob,
        productName,
        category,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#212529]">Image Preview</h1>
        <p className="text-sm text-[#495057]">
          Review package label image clarity before initiating legal verification algorithms.
        </p>
      </div>

      <Card className="p-4 space-y-4">
        {/* Interactive Zoomable Image Preview Container */}
        <div className="relative overflow-hidden bg-[#F1F3F5] rounded-lg border border-[#E9ECEF] flex items-center justify-center min-h-[300px] max-h-[450px] p-2">
          <img
            src={imageUrl}
            alt="Package Label Preview"
            style={{ transform: `scale(${zoomScale})` }}
            className="max-h-[420px] w-auto object-contain transition-transform duration-200"
          />
          <div className="absolute bottom-3 right-3 bg-white/90 border border-[#DEE2E6] rounded-md px-2 py-1 flex items-center gap-1 text-xs text-[#495057] shadow-sm">
            <button
              onClick={() => setZoomScale((s) => Math.max(0.8, s - 0.2))}
              className="px-1.5 font-bold hover:text-[#1971C2]"
            >
              -
            </button>
            <span>{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((s) => Math.min(2.5, s + 0.2))}
              className="px-1.5 font-bold hover:text-[#1971C2]"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E9ECEF]">
          <div className="flex items-center gap-1.5 text-xs text-[#2B8A3E] font-medium">
            <CheckCircle2 size={16} />
            <span>Image declaration text appears clear</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => navigate('/inspection/new')}
              icon={<Trash2 size={14} />}
            >
              Remove
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/inspection/new')}
              icon={<ImagePlus size={14} />}
            >
              Add Another Side
            </Button>
          </div>
        </div>
      </Card>

      {/* Product Metadata Input Form */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#212529]">Product Metadata (Optional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. ABC Biscuits 200g"
              className="w-full bg-white border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#212529] placeholder:text-[#ADB5BD] focus:outline-none focus:ring-2 focus:ring-[#1971C2]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">
              Commodity Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-[#DEE2E6] rounded-lg px-3 py-2 text-sm text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#1971C2]"
            >
              <option value="Food & Beverages">Food & Beverages</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Household">Household</option>
              <option value="Electronics">Electronics</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-4 border-t border-[#E9ECEF]">
        <Button
          variant="secondary"
          onClick={() => navigate('/inspection/new')}
          icon={<ArrowLeft size={16} />}
        >
          Back
        </Button>
        <Button onClick={handleStartInspection} icon={<ArrowRight size={16} />}>
          Start Inspection
        </Button>
      </div>
    </div>
  );
};
