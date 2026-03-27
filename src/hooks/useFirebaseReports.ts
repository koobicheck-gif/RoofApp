import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToReports,
  createReport,
  updateReport,
  deleteReport,
  generateReportNumber,
  type Report,
  type ReportPhoto,
} from '../services/reportService';
import { uploadPhoto, deletePhoto } from '../services/storageService';

export type ConditionType = 'Good' | 'Fair' | 'Poor' | 'N/A';

export interface PhotoData {
  url: string | null;
  storagePath?: string;
  condition: ConditionType;
  notes: string;
  label: string;
}

export type PhotoState = Record<string, PhotoData>;

export interface AdditionalPhoto {
  id: string;
  url: string;
  storagePath?: string;
  condition: ConditionType;
  notes: string;
  label: string;
}

export interface ReportData {
  id?: string;
  reportNumber: string;
  date: string;
  propertyAddress: string;
  clientName: string;
  inspectorName: string;
  phone: string;
  roofAge: string;
  overallCondition: 'Good' | 'Fair' | 'Poor';
  recommendedAction: string;
  photos: PhotoState;
  additionalPhotos: AdditionalPhoto[];
  status: 'draft' | 'completed';
  createdBy?: string;
  updatedBy?: string;
}

export function useFirebaseReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  // Subscribe to reports
  useEffect(() => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToReports((newReports) => {
      setReports(newReports);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Upload a photo and return the URL
  const uploadReportPhoto = useCallback(async (
    file: File,
    reportId: string,
    photoId: string
  ): Promise<{ url: string; storagePath: string }> => {
    return uploadPhoto(file, reportId, photoId);
  }, []);

  // Save a report (create or update)
  const saveReport = useCallback(async (
    data: Omit<ReportData, 'id' | 'createdBy' | 'updatedBy'>,
    reportId?: string | null
  ): Promise<string> => {
    if (!user) throw new Error('Must be logged in to save reports');

    setSaving(true);
    try {
      // Convert PhotoState and AdditionalPhotos to ReportPhoto array for Firestore
      const photos: ReportPhoto[] = [];

      // Add photos from slots
      Object.entries(data.photos).forEach(([slotId, photoData]) => {
        if (photoData.url) {
          photos.push({
            id: slotId,
            url: photoData.url,
            storagePath: photoData.storagePath || '',
            condition: photoData.condition,
            notes: photoData.notes,
            label: photoData.label,
          });
        }
      });

      // Add additional photos
      data.additionalPhotos.forEach((photo) => {
        photos.push({
          id: photo.id,
          url: photo.url,
          storagePath: photo.storagePath || '',
          condition: photo.condition,
          notes: photo.notes,
          label: photo.label,
        });
      });

      const reportData = {
        reportNumber: data.reportNumber,
        date: data.date,
        propertyAddress: data.propertyAddress,
        clientName: data.clientName,
        inspectorName: data.inspectorName,
        phone: data.phone,
        roofAge: data.roofAge,
        overallCondition: data.overallCondition,
        recommendedAction: data.recommendedAction,
        photos,
        status: data.status,
      };

      if (reportId) {
        await updateReport(reportId, reportData, user.uid);
        return reportId;
      } else {
        const newId = await createReport(reportData, user.uid);
        setCurrentReportId(newId);
        return newId;
      }
    } finally {
      setSaving(false);
    }
  }, [user]);

  // Delete a report
  const removeReport = useCallback(async (reportId: string) => {
    if (!user) throw new Error('Must be logged in to delete reports');

    const report = reports.find(r => r.id === reportId);
    if (report) {
      // Delete all photos from storage
      for (const photo of report.photos) {
        if (photo.storagePath) {
          await deletePhoto(photo.storagePath);
        }
      }
    }

    await deleteReport(reportId);

    if (currentReportId === reportId) {
      setCurrentReportId(null);
    }
  }, [user, reports, currentReportId]);

  // Load a report into form data
  const loadReport = useCallback((reportId: string): ReportData | null => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return null;

    // Convert ReportPhoto array back to PhotoState
    const photos: PhotoState = {};
    const additionalPhotos: AdditionalPhoto[] = [];

    report.photos.forEach((photo) => {
      if (photo.id.startsWith('additional-')) {
        additionalPhotos.push({
          id: photo.id,
          url: photo.url,
          storagePath: photo.storagePath,
          condition: photo.condition,
          notes: photo.notes,
          label: photo.label,
        });
      } else {
        photos[photo.id] = {
          url: photo.url,
          storagePath: photo.storagePath,
          condition: photo.condition,
          notes: photo.notes,
          label: photo.label,
        };
      }
    });

    setCurrentReportId(reportId);

    return {
      id: report.id,
      reportNumber: report.reportNumber,
      date: report.date,
      propertyAddress: report.propertyAddress,
      clientName: report.clientName,
      inspectorName: report.inspectorName,
      phone: report.phone,
      roofAge: report.roofAge,
      overallCondition: report.overallCondition,
      recommendedAction: report.recommendedAction,
      photos,
      additionalPhotos,
      status: report.status,
      createdBy: report.createdBy,
      updatedBy: report.updatedBy,
    };
  }, [reports]);

  // Create a new report ID
  const createNewReport = useCallback(() => {
    setCurrentReportId(null);
    return generateReportNumber();
  }, []);

  return {
    reports,
    loading,
    saving,
    currentReportId,
    setCurrentReportId,
    uploadReportPhoto,
    saveReport,
    removeReport,
    loadReport,
    createNewReport,
    generateReportNumber,
  };
}
