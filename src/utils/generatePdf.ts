import { jsPDF } from 'jspdf';
import type { Estimate, EstimateCalculation, CompanyInfo } from '../types';
import { formatCurrency, formatDate } from './calculateEstimate';
import { SHINGLE_TYPE_NAMES } from '../data/defaultPricing';

interface GeneratePdfOptions {
  estimate: Estimate;
  calculation: EstimateCalculation;
  companyInfo: CompanyInfo;
  showDetailedPricing?: boolean;
}

export async function generateEstimatePdf(options: GeneratePdfOptions): Promise<jsPDF> {
  const { estimate, calculation, companyInfo, showDetailedPricing = false } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [30, 64, 175]; // Blue
  const darkGray: [number, number, number] = [55, 65, 81];
  const lightGray: [number, number, number] = [156, 163, 175];

  // ============================================================
  // HEADER
  // ============================================================
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, margin, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo.tagline, margin, 22);

  // Contact info on right
  doc.setFontSize(9);
  const contactY = 12;
  doc.text(companyInfo.phone, pageWidth - margin, contactY, { align: 'right' });
  doc.text(companyInfo.email, pageWidth - margin, contactY + 5, { align: 'right' });
  doc.text(companyInfo.website, pageWidth - margin, contactY + 10, { align: 'right' });

  y = 45;

  // ============================================================
  // ESTIMATE INFO BAR
  // ============================================================
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y, contentWidth, 20, 'F');

  doc.setTextColor(...darkGray);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REPAIR ESTIMATE', margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`#${estimate.estimateNumber}`, margin + 5, y + 15);

  doc.text(`Date: ${formatDate(estimate.createdAt)}`, pageWidth - margin - 5, y + 8, { align: 'right' });
  doc.text(`Valid for 30 days`, pageWidth - margin - 5, y + 15, { align: 'right' });

  y += 28;

  // ============================================================
  // CUSTOMER INFO
  // ============================================================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('CUSTOMER', margin, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);

  if (estimate.customer.name) {
    doc.text(estimate.customer.name, margin, y);
    y += 5;
  }
  if (estimate.customer.address) {
    doc.text(estimate.customer.address, margin, y);
    y += 5;
  }
  const cityStateZip = [
    estimate.customer.city,
    estimate.customer.state,
    estimate.customer.zip,
  ].filter(Boolean).join(', ');
  if (cityStateZip) {
    doc.text(cityStateZip, margin, y);
    y += 5;
  }
  if (estimate.customer.phone) {
    doc.text(`Phone: ${estimate.customer.phone}`, margin, y);
    y += 5;
  }
  if (estimate.customer.email) {
    doc.text(`Email: ${estimate.customer.email}`, margin, y);
    y += 5;
  }

  y += 5;

  // Shingle type
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  doc.setFontSize(10);
  doc.text(`Shingle Type: ${SHINGLE_TYPE_NAMES[estimate.shingleType]}`, margin + 5, y + 7);

  y += 18;

  // ============================================================
  // LINE ITEMS
  // ============================================================
  const hasShingleRepairs = calculation.shingleLineItems.length > 0;
  const hasAdditionalRepairs = calculation.additionalRepairLineItems.length > 0 || calculation.customRepairLineItems.length > 0;

  // Table header
  const drawTableHeader = () => {
    doc.setFillColor(...primaryColor);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin + 3, y + 5.5);
    doc.text('Qty', margin + 100, y + 5.5);
    if (showDetailedPricing) {
      doc.text('Material', margin + 120, y + 5.5);
      doc.text('Labor', margin + 145, y + 5.5);
    }
    doc.text('Total', pageWidth - margin - 3, y + 5.5, { align: 'right' });
    y += 10;
  };

  // Draw line item
  const drawLineItem = (description: string, qty: string, material: number, labor: number, total: number, isAlt: boolean) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    if (isAlt) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 1, contentWidth, 7, 'F');
    }

    doc.setTextColor(...darkGray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(description, margin + 3, y + 4);
    doc.text(qty, margin + 100, y + 4);
    if (showDetailedPricing) {
      doc.text(formatCurrency(material), margin + 120, y + 4);
      doc.text(formatCurrency(labor), margin + 145, y + 4);
    }
    doc.text(formatCurrency(total), pageWidth - margin - 3, y + 4, { align: 'right' });
    y += 7;
  };

  // Shingle Repairs
  if (hasShingleRepairs) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('SHINGLE REPAIRS', margin, y);
    y += 6;

    drawTableHeader();

    calculation.shingleLineItems.forEach((item, index) => {
      drawLineItem(
        item.description,
        `${item.quantity} ${item.unit}`,
        item.material,
        item.labor,
        item.subtotal,
        index % 2 === 1
      );
    });

    // Subtotal
    doc.setDrawColor(...lightGray);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Shingle Repairs Subtotal:', margin + 100, y);
    doc.text(formatCurrency(calculation.shingleSubtotal), pageWidth - margin - 3, y, { align: 'right' });
    y += 10;
  }

  // Additional Repairs
  if (hasAdditionalRepairs) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('ADDITIONAL REPAIRS', margin, y);
    y += 6;

    drawTableHeader();

    const allAdditionalItems = [...calculation.additionalRepairLineItems, ...calculation.customRepairLineItems];
    allAdditionalItems.forEach((item, index) => {
      drawLineItem(
        item.description,
        `${item.quantity} ${item.unit}`,
        item.material,
        item.labor,
        item.subtotal,
        index % 2 === 1
      );
    });

    // Subtotal
    doc.setDrawColor(...lightGray);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkGray);
    doc.text('Additional Repairs Subtotal:', margin + 100, y);
    doc.text(formatCurrency(calculation.additionalRepairsSubtotal + calculation.customRepairsSubtotal), pageWidth - margin - 3, y, { align: 'right' });
    y += 10;
  }

  // ============================================================
  // TOTALS SECTION
  // ============================================================
  y += 5;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const drawTotalLine = (label: string, amount: number, isBold = false, isLarge = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isLarge ? 12 : 10);
    doc.setTextColor(...darkGray);
    doc.text(label, margin + 100, y);
    doc.text(formatCurrency(amount), pageWidth - margin - 3, y, { align: 'right' });
    y += isLarge ? 8 : 6;
  };

  drawTotalLine('Subtotal:', calculation.subtotalBeforeMultipliers);

  if (calculation.pitchAdjustment > 0) {
    drawTotalLine('Pitch Adjustment:', calculation.pitchAdjustment);
  }
  if (calculation.accessibilityAdjustment > 0) {
    drawTotalLine('Accessibility Adjustment:', calculation.accessibilityAdjustment);
  }
  if (calculation.minimumServiceFee > 0) {
    drawTotalLine('Minimum Service Fee:', calculation.minimumServiceFee);
  }
  if (calculation.emergencySurcharge > 0) {
    drawTotalLine('Emergency Surcharge:', calculation.emergencySurcharge);
  }
  if (calculation.afterHoursSurcharge > 0) {
    drawTotalLine('After-Hours Surcharge:', calculation.afterHoursSurcharge);
  }
  if (calculation.warrantyFee > 0) {
    drawTotalLine('Extended Warranty:', calculation.warrantyFee);
  }

  y += 3;
  doc.setFillColor(...primaryColor);
  doc.rect(margin + 90, y - 5, contentWidth - 90, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', margin + 100, y + 3);
  doc.text(formatCurrency(calculation.grandTotal), pageWidth - margin - 5, y + 3, { align: 'right' });
  y += 18;

  // ============================================================
  // PHOTOS (if any, up to 6)
  // ============================================================
  if (estimate.photos.length > 0 && y < pageHeight - 60) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('DAMAGE PHOTOS', margin, y);
    y += 6;

    const photoSize = 25;
    const photosPerRow = 6;
    const photoSpacing = (contentWidth - photoSize * photosPerRow) / (photosPerRow - 1);

    const photosToShow = estimate.photos.slice(0, 6);
    for (let i = 0; i < photosToShow.length; i++) {
      const photo = photosToShow[i];
      const col = i % photosPerRow;
      const row = Math.floor(i / photosPerRow);
      const x = margin + col * (photoSize + photoSpacing);
      const photoY = y + row * (photoSize + 3);

      try {
        doc.addImage(photo.dataUrl, 'JPEG', x, photoY, photoSize, photoSize);
      } catch {
        // If image fails, draw placeholder
        doc.setFillColor(229, 231, 235);
        doc.rect(x, photoY, photoSize, photoSize, 'F');
      }
    }
    y += Math.ceil(photosToShow.length / photosPerRow) * (photoSize + 3) + 10;
  }

  // ============================================================
  // WHY REPAIR SECTION
  // ============================================================
  if (y < pageHeight - 50) {
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Why Repair Instead of Replace?', margin + 5, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    const whyText = 'Targeted repairs address specific damage without the cost of a full replacement. ' +
      'Our repair-focused approach saves you money while extending the life of your existing roof. ' +
      'Most repairs can be completed in a single visit with minimal disruption.';
    const splitText = doc.splitTextToSize(whyText, contentWidth - 10);
    doc.text(splitText, margin + 5, y + 13);

    y += 32;
  }

  // ============================================================
  // TERMS & SIGNATURE
  // ============================================================
  if (y > pageHeight - 45) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.text('TERMS & CONDITIONS', margin, y);
  y += 4;
  doc.setFontSize(7);
  doc.setTextColor(...darkGray);
  const terms = [
    '• This estimate is valid for 30 days from the date above.',
    '• Payment due upon completion unless otherwise arranged.',
    '• Warranty covers workmanship only; manufacturer warranties apply to materials.',
    '• Additional damage discovered during repair may result in additional charges (with approval).',
  ];
  terms.forEach((term) => {
    doc.text(term, margin, y);
    y += 4;
  });

  y += 8;

  // Signature line
  doc.setDrawColor(...darkGray);
  doc.line(margin, y + 10, margin + 80, y + 10);
  doc.line(margin + 100, y + 10, pageWidth - margin, y + 10);

  doc.setFontSize(8);
  doc.text('Customer Signature', margin, y + 15);
  doc.text('Date', margin + 100, y + 15);

  // ============================================================
  // FOOTER
  // ============================================================
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.text(
    `${companyInfo.name} | ${companyInfo.phone} | ${companyInfo.website}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function getPdfBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}
