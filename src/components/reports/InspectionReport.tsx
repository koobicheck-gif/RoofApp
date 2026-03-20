import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '../ui';
import type { CompanyInfo } from '../../types';

const LOGO_STORAGE_KEY = 'roofapp_company_logo';
const COMPANY_STORAGE_KEY = 'roofapp_company_info';
const DRAFTS_STORAGE_KEY = 'roofapp_report_drafts';

// Helper to load and process image with proper orientation and aspect ratio
async function processImageForPdf(
  imageUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<{ dataUrl: string; width: number; height: number; x: number; y: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create canvas to process image (this applies EXIF orientation automatically in modern browsers)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Use natural dimensions (after browser applies EXIF orientation)
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // Calculate aspect ratios
      const imgAspect = imgWidth / imgHeight;
      const targetAspect = targetWidth / targetHeight;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX: number;
      let offsetY: number;

      // Fit image within target bounds while maintaining aspect ratio (contain)
      if (imgAspect > targetAspect) {
        // Image is wider than target - fit to width
        drawWidth = targetWidth;
        drawHeight = targetWidth / imgAspect;
        offsetX = 0;
        offsetY = (targetHeight - drawHeight) / 2;
      } else {
        // Image is taller than target - fit to height
        drawHeight = targetHeight;
        drawWidth = targetHeight * imgAspect;
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = 0;
      }

      // Set canvas to image dimensions for full quality
      canvas.width = imgWidth;
      canvas.height = imgHeight;

      // Draw image to canvas (applies EXIF orientation)
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      resolve({
        dataUrl,
        width: drawWidth,
        height: drawHeight,
        x: offsetX,
        y: offsetY,
      });
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageUrl;
  });
}

interface ReportDraft {
  id: string;
  savedAt: string;
  reportNumber: string;
  date: string;
  propertyAddress: string;
  clientName: string;
  inspectorName: string;
  phone: string;
  roofAge: string;
  overallCondition: ConditionType;
  recommendedAction: string;
  photos: PhotoState;
  additionalPhotos: AdditionalPhoto[];
}

const DEFAULT_COMPANY: CompanyInfo = {
  name: 'Roof Repair Partners',
  tagline: '',
  phone: '',
  email: '',
  website: '',
};

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
  label: string;
}

type PhotoState = Record<string, PhotoData>;

