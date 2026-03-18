import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '../ui';

// Photo slot definitions
const PHOTO_SLOTS = [
  { id: 'front-elevation', label: 'Front Elevation' },
  { id: 'rear-elevation', label: 'Rear Elevation' },
  { id: 'left-side', label: 'Left Side' },
  { id: 'right-side', label: 'Right Side' },
  { id: 'roof-overview-1', label: 'Roof Overview 1' },
  { id: 'roof-overview-2', label: 'Roof Overview 2' },
  { id: 'ridge-line', label: 'Ridge Line' },
  { id: 'gutters-downspouts', label: 'Gutters & Downspouts' },
  { id: 'flashing-valleys', label: 'Flashing/Valleys' },
  { id: 'damaged-area-1', label: 'Damaged Area 1' },
  { id: 'damaged-area-2', label: 'Damaged Area 2' },
  { id: 'damaged-area-3', label: 'Damaged Area 3' },
  { id: 'damaged-area-4', label: 'Damaged Area 4' },
  { id: 'interior-attic-1', label: 'Interior/Attic 1' },
  { id: 'interior-attic-2', label: 'Interior/Attic 2' },
] as const;

type ConditionType = 'Good' | 'Fair' | 'Poor' | 'N/A';

interface PhotoData {
  url: string | null;
  condition: ConditionType;
  notes: string;
}

type PhotoState = Record<string, PhotoData>;

const CONDITION_OPTIONS: ConditionType[] = ['Good', 'Fair', 'Poor', 'N/A'];

const CONDITION_COLORS: Record<ConditionType, { bg: string; color: string; tailwindBg: string; tailwindText: string }> = {
  Good: { bg: '#DCFCE7', color: '#166534', tailwindBg: 'bg-green-100', tailwindText: 'text-green-800' },
  Fair: { bg: '#FEF3C7', color: '#92400E', tailwindBg: 'bg-amber-100', tailwindText: 'text-amber-800' },
  Poor: { bg: '#FEE2E2', color: '#991B1B', tailwindBg: 'bg-red-100', tailwindText: 'text-red-800' },
  'N/A': { bg: '#F1F5F9', color: '#475569', tailwindBg: 'bg-slate-100', tailwindText: 'text-slate-600' },
};

function generateReportNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RRP-${y}${m}${d}-${rand}`;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function InspectionReport() {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);

  // Form state
  const [reportNumber] = useState(generateReportNumber);
  const [date, setDate] = useState(getTodayDate);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [phone, setPhone] = useState('');
  const [roofAge, setRoofAge] = useState('');
  const [overallCondition, setOverallCondition] = useState<ConditionType>('Good');
  const [recommendedAction, setRecommendedAction] = useState('');

  // Photo state
  const [photos, setPhotos] = useState<PhotoState>(() => {
    const initial: PhotoState = {};
    PHOTO_SLOTS.forEach(slot => {
      initial[slot.id] = { url: null, condition: 'N/A', notes: '' };
    });
    return initial;
  });

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(photos).forEach(photo => {
        if (photo.url) URL.revokeObjectURL(photo.url);
      });
    };
  }, []);

  const handlePhotoUpload = useCallback((slotId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setPhotos(prev => {
      // Revoke old URL if exists
      if (prev[slotId]?.url) URL.revokeObjectURL(prev[slotId].url!);
      return {
        ...prev,
        [slotId]: { ...prev[slotId], url },
      };
    });
  }, []);

  const handlePhotoRemove = useCallback((slotId: string) => {
    setPhotos(prev => {
      if (prev[slotId]?.url) URL.revokeObjectURL(prev[slotId].url!);
      return {
        ...prev,
        [slotId]: { ...prev[slotId], url: null },
      };
    });
  }, []);

  const handleConditionChange = useCallback((slotId: string, condition: ConditionType) => {
    setPhotos(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], condition },
    }));
  }, []);

  const handleNotesChange = useCallback((slotId: string, notes: string) => {
    setPhotos(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], notes },
    }));
  }, []);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    // Hide download button
    if (downloadBtnRef.current) {
      downloadBtnRef.current.style.visibility = 'hidden';
    }

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);

      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageH = pdf.internal.pageSize.getHeight(); // 297mm
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH, '', 'FAST');

      let left = imgH - pageH;
      let pos = 0;

      while (left > 0) {
        pos = left - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, pos, imgW, imgH, '', 'FAST');
        left -= pageH;
      }

      const safeName = (propertyAddress || 'report').replace(/[^a-z0-9]/gi, '-');
      const safeDate = date.replace(/[^a-z0-9]/gi, '-');
      pdf.save(`RRP-Inspection-${safeName}-${safeDate}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Restore download button
      if (downloadBtnRef.current) {
        downloadBtnRef.current.style.visibility = 'visible';
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');`}</style>

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Roof Inspection Report</h1>
        <button
          ref={downloadBtnRef}
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Report Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report #</label>
              <input
                type="text"
                value={reportNumber}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Name</label>
              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                placeholder="Enter inspector name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(xxx) xxx-xxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Property Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
              <input
                type="text"
                value={propertyAddress}
                onChange={e => setPropertyAddress(e.target.value)}
                placeholder="Enter full property address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="Enter property owner name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roof Age (years)</label>
              <input
                type="number"
                value={roofAge}
                onChange={e => setRoofAge(e.target.value)}
                placeholder="Enter estimated roof age"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Overall Assessment */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Assessment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Overall Condition</label>
              <div className="flex flex-wrap gap-2">
                {(['Good', 'Fair', 'Poor'] as ConditionType[]).map(condition => (
                  <button
                    key={condition}
                    onClick={() => setOverallCondition(condition)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      overallCondition === condition
                        ? `${CONDITION_COLORS[condition].tailwindBg} ${CONDITION_COLORS[condition].tailwindText} ring-2 ring-offset-2 ring-current`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Action</label>
              <textarea
                value={recommendedAction}
                onChange={e => setRecommendedAction(e.target.value)}
                placeholder="Enter recommended repairs or actions..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Photo Sections */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Photos</h2>
          <p className="text-sm text-gray-500 mb-6">Tap each box to capture or upload a photo. All 15 slots will appear in the PDF.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHOTO_SLOTS.map(slot => (
              <div key={slot.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Photo upload area */}
                <div className="relative">
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(slot.id, file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
                      {photos[slot.id]?.url ? (
                        <img
                          src={photos[slot.id].url!}
                          alt={slot.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs">Tap to add</span>
                        </div>
                      )}
                    </div>
                  </label>
                  {photos[slot.id]?.url && (
                    <button
                      onClick={() => handlePhotoRemove(slot.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Slot info */}
                <div className="p-3 bg-white">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{slot.label}</div>

                  {/* Condition selector */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {CONDITION_OPTIONS.map(condition => (
                      <button
                        key={condition}
                        onClick={() => handleConditionChange(slot.id, condition)}
                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          photos[slot.id]?.condition === condition
                            ? `${CONDITION_COLORS[condition].tailwindBg} ${CONDITION_COLORS[condition].tailwindText}`
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <input
                    type="text"
                    value={photos[slot.id]?.notes || ''}
                    onChange={e => handleNotesChange(slot.id, e.target.value)}
                    placeholder="Add notes..."
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* HIDDEN PRINT TEMPLATE */}
      <div
        ref={printRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '794px',
          backgroundColor: '#ffffff',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          padding: '32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'top', width: '50%' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.01em' }}>
                  Repair-First Roofing
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                  Professional Roof Inspection Services
                </div>
              </td>
              <td style={{ verticalAlign: 'top', width: '50%', textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Roof Inspection Report
                </div>
                <table style={{ marginLeft: 'auto', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '2px 8px', textAlign: 'right', color: '#64748B' }}>Report #:</td>
                      <td style={{ padding: '2px 8px', fontWeight: '600', color: '#0F172A' }}>{reportNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 8px', textAlign: 'right', color: '#64748B' }}>Date:</td>
                      <td style={{ padding: '2px 8px', fontWeight: '600', color: '#0F172A' }}>{date}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 8px', textAlign: 'right', color: '#64748B' }}>Inspector:</td>
                      <td style={{ padding: '2px 8px', fontWeight: '600', color: '#0F172A' }}>{inspectorName || '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '2px 8px', textAlign: 'right', color: '#64748B' }}>Phone:</td>
                      <td style={{ padding: '2px 8px', fontWeight: '600', color: '#0F172A' }}>{phone || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Navy divider */}
        <div style={{ height: '3px', backgroundColor: '#0F172A', marginBottom: '16px' }} />

        {/* Property info banner */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderLeft: '4px solid #0369A1',
          borderRadius: '4px',
          padding: '12px 16px',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
            {propertyAddress || 'No address provided'}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
            Owner: {ownerName || '—'}
          </div>
        </div>

        {/* Photo Grid - Table based, 2 columns */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>
            {Array.from({ length: Math.ceil(PHOTO_SLOTS.length / 2) }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {[0, 1].map(colIndex => {
                  const slotIndex = rowIndex * 2 + colIndex;
                  const slot = PHOTO_SLOTS[slotIndex];
                  if (!slot) return <td key={colIndex} style={{ width: '50%' }} />;
                  const photo = photos[slot.id];
                  const conditionStyle = CONDITION_COLORS[photo?.condition || 'N/A'];

                  return (
                    <td key={slot.id} style={{
                      width: '50%',
                      padding: '8px',
                      verticalAlign: 'top',
                    }}>
                      {/* Label */}
                      <div style={{
                        fontSize: '9px',
                        fontWeight: '600',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                      }}>
                        {slot.label}
                      </div>

                      {/* Photo box - fixed dimensions */}
                      <div style={{
                        width: '216px',
                        height: '150px',
                        backgroundColor: '#F1F5F9',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {photo?.url ? (
                          <img
                            src={photo.url}
                            alt={slot.label}
                            style={{
                              width: '216px',
                              height: '150px',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div style={{
                            fontSize: '10px',
                            color: '#94A3B8',
                            textAlign: 'center',
                          }}>
                            No photo
                          </div>
                        )}
                      </div>

                      {/* Condition badge */}
                      <div style={{ marginTop: '6px' }}>
                        <span style={{
                          backgroundColor: conditionStyle.bg,
                          color: conditionStyle.color,
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '9px',
                          fontWeight: '600',
                        }}>
                          {photo?.condition || 'N/A'}
                        </span>
                      </div>

                      {/* Notes */}
                      {photo?.notes && (
                        <div style={{
                          fontSize: '8px',
                          color: '#6B7280',
                          fontStyle: 'italic',
                          marginTop: '4px',
                        }}>
                          {photo.notes}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Block */}
        <div style={{ marginBottom: '24px' }}>
          {/* Overall condition banner */}
          <div style={{
            backgroundColor: CONDITION_COLORS[overallCondition].bg,
            borderRadius: '4px',
            padding: '12px 16px',
            marginBottom: '12px',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '10px', color: '#64748B', marginRight: '8px' }}>Overall Condition:</span>
                    <span style={{
                      backgroundColor: CONDITION_COLORS[overallCondition].color,
                      color: '#ffffff',
                      borderRadius: '4px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                    }}>
                      {overallCondition}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>
                      Est. Roof Age: <strong style={{ color: '#0F172A' }}>{roofAge || '—'} years</strong>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recommended Action */}
          <div style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '4px',
            padding: '12px 16px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
              Recommended Action
            </div>
            <div style={{ fontSize: '10px', color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {recommendedAction || 'No recommendations provided.'}
            </div>
          </div>

          {/* Signature line */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '32px' }}>
            <tbody>
              <tr>
                <td style={{ width: '60%', paddingRight: '24px' }}>
                  <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: '4px', paddingBottom: '24px' }} />
                  <div style={{ fontSize: '9px', color: '#64748B' }}>Inspector Signature</div>
                  <div style={{ fontSize: '10px', color: '#0F172A', fontWeight: '600', marginTop: '2px' }}>{inspectorName || '—'}</div>
                </td>
                <td style={{ width: '40%' }}>
                  <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: '4px', paddingBottom: '24px' }} />
                  <div style={{ fontSize: '9px', color: '#64748B' }}>Date</div>
                  <div style={{ fontSize: '10px', color: '#0F172A', fontWeight: '600', marginTop: '2px' }}>{date}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#0F172A',
          borderRadius: '4px',
          padding: '12px 16px',
          marginTop: '24px',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>
                  Repair-First Roofing
                </td>
                <td style={{ fontSize: '9px', color: '#64748B', textAlign: 'right' }}>
                  {reportNumber}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
