import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  CardHeader,
  NumberInput,
  Button,
  QuickIncrementButtons,
  FieldModeToggle,
  QuickTagChips,
  StickyTotalBar,
} from '../ui';
import { useEstimate, useCurrentEstimate } from '../../context/EstimateContext';
import { useShinglePricing, useAdditionalRepairs } from '../../context/PricingContext';
import { LAYER_DEPTH_NAMES, SHINGLE_TYPE_NAMES, FLAT_ROOF_MATERIAL_NAMES, DEFAULT_FLAT_ROOF_PRICING } from '../../data/defaultPricing';
import { QUICK_DAMAGE_TAGS, getTagsByIds } from '../../data/quickDamageTags';
import { formatCurrency, getTotalShingleCount } from '../../utils/calculateEstimate';
import { generateScope, generateScopeSummary } from '../../utils/autoGenerateScope';
import type { LayerDepth, EstimatePhoto, AdditionalRepair, FlatRoofDetails } from '../../types';

const LAYER_DEPTHS: LayerDepth[] = ['surface', 'one-layer', 'two-layer', 'three-layer'];
const FIELD_MODE_KEY = 'roofapp_field_mode';

interface DamageAssessmentStepProps {
  onNext?: () => void;
}

export function DamageAssessmentStep({ onNext }: DamageAssessmentStepProps) {
  const { dispatch } = useEstimate();
  const estimate = useCurrentEstimate();
  const shinglePricing = useShinglePricing();
  const additionalRepairs = useAdditionalRepairs();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  // Field Mode state
  const [fieldMode, setFieldMode] = useState(() => {
    const saved = localStorage.getItem(FIELD_MODE_KEY);
    return saved === 'true';
  });

  // Selected quick tags state (stored in localStorage keyed by estimate)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    if (!estimate) return [];
    const saved = localStorage.getItem(`roofapp_tags_${estimate.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist field mode preference
  useEffect(() => {
    localStorage.setItem(FIELD_MODE_KEY, String(fieldMode));
  }, [fieldMode]);

  // Persist selected tags
  useEffect(() => {
    if (estimate) {
      localStorage.setItem(`roofapp_tags_${estimate.id}`, JSON.stringify(selectedTagIds));
    }
  }, [selectedTagIds, estimate]);

  // Auto-add repairs when tags change
  useEffect(() => {
    if (!estimate) return;

    const selectedTags = getTagsByIds(selectedTagIds);
    const autoRepairIds = new Set<string>();

    selectedTags.forEach((tag) => {
      tag.autoRepairIds.forEach((id) => autoRepairIds.add(id));
    });

    // Add repairs that don't already exist
    autoRepairIds.forEach((repairId) => {
      const exists = estimate.additionalRepairs.some((r) => r.repairTypeId === repairId);
      const repairType = additionalRepairs.find((r) => r.id === repairId);

      if (!exists && repairType) {
        const newRepair: AdditionalRepair = {
          repairTypeId: repairId,
          quantity: 1,
        };
        dispatch({
          type: 'SET_ADDITIONAL_REPAIRS',
          payload: [...estimate.additionalRepairs, newRepair],
        });
      }
    });
  }, [selectedTagIds, estimate, additionalRepairs, dispatch]);

  if (!estimate) return null;

  const isCommercial = estimate.roofType === 'commercial';

  const selectedPricing = shinglePricing[estimate.shingleType];
  const totalShingles = getTotalShingleCount(estimate);
  const selectedTags = getTagsByIds(selectedTagIds);

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

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (libraryInputRef.current) {
      libraryInputRef.current.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    dispatch({ type: 'REMOVE_PHOTO', payload: photoId });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const runningTotal = LAYER_DEPTHS.reduce(
    (sum, depth) => sum + calculateLayerSubtotal(depth),
    0
  );

  // Generate auto scope
  const autoScope = generateScope({
    shingleType: estimate.shingleType,
    damages: estimate.shingleDamage,
    quickTags: selectedTags,
  });

  const scopeSummary = generateScopeSummary({
    shingleType: estimate.shingleType,
    damages: estimate.shingleDamage,
    quickTags: selectedTags,
  });

  const itemCount = totalShingles + selectedTagIds.length;

  // ========== COMMERCIAL FLAT ROOF ASSESSMENT ==========
  const updateFlatRoofField = (field: keyof FlatRoofDetails, value: unknown) => {
    if (estimate.flatRoofDetails) {
      dispatch({
        type: 'SET_FLAT_ROOF_DETAILS',
        payload: { ...estimate.flatRoofDetails, [field]: value },
      });
    }
  };

  const flatRoofPricing = isCommercial
    ? DEFAULT_FLAT_ROOF_PRICING.find((p) => p.material === estimate.flatRoofDetails?.material)
    : null;

  const flatRoofTotal = isCommercial && estimate.flatRoofDetails && flatRoofPricing
    ? estimate.flatRoofDetails.totalArea *
      (flatRoofPricing.perSquareFoot.material + flatRoofPricing.perSquareFoot.labor)
    : 0;

  if (isCommercial) {
    const details = estimate.flatRoofDetails;
    if (!details) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Flat Roof Assessment</h2>
            <p className="text-sm text-gray-500">
              {FLAT_ROOF_MATERIAL_NAMES[details.material]} • {details.totalArea.toLocaleString()} sq ft
            </p>
          </div>
        </div>

        {/* Material & Cost Summary */}
        <div className="bg-gradient-to-r from-[#00224a]/5 to-[#00224a]/10 border border-[#00224a]/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[#00224a] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#00224a]">
                {FLAT_ROOF_MATERIAL_NAMES[details.material]}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {flatRoofPricing
                  ? `${formatCurrency(flatRoofPricing.perSquareFoot.material + flatRoofPricing.perSquareFoot.labor)}/sq ft`
                  : 'Select material'}
                {' • '}{flatRoofPricing?.warrantyYears}-year warranty
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-[#00224a]">
                {formatCurrency(flatRoofTotal)}
              </span>
              <p className="text-xs text-gray-500">base cost</p>
            </div>
          </div>
        </div>

        {/* Condition Assessment */}
        <Card>
          <CardHeader
            title="Roof Condition Assessment"
            subtitle="Evaluate current condition for auto-generated repairs"
          />
          <div className="space-y-4">
            {/* Membrane Condition */}
            <div className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Membrane</h4>
                  <p className="text-xs text-gray-500">Overall membrane condition</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  details.membraneCondition === 'good'
                    ? 'bg-green-100 text-green-700'
                    : details.membraneCondition === 'fair'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }`}>
                  {details.membraneCondition.charAt(0).toUpperCase() + details.membraneCondition.slice(1)}
                </span>
              </div>
              <div className="flex gap-2">
                {(['good', 'fair', 'poor'] as const).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => updateFlatRoofField('membraneCondition', condition)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      details.membraneCondition === condition
                        ? condition === 'good'
                          ? 'bg-green-500 text-white'
                          : condition === 'fair'
                            ? 'bg-amber-500 text-white'
                            : 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </button>
                ))}
              </div>
              {details.membraneCondition === 'poor' && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  +30% coating application will be auto-added
                </p>
              )}
            </div>

            {/* Seam Condition */}
            <div className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Seams & Welds</h4>
                  <p className="text-xs text-gray-500">Seam integrity across membrane</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  details.seamCondition === 'good'
                    ? 'bg-green-100 text-green-700'
                    : details.seamCondition === 'fair'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }`}>
                  {details.seamCondition.charAt(0).toUpperCase() + details.seamCondition.slice(1)}
                </span>
              </div>
              <div className="flex gap-2">
                {(['good', 'fair', 'poor'] as const).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => updateFlatRoofField('seamCondition', condition)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      details.seamCondition === condition
                        ? condition === 'good'
                          ? 'bg-green-500 text-white'
                          : condition === 'fair'
                            ? 'bg-amber-500 text-white'
                            : 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </button>
                ))}
              </div>
              {details.seamCondition === 'poor' && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  Seam repairs will be auto-estimated
                </p>
              )}
            </div>

            {/* Flashing Condition */}
            <div className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Flashing & Parapet</h4>
                  <p className="text-xs text-gray-500">Edge and wall flashing condition</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  details.flashingCondition === 'good'
                    ? 'bg-green-100 text-green-700'
                    : details.flashingCondition === 'fair'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                }`}>
                  {details.flashingCondition.charAt(0).toUpperCase() + details.flashingCondition.slice(1)}
                </span>
              </div>
              <div className="flex gap-2">
                {(['good', 'fair', 'poor'] as const).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => updateFlatRoofField('flashingCondition', condition)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      details.flashingCondition === condition
                        ? condition === 'good'
                          ? 'bg-green-500 text-white'
                          : condition === 'fair'
                            ? 'bg-amber-500 text-white'
                            : 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </button>
                ))}
              </div>
              {details.flashingCondition !== 'good' && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Parapet flashing repairs will be auto-estimated
                </p>
              )}
            </div>

            {/* Drainage & Ponding */}
            <div className="border rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-3">Drainage & Ponding</h4>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={details.drainageIssues}
                    onChange={(e) => updateFlatRoofField('drainageIssues', e.target.checked)}
                    className="w-5 h-5 text-[#00224a] rounded"
                  />
                  <span className="text-sm text-gray-700">Drainage Issues</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Ponding Areas:</label>
                  <NumberInput
                    value={details.pondingAreas}
                    onChange={(value) => updateFlatRoofField('pondingAreas', value)}
                    min={0}
                    max={20}
                  />
                </div>
              </div>
              {(details.drainageIssues || details.pondingAreas > 0) && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  {details.drainageIssues && 'Drain repair will be added. '}
                  {details.pondingAreas > 0 && `${details.pondingAreas} ponding correction(s) will be auto-estimated.`}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardHeader
            title="Roof Photos"
            subtitle="Capture photos of the flat roof condition"
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()}>
                  Camera
                </Button>
                <Button size="sm" variant="outline" onClick={() => libraryInputRef.current?.click()}>
                  Library
                </Button>
              </div>
            }
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {estimate.photos.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-4">Document membrane, seams, drains, flashings</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00224a] text-white rounded-lg hover:bg-[#00224a]/90 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Camera
                </button>
                <button
                  onClick={() => libraryInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Library
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {estimate.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square">
                  <img
                    src={photo.dataUrl}
                    alt="Roof"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600"
                  >
                    x
                  </button>
                </div>
              ))}
              <div className="aspect-square flex flex-col gap-1 justify-center items-center">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-[#00224a] hover:text-[#00224a] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => libraryInputRef.current?.click()}
                  className="w-full flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-[#00224a] hover:text-[#00224a] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ========== RESIDENTIAL SHINGLE ASSESSMENT (original) ==========
  return (
    <div className={`space-y-6 ${fieldMode ? 'pb-24' : ''}`}>
      {/* Field Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Damage Scan</h2>
          <p className="text-sm text-gray-500">{scopeSummary}</p>
        </div>
        <FieldModeToggle enabled={fieldMode} onChange={setFieldMode} />
      </div>

      {/* Quick Photo Capture - Prominent in Field Mode */}
      {fieldMode && (
        <div className="flex gap-2">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-bold">Camera</span>
          </button>
          <button
            onClick={() => libraryInputRef.current?.click()}
            className="flex-1 bg-gray-200 text-gray-700 rounded-2xl p-4 flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-bold">Library</span>
          </button>
          {estimate.photos.length > 0 && (
            <div className="flex items-center px-3 bg-blue-100 text-blue-700 rounded-2xl font-bold">
              {estimate.photos.length}
            </div>
          )}
        </div>
      )}

      {/* Quick Damage Tags - One-tap field entries */}
      <Card className={fieldMode ? 'bg-gradient-to-br from-gray-50 to-gray-100' : ''}>
        <CardHeader
          title="Quick Tags"
          subtitle="Tap to add common damage items"
        />
        <QuickTagChips
          tags={QUICK_DAMAGE_TAGS}
          selectedIds={selectedTagIds}
          onToggle={toggleTag}
          showCategories={!fieldMode}
          size={fieldMode ? 'lg' : 'md'}
        />
      </Card>

      {/* Photo Upload Section (Compact in Field Mode) */}
      {!fieldMode && (
        <Card>
          <CardHeader
            title="Damage Photos"
            subtitle="Upload photos of the damaged area for reference"
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()}>
                  Camera
                </Button>
                <Button size="sm" variant="outline" onClick={() => libraryInputRef.current?.click()}>
                  Library
                </Button>
              </div>
            }
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {estimate.photos.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-4">Take photos or select from gallery</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Camera
                </button>
                <button
                  onClick={() => libraryInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Library
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {estimate.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square">
                  <img
                    src={photo.dataUrl}
                    alt="Damage"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="aspect-square flex flex-col gap-1 justify-center items-center">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => libraryInputRef.current?.click()}
                  className="w-full flex-1 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Hidden file inputs for field mode */}
      {fieldMode && (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <input
            ref={libraryInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </>
      )}

      {/* Photo thumbnails in field mode */}
      {fieldMode && estimate.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {estimate.photos.map((photo) => (
            <div key={photo.id} className="relative flex-shrink-0 w-16 h-16">
              <img
                src={photo.dataUrl}
                alt="Damage"
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Shingle Type Reminder */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
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
            <p className="text-sm font-semibold text-blue-800">
              {SHINGLE_TYPE_NAMES[estimate.shingleType]}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Pricing calculated for this shingle type
            </p>
          </div>
        </div>
      </div>

      {/* Damage Count Section */}
      <Card className={fieldMode ? 'bg-gradient-to-br from-gray-50 to-gray-100' : ''}>
        <CardHeader
          title="Shingle Count"
          subtitle={fieldMode ? 'Tap buttons to count' : 'Enter damaged shingles by repair type'}
        />

        <div className="space-y-4">
          {LAYER_DEPTHS.map((depth) => {
            const pricing = selectedPricing[depth];
            const count = getDamageCount(depth);
            const subtotal = calculateLayerSubtotal(depth);
            const perShingleTotal = pricing.material + pricing.labor;
            const layerName = LAYER_DEPTH_NAMES[depth].split('(')[0].trim();

            return (
              <div
                key={depth}
                className={`
                  border rounded-2xl p-4 transition-all
                  ${count > 0 ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-white'}
                `}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{layerName}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatCurrency(perShingleTotal)}/shingle
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${
                          subtotal > 0 ? 'text-blue-600' : 'text-gray-300'
                        }`}
                      >
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>

                  {fieldMode ? (
                    <QuickIncrementButtons
                      value={count}
                      onChange={(value) => updateDamageCount(depth, value)}
                      increments={[1, 5, 10]}
                      size="lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center">
                      <NumberInput
                        value={count}
                        onChange={(value) => updateDamageCount(depth, value)}
                        min={0}
                        max={999}
                        size="lg"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Running Total (Hidden in Field Mode - shown in sticky bar) */}
        {!fieldMode && (
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
              Shingle repair subtotal before additional repairs
            </p>
          </div>
        )}
      </Card>

      {/* Auto-Generated Scope Preview */}
      {(totalShingles > 0 || selectedTagIds.length > 0) && !fieldMode && (
        <Card>
          <CardHeader
            title="Auto-Generated Scope"
            subtitle="This will appear on the estimate"
          />
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{autoScope}</p>
          </div>
        </Card>
      )}

      {/* Sticky Total Bar in Field Mode */}
      {fieldMode && (
        <StickyTotalBar
          total={runningTotal}
          itemCount={itemCount}
          label="Shingle Subtotal"
          onNext={onNext}
          nextLabel="Next"
        />
      )}
    </div>
  );
}
