// Secure storage utility for sensitive data
// Uses base64 encoding with key-based obfuscation
// Note: For true encryption, use a proper crypto library in production

const STORAGE_PREFIX = 'roofapp_secure_';
const OBFUSCATION_KEY = 'R00f@pp2026!';

function obfuscate(data: string): string {
  // Simple XOR-based obfuscation with base64 encoding
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(encodeURIComponent(result));
}

function deobfuscate(data: string): string {
  try {
    const decoded = decodeURIComponent(atob(data));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
}

export function setSecureItem(key: string, value: unknown): void {
  try {
    const jsonStr = JSON.stringify(value);
    const obfuscated = obfuscate(jsonStr);
    localStorage.setItem(STORAGE_PREFIX + key, obfuscated);
  } catch (error) {
    console.error('Failed to save secure item:', error);
  }
}

export function getSecureItem<T>(key: string): T | null {
  try {
    const obfuscated = localStorage.getItem(STORAGE_PREFIX + key);
    if (!obfuscated) return null;

    const jsonStr = deobfuscate(obfuscated);
    if (!jsonStr) return null;

    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error('Failed to read secure item:', error);
    return null;
  }
}

export function removeSecureItem(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
}

export function clearAllSecureItems(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Sensitive data types that should use secure storage
export interface SecureCustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export function saveSecureCustomerData(estimateId: string, data: SecureCustomerData): void {
  setSecureItem(`customer_${estimateId}`, data);
}

export function getSecureCustomerData(estimateId: string): SecureCustomerData | null {
  return getSecureItem<SecureCustomerData>(`customer_${estimateId}`);
}
