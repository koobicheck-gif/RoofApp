import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ReportPhoto {
  id: string;
  url: string; // Firebase Storage URL
  storagePath: string; // Path in Firebase Storage
  condition: 'Good' | 'Fair' | 'Poor' | 'N/A';
  notes: string;
  label: string;
}

export interface Report {
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
  photos: ReportPhoto[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  updatedBy?: string;
  status: 'draft' | 'completed';
}

const REPORTS_COLLECTION = 'reports';

// Get all reports (real-time subscription)
export function subscribeToReports(callback: (reports: Report[]) => void) {
  const q = query(
    collection(db, REPORTS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const reports: Report[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];
    callback(reports);
  });
}

// Get all reports (one-time fetch)
export async function getReports(): Promise<Report[]> {
  const q = query(
    collection(db, REPORTS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Report[];
}

// Get a single report
export async function getReport(reportId: string): Promise<Report | null> {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Report;
  }
  return null;
}

// Create a new report
export async function createReport(
  report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
    ...report,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  });
  return docRef.id;
}

// Update an existing report
export async function updateReport(
  reportId: string,
  updates: Partial<Report>,
  userId: string
): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

// Delete a report
export async function deleteReport(reportId: string): Promise<void> {
  const docRef = doc(db, REPORTS_COLLECTION, reportId);
  await deleteDoc(docRef);
}

// Generate a unique report number
export function generateReportNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RRP-${y}${m}${d}-${rand}`;
}
