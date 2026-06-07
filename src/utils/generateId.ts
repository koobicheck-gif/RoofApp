// Shared ID generation utilities

const ID_PREFIX = {
  estimate: 'EST',
  report: 'RPT',
  job: 'JOB',
  photo: 'PHT',
} as const;

type IdType = keyof typeof ID_PREFIX;

export function generateId(type: IdType): string {
  const prefix = ID_PREFIX[type];
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateEstimateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EST-${year}${month}${day}-${random}`;
}

export function generateReportNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RPT-${year}${month}${day}-${random}`;
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
