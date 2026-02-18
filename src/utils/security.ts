/**
 * Security and tracking utilities for RoofApp
 * Provides audit logging, data validation, session tracking, and backup functionality
 */

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  entityType: 'estimate' | 'job' | 'crew' | 'pricing' | 'settings';
  entityId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  userId?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

const AUDIT_LOG_KEY = 'roofapp_audit_log';
const MAX_AUDIT_ENTRIES = 1000;

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'deviceInfo'>): void {
  try {
    const logs = getAuditLog();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date(),
      deviceInfo: getDeviceInfo(),
    };

    logs.unshift(newEntry);

    // Keep only last N entries
    if (logs.length > MAX_AUDIT_ENTRIES) {
      logs.splice(MAX_AUDIT_ENTRIES);
    }

    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export function getAuditLog(): AuditLogEntry[] {
  try {
    const data = localStorage.getItem(AUDIT_LOG_KEY);
    if (data) {
      const logs = JSON.parse(data);
      return logs.map((log: AuditLogEntry) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  } catch (error) {
    console.error('Failed to read audit log:', error);
  }
  return [];
}

export function getAuditLogForEntity(entityType: string, entityId: string): AuditLogEntry[] {
  return getAuditLog().filter(
    (entry) => entry.entityType === entityType && entry.entityId === entityId
  );
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_LOG_KEY);
}

// ============================================================================
// SESSION / USER TRACKING
// ============================================================================

export interface SessionInfo {
  sessionId: string;
  startedAt: Date;
  lastActiveAt: Date;
  userId?: string;
  userName?: string;
  deviceInfo: string;
  estimatesViewed: string[];
  estimatesCreated: string[];
  estimatesModified: string[];
}

const SESSION_KEY = 'roofapp_session';
const USER_KEY = 'roofapp_user';

export function initSession(): SessionInfo {
  let session = getCurrentSession();

  if (!session || isSessionExpired(session)) {
    session = {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      deviceInfo: getDeviceInfo(),
      estimatesViewed: [],
      estimatesCreated: [],
      estimatesModified: [],
    };
  } else {
    session.lastActiveAt = new Date();
  }

  // Load user info if available
  const user = getStoredUser();
  if (user) {
    session.userId = user.id;
    session.userName = user.name;
  }

  saveSession(session);
  return session;
}

export function getCurrentSession(): SessionInfo | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (data) {
      const session = JSON.parse(data);
      return {
        ...session,
        startedAt: new Date(session.startedAt),
        lastActiveAt: new Date(session.lastActiveAt),
      };
    }
  } catch { /* ignore */ }
  return null;
}

function saveSession(session: SessionInfo): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function isSessionExpired(session: SessionInfo): boolean {
  const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - new Date(session.lastActiveAt).getTime() > EXPIRY_MS;
}

export function trackEstimateView(estimateId: string): void {
  const session = getCurrentSession();
  if (session) {
    if (!session.estimatesViewed.includes(estimateId)) {
      session.estimatesViewed.push(estimateId);
    }
    session.lastActiveAt = new Date();
    saveSession(session);
  }
}

export function trackEstimateCreate(estimateId: string): void {
  const session = getCurrentSession();
  if (session) {
    session.estimatesCreated.push(estimateId);
    session.lastActiveAt = new Date();
    saveSession(session);
  }

  logAuditEvent({
    action: 'CREATE',
    entityType: 'estimate',
    entityId: estimateId,
    userId: session?.userId,
  });
}

export function trackEstimateModify(estimateId: string, changes?: Record<string, { old: unknown; new: unknown }>): void {
  const session = getCurrentSession();
  if (session) {
    if (!session.estimatesModified.includes(estimateId)) {
      session.estimatesModified.push(estimateId);
    }
    session.lastActiveAt = new Date();
    saveSession(session);
  }

  logAuditEvent({
    action: 'UPDATE',
    entityType: 'estimate',
    entityId: estimateId,
    changes,
    userId: session?.userId,
  });
}

// User management
interface StoredUser {
  id: string;
  name: string;
  role?: 'admin' | 'tech' | 'viewer';
}

export function setUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const session = getCurrentSession();
  if (session) {
    session.userId = user.id;
    session.userName = user.name;
    saveSession(session);
  }
}

export function getStoredUser(): StoredUser | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch { /* ignore */ }
  return null;
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

// ============================================================================
// DATA VALIDATION & SANITIZATION
// ============================================================================

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove any script tags and dangerous HTML
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');

  // Trim and limit length
  sanitized = sanitized.trim().slice(0, 10000);

  return sanitized;
}

