import { useRef, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, NumberInput, Button } from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { useShinglePricing } from '../../context/PricingContext';
import { LAYER_DEPTH_NAMES, SHINGLE_TYPE_NAMES } from '../../data/defaultPricing';
import { formatCurrency, getTotalShingleCount } from '../../utils/calculateEstimate';
import type { LayerDepth, EstimatePhoto } from '../../types';

const LAYER_DEPTHS: LayerDepth[] = ['surface', 'one-layer', 'two-layer', 'three-layer'];

export function DamageAssessmentStep() {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();
  const shinglePricing = useShinglePricing();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!estimate) return null;

  const selectedPricing = shinglePricing[estimate.shingleType];
  const totalShingles = getTotalShingleCount(estimate);

  const updateDamageCount = (layerDepth: LayerDepth, count: number) => {
    const newDamage = estimate.shingleDamage.map((d) =>
      d.layerDepth === layerDepth ? { ...d, count } : d
    );
    dispatch({ type: 'SET_SHINGLE_DAMAGE', payload: newDamage });
  };

  const getDamageCount = (layerDepth: LayerDepth): number => {
    return estimate.shingleDamage.find((d) => d.layerDepth === layerDepth)?.count || 0;
  };

  const calculateLayerSubtotal = (layerDepth: LayerDepth): number => {
    const count = getDamageCount(layerDepth);
    const pricing = selectedPricing[layerDepth];
    return count * (pricing.material + pricing.labor);
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const photo: EstimatePhoto = {
          id: uuidv4(),
          dataUrl: event.target?.result as string,
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_PHOTO', payload: photo });
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    dispatch({ type: 'REMOVE_PHOTO', payload: photoId });
  };

  const runningTotal = LAYER_DEPTHS.reduce(
    (sum, depth) => sum + calculateLayerSubtotal(depth),
    0
  );

  return (
    <div className="space-y-6">
      {/* Photo Upload Section */}
      <Card>
        <CardHeader
          title="Damage Photos"
          subtitle="Upload photos of the damaged area for reference"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              + Add Photos
            </Button>
          }
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {estimate.photos.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-gray-400 mb-2">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Tap to add photos</p>
            <p className="text-sm text-gray-400 mt-1">Take photos or select from gallery</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {estimate.photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square">
                <img
                  src={photo.dataUrl}
                  alt="Damage"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        )}
      </Card>

      {/* Shingle Type Reminder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">
              Shingle Type: {SHINGLE_TYPE_NAMES[estimate.shingleType]}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Pricing is calculated based on this selection
            </p>
          </div>
        </div>
      </div>

      {/* Damage Count Section */}
      <Card>
        <CardHeader
          title="Shingle Damage Count"
          subtitle="Enter the number of damaged shingles by repair type"
        />

        <div className="space-y-4">
          {LAYER_DEPTHS.map((depth) => {
            const pricing = selectedPricing[depth];
            const count = getDamageCount(depth);
            const subtotal = calculateLayerSubtotal(depth);
            const perShingleTotal = pricing.material + pricing.labor;

            return (
              <div
                key={depth}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {LAYER_DEPTH_NAMES[depth]}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatCurrency(perShingleTotal)} per shingle
                      <span className="text-gray-400 ml-2">
                        (Mat: {formatCurrency(pricing.material)} + Lab:{' '}
                        {formatCurrency(pricing.labor)})
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <NumberInput
                      value={count}
                      onChange={(value) => updateDamageCount(depth, value)}
                      min={0}
                      max={999}
                      size="md"
                    />
                    <div className="w-24 text-right">
                      <span
                        className={`font-semibold ${
                          subtotal > 0 ? 'text-blue-600' : 'text-gray-400'
                        }`}
                      >
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Running Total */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-medium text-gray-900">
                Total Damaged Shingles
              </span>
              <span className="ml-2 text-gray-500">({totalShingles} shingles)</span>
            </div>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(runningTotal)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            This is the shingle repair subtotal before additional repairs and adjustments
          </p>
        </div>
      </Card>
    </div>
  );
}