interface AdditionalPhoto {
  id: string;
  url: string;
  condition: ConditionType;
  notes: string;
  label: string;
}

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

  // PDF Preview state
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pendingPdfDoc, setPendingPdfDoc] = useState<{ save: (filename: string) => void } | null>(null);

  // Form state
  const [reportNumber, setReportNumber] = useState(generateReportNumber);
  const [date, setDate] = useState(getTodayDate);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [phone, setPhone] = useState('');
  const [roofAge, setRoofAge] = useState('');
  const [overallCondition, setOverallCondition] = useState<ConditionType>('Good');
  const [recommendedAction, setRecommendedAction] = useState('');

  // Photo state for fixed slots
  const [photos, setPhotos] = useState<PhotoState>(() => {
    const initial: PhotoState = {};
    PHOTO_SLOTS.forEach(slot => {
      initial[slot.id] = { url: null, condition: 'N/A', notes: '', label: slot.label };
    });
    return initial;
  });

  // Additional photos state
  const [additionalPhotos, setAdditionalPhotos] = useState<AdditionalPhoto[]>([]);

  // Company branding
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY);

  // Draft management
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<ReportDraft[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  // Load drafts from localStorage
  const loadDrafts = useCallback(() => {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch {
        setDrafts([]);
      }
    }
  }, []);

  // Save current form as draft
  const saveDraft = useCallback(() => {
    const draftId = currentDraftId || `draft-${Date.now()}`;
    const draft: ReportDraft = {
      id: draftId,
      savedAt: new Date().toISOString(),
      reportNumber,
      date,
      propertyAddress,
      clientName,
      inspectorName,
      phone,
      roofAge,
      overallCondition,
      recommendedAction,
      photos,
      additionalPhotos,
    };

    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    let existingDrafts: ReportDraft[] = [];
    if (stored) {
      try {
        existingDrafts = JSON.parse(stored);
      } catch {
        existingDrafts = [];
      }
    }

    // Update existing or add new
    const draftIndex = existingDrafts.findIndex(d => d.id === draftId);
    if (draftIndex >= 0) {
      existingDrafts[draftIndex] = draft;
    } else {
      existingDrafts.unshift(draft);
    }

    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(existingDrafts));
    setDrafts(existingDrafts);
    setCurrentDraftId(draftId);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }, [currentDraftId, reportNumber, date, propertyAddress, clientName, inspectorName, phone, roofAge, overallCondition, recommendedAction, photos, additionalPhotos]);

  // Load a draft into the form
  const loadDraft = useCallback((draft: ReportDraft) => {
    setReportNumber(draft.reportNumber);
    setDate(draft.date);
    setPropertyAddress(draft.propertyAddress);
    setClientName(draft.clientName);
    setInspectorName(draft.inspectorName);
    setPhone(draft.phone);
    setRoofAge(draft.roofAge);
    setOverallCondition(draft.overallCondition);
    setRecommendedAction(draft.recommendedAction);
    setPhotos(draft.photos);
    setAdditionalPhotos(draft.additionalPhotos);
    setCurrentDraftId(draft.id);
    setShowDraftsModal(false);
  }, []);

  // Delete a draft
  const deleteDraft = useCallback((draftId: string) => {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (stored) {
      try {
        const existingDrafts: ReportDraft[] = JSON.parse(stored);
        const filtered = existingDrafts.filter(d => d.id !== draftId);
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filtered));
        setDrafts(filtered);
        if (currentDraftId === draftId) {
          setCurrentDraftId(null);
        }
      } catch {
        // Ignore
      }
    }
  }, [currentDraftId]);

  // Start new report (clear form)
  const startNewReport = useCallback(() => {
    setReportNumber(generateReportNumber());
    setDate(getTodayDate());
    setPropertyAddress('');
    setClientName('');
    setInspectorName('');
    setPhone('');
    setRoofAge('');
    setOverallCondition('Good');
    setRecommendedAction('');
    const initial: PhotoState = {};
    PHOTO_SLOTS.forEach(slot => {
      initial[slot.id] = { url: null, condition: 'N/A', notes: '', label: slot.label };
    });
    setPhotos(initial);
    setAdditionalPhotos([]);
    setCurrentDraftId(null);
    setShowDraftsModal(false);
  }, []);

  // Load company branding and drafts on mount
  useEffect(() => {
    const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (storedLogo) setLogoUrl(storedLogo);

    const storedCompany = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (storedCompany) {
      try {
        setCompanyInfo(JSON.parse(storedCompany));
      } catch {
        // Use default
      }
    }

    loadDrafts();
  }, [loadDrafts]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(photos).forEach(photo => {
        if (photo.url) URL.revokeObjectURL(photo.url);
      });
      additionalPhotos.forEach(photo => {
        if (photo.url) URL.revokeObjectURL(photo.url);
      });
    };
  }, []);

  const handlePhotoUpload = useCallback((slotId: string, file: File) => {
    // Convert to base64 data URL for localStorage persistence
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotos(prev => {
        // No need to revoke data URLs (they're not blob URLs)
        return {
          ...prev,
          [slotId]: { ...prev[slotId], url: dataUrl },
        };
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoRemove = useCallback((slotId: string) => {
    setPhotos(prev => ({
      ...prev,
      [slotId]: { ...prev[slotId], url: null },
    }));
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

  // Additional photo handlers
  const handleAddPhoto = useCallback((file: File) => {
    // Convert to base64 data URL for localStorage persistence
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const id = `additional-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setAdditionalPhotos(prev => [
        ...prev,
        { id, url: dataUrl, condition: 'N/A', notes: '', label: `Additional Photo ${prev.length + 1}` },
      ]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAdditionalPhotoRemove = useCallback((id: string) => {
    setAdditionalPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleAdditionalConditionChange = useCallback((id: string, condition: ConditionType) => {
    setAdditionalPhotos(prev =>
      prev.map(p => (p.id === id ? { ...p, condition } : p))
    );
  }, []);

  const handleAdditionalNotesChange = useCallback((id: string, notes: string) => {
    setAdditionalPhotos(prev =>
      prev.map(p => (p.id === id ? { ...p, notes } : p))
    );
  }, []);

  const handleAdditionalLabelChange = useCallback((id: string, label: string) => {
    setAdditionalPhotos(prev =>
      prev.map(p => (p.id === id ? { ...p, label } : p))
    );
  }, []);

  const handlePreviewPDF = async () => {
    setIsGenerating(true);

    if (downloadBtnRef.current) {
      downloadBtnRef.current.style.visibility = 'hidden';
    }

    try {
      const { default: jsPDF } = await import('jspdf');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth(); // 210mm
      const pageH = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      // Colors
      const navy = '#00224a';
      const blue = '#0369A1';
      const darkGray = '#0F172A';
      const medGray = '#64748B';
      const lightGray = '#F8FAFC';

      // Helper to check if we need a new page
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageH - margin) {
          pdf.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // ===== HEADER =====
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(navy);
      pdf.text(companyInfo.name, margin, y + 6);

      if (companyInfo.tagline) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(medGray);
        pdf.text(companyInfo.tagline, margin, y + 11);
      }

      // Report title on right
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(blue);
      pdf.text('ROOF INSPECTION REPORT', pageW - margin, y + 4, { align: 'right' });

      // Report details
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(medGray);
      const detailsY = y + 10;
      pdf.text(`Report #: ${reportNumber}`, pageW - margin, detailsY, { align: 'right' });
      pdf.text(`Date: ${date}`, pageW - margin, detailsY + 4, { align: 'right' });
      pdf.text(`Inspector: ${inspectorName || '—'}`, pageW - margin, detailsY + 8, { align: 'right' });
      pdf.text(`Phone: ${phone || '—'}`, pageW - margin, detailsY + 12, { align: 'right' });

      y += 28;

      // Navy divider
      pdf.setFillColor(navy);
      pdf.rect(margin, y, contentW, 1.5, 'F');
      y += 6;

      // ===== PROPERTY INFO =====
      pdf.setFillColor(lightGray);
      pdf.rect(margin, y, contentW, 16, 'F');
      pdf.setDrawColor(blue);
      pdf.setLineWidth(1);
      pdf.line(margin, y, margin, y + 16);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(darkGray);
      pdf.text(propertyAddress || 'No address provided', margin + 5, y + 6);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(medGray);
      pdf.text(`Client: ${clientName || '—'}`, margin + 5, y + 12);

      y += 22;

      // ===== PHOTOS =====
      if (photosWithImages.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(blue);
        pdf.text('INSPECTION PHOTOS', margin, y);
        y += 6;

        const photoW = (contentW - 6) / 2; // Two photos per row with gap
        const photoH = 55; // Height for each photo block
        const photoImgH = 42; // Actual image height

        // Pre-process all images for proper orientation and aspect ratio
        const processedImages = await Promise.all(
          photosWithImages.map(async (photo) => {
            if (!photo.url) return null;
            // Convert mm to pixels (assuming 96 DPI, 1mm ≈ 3.78 pixels)
            const targetWidthPx = (photoW - 2) * 3.78;
            const targetHeightPx = (photoImgH - 2) * 3.78;
            return processImageForPdf(photo.url, targetWidthPx, targetHeightPx);
          })
        );

        for (let i = 0; i < photosWithImages.length; i += 2) {
          // Check if we need a new page for this row of photos
          checkPageBreak(photoH + 8);

          for (let j = 0; j < 2; j++) {
            const photoIndex = i + j;
            if (photoIndex >= photosWithImages.length) break;

            const photo = photosWithImages[photoIndex];
            const x = margin + j * (photoW + 6);

            // Photo label
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(medGray);
            pdf.text(photo.label.toUpperCase(), x, y + 3);

            // Photo placeholder/image
            pdf.setFillColor('#E2E8F0');
            pdf.rect(x, y + 5, photoW, photoImgH, 'F');

            // Try to add the actual image with proper orientation and aspect ratio
            const processed = processedImages[photoIndex];
            if (processed) {
              try {
                // Convert pixel offsets back to mm
                const offsetXMm = processed.x / 3.78;
                const offsetYMm = processed.y / 3.78;
                const drawWMm = processed.width / 3.78;
                const drawHMm = processed.height / 3.78;

                pdf.addImage(
                  processed.dataUrl,
                  'JPEG',
                  x + 1 + offsetXMm,
                  y + 6 + offsetYMm,
                  drawWMm,
                  drawHMm,
                  undefined,
                  'MEDIUM'
                );
              } catch {
                // Keep placeholder if image fails
              }
            }

            // Condition badge
            const conditionColors: Record<string, { bg: string; text: string }> = {
              Good: { bg: '#DCFCE7', text: '#166534' },
              Fair: { bg: '#FEF3C7', text: '#92400E' },
              Poor: { bg: '#FEE2E2', text: '#991B1B' },
              'N/A': { bg: '#F1F5F9', text: '#475569' },
            };
            const cond = photo.condition || 'N/A';
            const condColor = conditionColors[cond] || conditionColors['N/A'];

            const badgeX = x;
            const badgeY = y + photoImgH + 7;
            const badgeW = 18;
            const badgeH = 6;

            pdf.setFillColor(condColor.bg);
            pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, 'F');
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(condColor.text);
            // Center text: x + width/2 for horizontal, y + height/2 + fontSize/3 for vertical
            pdf.text(cond, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1, { align: 'center' });

            // Notes if any
            if (photo.notes) {
              pdf.setFontSize(7);
              pdf.setFont('helvetica', 'italic');
              pdf.setTextColor(medGray);
              const noteText = photo.notes.length > 40 ? photo.notes.substring(0, 40) + '...' : photo.notes;
              pdf.text(noteText, x + 20, y + photoImgH + 10.5);
            }
          }

          y += photoH;
        }

        y += 4;
      }

      // ===== OVERALL ASSESSMENT =====
      checkPageBreak(35);

      const conditionColors: Record<string, { bg: string; badge: string }> = {
        Good: { bg: '#DCFCE7', badge: '#166534' },
        Fair: { bg: '#FEF3C7', badge: '#92400E' },
        Poor: { bg: '#FEE2E2', badge: '#991B1B' },
      };
      const condStyle = conditionColors[overallCondition] || conditionColors.Good;

      // Condition banner
      pdf.setFillColor(condStyle.bg);
      pdf.rect(margin, y, contentW, 14, 'F');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(medGray);
      pdf.text('Overall Condition:', margin + 4, y + 6);

      // Condition badge
      const overallBadgeX = margin + 35;
      const overallBadgeY = y + 3;
      const overallBadgeW = 24;
      const overallBadgeH = 8;

      pdf.setFillColor(condStyle.badge);
      pdf.roundedRect(overallBadgeX, overallBadgeY, overallBadgeW, overallBadgeH, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#ffffff');
      // Center text: x + width/2 for horizontal, y + height/2 + fontSize/3 for vertical
      pdf.text(overallCondition, overallBadgeX + overallBadgeW / 2, overallBadgeY + overallBadgeH / 2 + 1.2, { align: 'center' });

      // Roof age on right
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(medGray);
      pdf.text(`Est. Roof Age: `, pageW - margin - 30, y + 9, { align: 'right' });
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(darkGray);
      pdf.text(`${roofAge || '—'} years`, pageW - margin - 4, y + 9, { align: 'right' });

      y += 18;

      // ===== RECOMMENDED ACTION =====
      checkPageBreak(30);

      pdf.setFillColor(lightGray);
      pdf.rect(margin, y, contentW, 24, 'F');

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(medGray);
      pdf.text('RECOMMENDED ACTION', margin + 4, y + 5);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(darkGray);
      const actionLines = pdf.splitTextToSize(recommendedAction || 'No recommendations provided.', contentW - 8);
      pdf.text(actionLines.slice(0, 3), margin + 4, y + 11);

      y += 28;

      // ===== SIGNATURE SECTION =====
      checkPageBreak(30);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(medGray);
      pdf.text('SIGNATURES', margin, y);
      y += 6;

      // Inspector signature line
      pdf.setDrawColor(medGray);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y + 12, margin + 70, y + 12);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Inspector Signature', margin, y + 16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(darkGray);
      pdf.text(inspectorName || '—', margin, y + 20);

      // Date line
      pdf.setDrawColor(medGray);
      pdf.line(margin + 90, y + 12, margin + 130, y + 12);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(medGray);
      pdf.text('Date', margin + 90, y + 16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(darkGray);
      pdf.text(date, margin + 90, y + 20);

      y += 26;

      // ===== FOOTER =====
      checkPageBreak(14);

      pdf.setFillColor(navy);
      pdf.rect(margin, y, contentW, 10, 'F');

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#94A3B8');
      pdf.text(companyInfo.name, margin + 4, y + 6.5);

      pdf.setFontSize(7);
      pdf.setTextColor(medGray);
      pdf.text(reportNumber, pageW - margin - 4, y + 6.5, { align: 'right' });

      // Create blob URL for preview
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Clean up old blob URL if exists
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }

      setPdfBlobUrl(blobUrl);
      setPendingPdfDoc(pdf);
      setShowPdfPreview(true);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      if (downloadBtnRef.current) {
        downloadBtnRef.current.style.visibility = 'visible';
      }
      setIsGenerating(false);
    }
  };

  const handleConfirmDownload = () => {
    if (pendingPdfDoc) {
      const safeName = (propertyAddress || 'report').replace(/[^a-z0-9]/gi, '-');
      const safeDate = date.replace(/[^a-z0-9]/gi, '-');
      pendingPdfDoc.save(`RRP-Inspection-${safeName}-${safeDate}.pdf`);
    }
    handleClosePdfPreview();
  };

  const handleClosePdfPreview = () => {
    setShowPdfPreview(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPendingPdfDoc(null);
  };

  // Combine all photos for print template
  const allPhotosForPrint = [
    ...PHOTO_SLOTS.map(slot => ({
      id: slot.id,
      ...photos[slot.id],
    })),
    ...additionalPhotos,
  ];

  // Only show photos with images in PDF
  const photosWithImages = allPhotosForPrint.filter(p => p.url);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Drafts Modal */}
      {showDraftsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Saved Drafts</h2>
                <p className="text-xs sm:text-sm text-slate-500">{drafts.length} draft{drafts.length !== 1 ? 's' : ''} available</p>
              </div>
              <button
                onClick={() => setShowDraftsModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[50vh]">
              {drafts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500">No saved drafts yet</p>
                  <p className="text-sm text-slate-400 mt-1">Click "Save Draft" to save your work</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {drafts.map(draft => (
                    <div
                      key={draft.id}
                      className={`px-6 py-4 hover:bg-slate-50 transition-colors ${currentDraftId === draft.id ? 'bg-violet-50 border-l-4 border-violet-500' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 truncate">
                            {draft.propertyAddress || 'Untitled Report'}
                          </div>
                          <div className="text-sm text-slate-500 mt-0.5">
                            {draft.clientName && <span>{draft.clientName} &bull; </span>}
                            <span>{draft.reportNumber}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Saved {new Date(draft.savedAt).toLocaleDateString()} at {new Date(draft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => loadDraft(draft)}
                            className="px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this draft?')) {
                                deleteDraft(draft.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
              <button
                onClick={startNewReport}
                className="flex items-center justify-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 font-medium rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start New Report
              </button>
              <button
                onClick={() => setShowDraftsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {showPdfPreview && pdfBlobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Preview PDF</h2>
                <p className="text-xs sm:text-sm text-slate-500">Review before downloading</p>
              </div>
              <button
                onClick={handleClosePdfPreview}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-slate-200 min-h-0">
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px]"
                title="PDF Preview"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-white">
              <button
                onClick={handleClosePdfPreview}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25 text-sm sm:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Mobile: Two rows, Desktop: Single row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Logo and title */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">Inspection Report</h1>
                <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Create professional roof inspection reports</p>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Draft indicator - desktop only */}
              {currentDraftId && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-medium text-amber-700">Draft</span>
                </div>
              )}

              {/* Photo count - tablet+ */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${photosWithImages.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-sm text-slate-600">{photosWithImages.length} photo{photosWithImages.length !== 1 ? 's' : ''}</span>
              </div>

              {/* New Report - desktop only */}
              <button
                onClick={startNewReport}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm">New</span>
              </button>

              {/* Load Drafts */}
              <button
                onClick={() => setShowDraftsModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-lg transition-colors relative"
                title="View Drafts"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="text-sm hidden sm:inline">Drafts</span>
                {drafts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {drafts.length}
                  </span>
                )}
              </button>

              {/* Save Draft */}
              <button
                onClick={saveDraft}
                className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                title="Save Draft"
              >
                {draftSaved ? (
                  <>
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-600 hidden sm:inline">Saved!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="text-sm hidden sm:inline">Save</span>
                  </>
                )}
              </button>

            {/* Download PDF */}
            <button
              ref={downloadBtnRef}
              onClick={handlePreviewPDF}
              disabled={isGenerating}
              className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-semibold rounded-xl flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 text-sm sm:text-base"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="hidden xs:inline">Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden xs:inline">Download</span>
                  <span className="xs:hidden">PDF</span>
                </>
              )}
            </button>
            </div>
          </div>

          {/* Mobile-only: Photo count and draft indicator */}
          <div className="flex items-center justify-between mt-2 sm:hidden">
            <div className="flex items-center gap-2">
              {currentDraftId && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-medium text-amber-700">Draft</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md">
                <div className={`w-1.5 h-1.5 rounded-full ${photosWithImages.length > 0 ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-slate-600">{photosWithImages.length} photo{photosWithImages.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <button
              onClick={startNewReport}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Report
            </button>
          </div>
        </div>
      </div>

      {/* Split Layout: Form + Live Preview */}
      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Left: Form Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Report Info */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Report Information</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Report #</label>
              <input
                type="text"
                value={reportNumber}
                readOnly
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Inspector</label>
              <input
                type="text"
                value={inspectorName}
                onChange={e => setInspectorName(e.target.value)}
                placeholder="Name"
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(xxx) xxx-xxxx"
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Property Info */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Property Information</h2>
          <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div className="col-span-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Property Address</label>
              <input
                type="text"
                value={propertyAddress}
                onChange={e => setPropertyAddress(e.target.value)}
                placeholder="Full address"
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Client name"
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Roof Age (years)</label>
              <input
                type="number"
                value={roofAge}
                onChange={e => setRoofAge(e.target.value)}
                placeholder="Age"
                min="0"
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>
        </Card>

        {/* Overall Assessment */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Overall Assessment</h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Overall Condition</label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(['Good', 'Fair', 'Poor'] as ConditionType[]).map(condition => (
                  <button
                    key={condition}
                    onClick={() => setOverallCondition(condition)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all ${
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
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Recommended Action</label>
              <textarea
                value={recommendedAction}
                onChange={e => setRecommendedAction(e.target.value)}
                placeholder="Enter recommended repairs or actions..."
                rows={3}
                className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Photo Sections */}
        <Card>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4">Inspection Photos</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Tap each box to capture or upload a photo. Only photos with images will appear in the PDF.</p>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
            {PHOTO_SLOTS.map(slot => (
              <div key={slot.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Photo upload area */}
                <div className="relative">
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(slot.id, file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <div className={`bg-gray-100 ${photos[slot.id]?.url ? '' : 'aspect-[4/3] relative'}`}>
                      {photos[slot.id]?.url ? (
                        <img
                          src={photos[slot.id].url!}
                          alt={slot.label}
                          className="w-full h-auto block"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400">
                          <div>
                            <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs">Tap to add</span>
                          </div>
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
                <div className="p-2 sm:p-3 bg-white">
                  <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 sm:mb-2 truncate">{slot.label}</div>

                  {/* Condition selector */}
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mb-1.5 sm:mb-2">
                    {CONDITION_OPTIONS.map(condition => (
                      <button
                        key={condition}
                        onClick={() => handleConditionChange(slot.id, condition)}
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded font-medium transition-colors ${
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
                    placeholder="Notes..."
                    className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Additional Photos Section */}
        <Card>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Additional Photos</h2>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleAddPhoto(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden xs:inline">Add Photo</span>
                <span className="xs:hidden">Add</span>
              </span>
            </label>
          </div>

          {additionalPhotos.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">No additional photos added. Tap "Add" to include more images.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {additionalPhotos.map(photo => (
                <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Photo */}
                  <div className="relative">
                    <div className="bg-gray-100">
                      <img
                        src={photo.url}
                        alt={photo.label}
                        className="w-full h-auto block"
                      />
                    </div>
                    <button
                      onClick={() => handleAdditionalPhotoRemove(photo.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Photo info */}
                  <div className="p-2 sm:p-3 bg-white space-y-1.5 sm:space-y-2">
                    {/* Editable label */}
                    <input
                      type="text"
                      value={photo.label}
                      onChange={e => handleAdditionalLabelChange(photo.id, e.target.value)}
                      placeholder="Label..."
                      className="w-full px-2 py-1 text-[10px] sm:text-xs font-medium text-gray-700 uppercase tracking-wide border border-gray-200 rounded focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                    />

                    {/* Condition selector */}
                    <div className="flex flex-wrap gap-0.5 sm:gap-1">
                      {CONDITION_OPTIONS.map(condition => (
                        <button
                          key={condition}
                          onClick={() => handleAdditionalConditionChange(photo.id, condition)}
                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded font-medium transition-colors ${
                            photo.condition === condition
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
                      value={photo.notes}
                      onChange={e => handleAdditionalNotesChange(photo.id, e.target.value)}
                      placeholder="Notes..."
                      className="w-full px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
          </div>
        </div>

        {/* Right: Live Preview Panel */}
        <div className="hidden lg:block w-[500px] xl:w-[560px] border-l border-slate-200 bg-slate-100 sticky top-[73px] h-[calc(100vh-73px)] overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-semibold text-slate-700">Live Preview</span>
              </div>
              <span className="text-xs text-slate-400">Updates in real-time</span>
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-57px)] p-4">
            <div
              className="bg-white rounded-lg shadow-xl shadow-slate-200/50 overflow-hidden"
              style={{
                transform: 'scale(0.58)',
                transformOrigin: 'top left',
                width: '794px',
                marginBottom: '-300px'
              }}
            >
              {/* Live Preview Content - mirrors the print template */}
              <div style={{
                width: '794px',
                backgroundColor: '#ffffff',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: '24px',
                boxSizing: 'border-box',
              }}>
                {/* Header */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                  <tbody>
                    <tr>
                      <td style={{ verticalAlign: 'middle', width: '50%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {logoUrl && (
                            <img
                              src={logoUrl}
                              alt={companyInfo.name}
                              style={{ height: '56px', width: 'auto' }}
                            />
                          )}
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: '700', color: '#00224a', letterSpacing: '-0.01em' }}>
                              {companyInfo.name}
                            </div>
                            {companyInfo.tagline && (
                              <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                                {companyInfo.tagline}
                              </div>
                            )}
                          </div>
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
                <div style={{ height: '3px', backgroundColor: '#00224a', marginBottom: '16px' }} />

                {/* Property info banner */}
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderLeft: '4px solid #0369A1',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
                    {propertyAddress || 'No address provided'}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
                    Client: {clientName || '—'}
                  </div>
                </div>

                {/* Photo preview - show first 4 */}
                {photosWithImages.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                    <tbody>
                      {Array.from({ length: Math.min(2, Math.ceil(photosWithImages.length / 2)) }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                          {[0, 1].map(colIndex => {
                            const photoIndex = rowIndex * 2 + colIndex;
                            const photo = photosWithImages[photoIndex];
                            if (!photo) return <td key={colIndex} style={{ width: '50%' }} />;
                            const conditionStyle = CONDITION_COLORS[photo.condition || 'N/A'];

                            return (
                              <td key={photo.id} style={{
                                width: '50%',
                                padding: '6px',
                                verticalAlign: 'top',
                              }}>
                                <div style={{
                                  fontSize: '9px',
                                  fontWeight: '600',
                                  color: '#374151',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  marginBottom: '4px',
                                }}>
                                  {photo.label}
                                </div>
                                <div style={{
                                  width: '350px',
                                  height: '180px',
                                  backgroundColor: '#F1F5F9',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  <img
                                    src={photo.url!}
                                    alt={photo.label}
                                    style={{
                                      maxWidth: '350px',
                                      maxHeight: '180px',
                                      width: 'auto',
                                      height: 'auto',
                                      objectFit: 'contain',
                                    }}
                                  />
                                </div>
                                <div style={{
                                  marginTop: '6px',
                                  display: 'inline-block',
                                  backgroundColor: conditionStyle.bg,
                                  color: conditionStyle.color,
                                  borderRadius: '4px',
                                  padding: '3px 10px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  lineHeight: '1.2',
                                }}>
                                  {photo.condition || 'N/A'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {photosWithImages.length > 4 && (
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    color: '#64748B',
                    fontSize: '10px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '4px',
                    marginBottom: '16px',
                  }}>
                    + {photosWithImages.length - 4} more photo{photosWithImages.length - 4 !== 1 ? 's' : ''} in full PDF
                  </div>
                )}

                {photosWithImages.length === 0 && (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#94A3B8',
                    fontSize: '11px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '4px',
                    marginBottom: '16px',
                  }}>
                    No inspection photos included
                  </div>
                )}

                {/* Summary Block */}
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
                          <span style={{ fontSize: '10px', color: '#64748B', marginRight: '8px', verticalAlign: 'middle' }}>Overall Condition:</span>
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: CONDITION_COLORS[overallCondition].color,
                            color: '#ffffff',
                            borderRadius: '4px',
                            padding: '5px 14px',
                            fontSize: '11px',
                            fontWeight: '600',
                            lineHeight: '1',
                            verticalAlign: 'middle',
                          }}>
                            {overallCondition}
                          </div>
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
                  marginBottom: '20px',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Recommended Action
                  </div>
                  <div style={{ fontSize: '10px', color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                    {recommendedAction || 'No recommendations provided.'}
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  backgroundColor: '#00224a',
                  borderRadius: '4px',
                  padding: '12px 16px',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>
                          {companyInfo.name}
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
          </div>
        </div>
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
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'middle', width: '50%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt={companyInfo.name}
                      style={{ height: '56px', width: 'auto' }}
                    />
                  )}
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#00224a', letterSpacing: '-0.01em' }}>
                      {companyInfo.name}
                    </div>
                    {companyInfo.tagline && (
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>
                        {companyInfo.tagline}
                      </div>
                    )}
                  </div>
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
        <div style={{ height: '3px', backgroundColor: '#00224a', marginBottom: '16px' }} />

        {/* Property info banner */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderLeft: '4px solid #0369A1',
          borderRadius: '4px',
          padding: '12px 16px',
          marginBottom: '16px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>
            {propertyAddress || 'No address provided'}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>
            Client: {clientName || '—'}
          </div>
        </div>

        {/* Photo Grid - Table based, 2 columns - Only photos with images */}
        {photosWithImages.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <tbody>
              {Array.from({ length: Math.ceil(photosWithImages.length / 2) }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[0, 1].map(colIndex => {
                    const photoIndex = rowIndex * 2 + colIndex;
                    const photo = photosWithImages[photoIndex];
                    if (!photo) return <td key={colIndex} style={{ width: '50%' }} />;
                    const conditionStyle = CONDITION_COLORS[photo.condition || 'N/A'];

                    return (
                      <td key={photo.id} style={{
                        width: '50%',
                        padding: '6px',
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
                          {photo.label}
                        </div>

                        {/* Photo box - auto-adjusts to maintain aspect ratio */}
                        <div style={{
                          width: '350px',
                          height: '230px',
                          backgroundColor: '#F1F5F9',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <img
                            src={photo.url!}
                            alt={photo.label}
                            style={{
                              maxWidth: '350px',
                              maxHeight: '230px',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                            }}
                          />
                        </div>

                        {/* Condition badge */}
                        <div style={{
                          marginTop: '6px',
                          display: 'inline-block',
                          backgroundColor: conditionStyle.bg,
                          color: conditionStyle.color,
                          borderRadius: '4px',
                          padding: '3px 10px',
                          fontSize: '10px',
                          fontWeight: '600',
                          lineHeight: '1.2',
                        }}>
                          {photo.condition || 'N/A'}
                        </div>

                        {/* Notes */}
                        {photo.notes && (
                          <div style={{
                            fontSize: '8px',
                            color: '#6B7280',
                            fontStyle: 'italic',
                            marginTop: '2px',
                            maxWidth: '350px',
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
        )}

        {photosWithImages.length === 0 && (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: '#94A3B8',
            fontSize: '11px',
            backgroundColor: '#F8FAFC',
            borderRadius: '4px',
            marginBottom: '16px',
          }}>
            No inspection photos included
          </div>
        )}

        {/* Summary Block */}
        <div style={{ marginBottom: '20px' }}>
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
                    <span style={{ fontSize: '10px', color: '#64748B', marginRight: '8px', verticalAlign: 'middle' }}>Overall Condition:</span>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: CONDITION_COLORS[overallCondition].color,
                      color: '#ffffff',
                      borderRadius: '4px',
                      padding: '5px 14px',
                      fontSize: '11px',
                      fontWeight: '600',
                      lineHeight: '1',
                      verticalAlign: 'middle',
                    }}>
                      {overallCondition}
                    </div>
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
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
              Recommended Action
            </div>
            <div style={{ fontSize: '10px', color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
              {recommendedAction || 'No recommendations provided.'}
            </div>
          </div>

          {/* Signature line */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
            <tbody>
              <tr>
                <td style={{ width: '60%', paddingRight: '24px' }}>
                  <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: '4px', paddingBottom: '20px' }} />
                  <div style={{ fontSize: '9px', color: '#64748B' }}>Inspector Signature</div>
                  <div style={{ fontSize: '10px', color: '#0F172A', fontWeight: '600', marginTop: '2px' }}>{inspectorName || '—'}</div>
                </td>
                <td style={{ width: '40%' }}>
                  <div style={{ borderBottom: '1px solid #CBD5E1', marginBottom: '4px', paddingBottom: '20px' }} />
                  <div style={{ fontSize: '9px', color: '#64748B' }}>Date</div>
                  <div style={{ fontSize: '10px', color: '#0F172A', fontWeight: '600', marginTop: '2px' }}>{date}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#00224a',
          borderRadius: '4px',
          padding: '12px 16px',
          marginTop: '20px',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '600' }}>
                  {companyInfo.name}
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