export function sanitizePhone(phone: string): string {
  // Keep only digits, parentheses, hyphens, spaces, and plus sign
  return phone.replace(/[^0-9()\-\s+]/g, '').slice(0, 20);
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // At least 10 digits
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

export function validateZip(zip: string): boolean {
  // US ZIP code: 5 digits or 5+4 format
  return /^\d{5}(-\d{4})?$/.test(zip);
}

export function sanitizeCustomer(customer: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}) {
  return {
    name: sanitizeString(customer.name).slice(0, 200),
    address: sanitizeString(customer.address).slice(0, 500),
    city: sanitizeString(customer.city).slice(0, 100),
    state: customer.state.toUpperCase().slice(0, 2),
    zip: customer.zip.replace(/[^0-9-]/g, '').slice(0, 10),
    phone: sanitizePhone(customer.phone),
    email: sanitizeEmail(customer.email),
  };
}

// ============================================================================
// DATA BACKUP & EXPORT
// ============================================================================

export interface BackupData {
  version: string;
  exportedAt: Date;
  deviceInfo: string;
  data: {
    estimates: unknown[];
    jobs: unknown;
    pricing: unknown;
    auditLog: AuditLogEntry[];
  };
}

export function createBackup(): BackupData {
  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date(),
    deviceInfo: getDeviceInfo(),
    data: {
      estimates: [],
      jobs: null,
      pricing: null,
      auditLog: [],
    },
  };

  try {
    // Estimates
    const estimates = localStorage.getItem('roofRepairPartners_estimates');
    if (estimates) {
      backup.data.estimates = JSON.parse(estimates);
    }

    // Jobs (schedules, timelines, crew)
    const jobs = localStorage.getItem('roofapp_jobs');
    if (jobs) {
      backup.data.jobs = JSON.parse(jobs);
    }

    // Pricing
    const pricing = localStorage.getItem('roofapp_pricing');
    if (pricing) {
      backup.data.pricing = JSON.parse(pricing);
    }

    // Audit log (partial - last 500 entries)
    backup.data.auditLog = getAuditLog().slice(0, 500);
  } catch (error) {
    console.error('Failed to create backup:', error);
  }

  return backup;
}

export function downloadBackup(): void {
  const backup = createBackup();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `roofapp-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logAuditEvent({
    action: 'BACKUP_CREATED',
    entityType: 'settings',
  });
}

export function restoreBackup(backup: BackupData): { success: boolean; message: string } {
  try {
    if (backup.version !== '1.0.0') {
      return { success: false, message: 'Incompatible backup version' };
    }

    if (backup.data.estimates) {
      localStorage.setItem('roofRepairPartners_estimates', JSON.stringify(backup.data.estimates));
    }

    if (backup.data.jobs) {
      localStorage.setItem('roofapp_jobs', JSON.stringify(backup.data.jobs));
    }

    if (backup.data.pricing) {
      localStorage.setItem('roofapp_pricing', JSON.stringify(backup.data.pricing));
    }

    logAuditEvent({
      action: 'BACKUP_RESTORED',
      entityType: 'settings',
      changes: {
        restoredFrom: { old: null, new: backup.exportedAt.toString() },
      },
    });

    return { success: true, message: 'Backup restored successfully. Refresh to see changes.' };
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return { success: false, message: 'Failed to restore backup: ' + String(error) };
  }
}

// ============================================================================
// DEVICE INFO
// ============================================================================

export function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}`;

  // Simplify user agent
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'Unknown';
  if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${os} / ${browser} / ${screen}`;
}

// ============================================================================
// AUTO-BACKUP SCHEDULING
// ============================================================================

const LAST_BACKUP_KEY = 'roofapp_last_backup';
const BACKUP_INTERVAL_DAYS = 7;

export function shouldAutoBackup(): boolean {
  try {
    const lastBackup = localStorage.getItem(LAST_BACKUP_KEY);
    if (!lastBackup) return true;

    const lastDate = new Date(lastBackup);
    const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= BACKUP_INTERVAL_DAYS;
  } catch { /* ignore */ }
  return false;
}

export function markBackupComplete(): void {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

// ============================================================================
// DATA INTEGRITY CHECK
// ============================================================================

export function checkDataIntegrity(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  try {
    // Check estimates
    const estimates = localStorage.getItem('roofRepairPartners_estimates');
    if (estimates) {
      const parsed = JSON.parse(estimates);
      if (!Array.isArray(parsed)) {
        issues.push('Estimates data is corrupted (not an array)');
      } else {
        parsed.forEach((est: { id?: string; customer?: { name?: string } }, idx: number) => {
          if (!est.id) issues.push(`Estimate at index ${idx} missing ID`);
          if (!est.customer?.name) issues.push(`Estimate ${est.id || idx} missing customer name`);
        });
      }
    }

    // Check jobs data
    const jobs = localStorage.getItem('roofapp_jobs');
    if (jobs) {
      const parsed = JSON.parse(jobs);
      if (typeof parsed !== 'object') {
        issues.push('Jobs data is corrupted');
      }
    }
  } catch (error) {
    issues.push(`Data parsing error: ${String(error)}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
