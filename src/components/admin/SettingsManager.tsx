import { useState, useEffect } from 'react';
import { Card, CardHeader, Button } from '../ui';
import type { CompanyInfo } from '../../types';

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Roof Repair Partners',
  tagline: "Oklahoma's Repair-Focused Roofing Experts",
  phone: '(405) 555-ROOF',
  email: 'estimates@roofrepairpartners.com',
  website: 'www.roofrepairpartners.com',
  address: '123 Main Street',
  city: 'Oklahoma City',
  state: 'OK',
  zip: '73102',
  license: 'OK-ROOF-12345',
};

const STORAGE_KEY = 'roofapp_company_info';

function FormInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

export function SettingsManager() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_COMPANY_INFO;
      }
    }
    return DEFAULT_COMPANY_INFO;
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(companyInfo) !== localStorage.getItem(STORAGE_KEY));
  }, [companyInfo]);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const saveSettings = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companyInfo));
    setHasChanges(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetToDefault = () => {
    if (confirm('Reset all company info to defaults?')) {
      setCompanyInfo(DEFAULT_COMPANY_INFO);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COMPANY_INFO));
      setHasChanges(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader
          title="Company Information"
          subtitle="This information appears on all estimates and PDFs"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Company Name"
            value={companyInfo.name}
            onChange={(value) => handleChange('name', value)}
          />
          <FormInput
            label="Tagline"
            value={companyInfo.tagline}
            onChange={(value) => handleChange('tagline', value)}
          />
          <FormInput
            label="Phone"
            value={companyInfo.phone}
            onChange={(value) => handleChange('phone', value)}
          />
          <FormInput
            label="Email"
            value={companyInfo.email}
            onChange={(value) => handleChange('email', value)}
          />
          <FormInput
            label="Website"
            value={companyInfo.website}
            onChange={(value) => handleChange('website', value)}
          />
          <FormInput
            label="License Number"
            value={companyInfo.license || ''}
            onChange={(value) => handleChange('license', value)}
          />
        </div>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader
          title="Business Address"
          subtitle="Your company's physical address"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormInput
              label="Street Address"
              value={companyInfo.address || ''}
              onChange={(value) => handleChange('address', value)}
            />
          </div>
          <FormInput
            label="City"
            value={companyInfo.city || ''}
            onChange={(value) => handleChange('city', value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="State"
              value={companyInfo.state || ''}
              onChange={(value) => handleChange('state', value)}
            />
            <FormInput
              label="ZIP Code"
              value={companyInfo.zip || ''}
              onChange={(value) => handleChange('zip', value)}
            />
          </div>
        </div>
      </Card>

      {/* PDF Settings Preview */}
      <Card>
        <CardHeader
          title="PDF Header Preview"
          subtitle="How your company info will appear on estimates"
        />

        <div className="bg-blue-700 text-white p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xl font-bold">{companyInfo.name}</div>
              <div className="text-sm text-blue-200">{companyInfo.tagline}</div>
            </div>
            <div className="text-right text-sm">
              <div>{companyInfo.phone}</div>
              <div>{companyInfo.email}</div>
              <div>{companyInfo.website}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader
          title="Data Management"
          subtitle="Manage your app data and storage"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Local Storage</div>
              <div className="text-sm text-gray-500">
                All data is stored locally on this device
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB used
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div>
              <div className="font-medium text-amber-900">Export Data</div>
              <div className="text-sm text-amber-700">
                Download all estimates and settings as JSON
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const data = {
                  companyInfo,
                  estimates: localStorage.getItem('roofapp_estimates'),
                  pricing: localStorage.getItem('roofapp_pricing'),
                  exportedAt: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `roofapp-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div>
              <div className="font-medium text-red-900">Clear All Data</div>
              <div className="text-sm text-red-700">
                Permanently delete all estimates and reset settings
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure? This will delete ALL estimates and reset all settings. This cannot be undone.')) {
                  if (confirm('This is your final warning. Click OK to permanently delete all data.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }
              }}
            >
              Clear All
            </Button>
          </div>
        </div>
      </Card>

      {/* Save Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-4 px-4 py-3 flex items-center justify-between">
        <Button variant="secondary" onClick={resetToDefault}>
          Reset to Defaults
        </Button>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          )}
          <Button onClick={saveSettings} disabled={!hasChanges}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
