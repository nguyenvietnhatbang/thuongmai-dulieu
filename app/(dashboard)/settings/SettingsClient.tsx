'use client';

import { useEffect, useState } from 'react';
import { CompanySettingsForm, CompanySettingsFormState } from './CompanySettingsForm';

interface CompanySettingsRecord extends CompanySettingsFormState {
  id: string | null;
}

const defaultCompanyForm: CompanySettingsFormState = {
  companyName: '',
  navName: '',
  shortName: '',
  navSubtitle: '',
  taxCode: '',
  address: '',
  hotline: '',
  email: '',
  website: '',
  representativeName: '',
  representativeTitle: '',
};

function mapSettingsToForm(settings: CompanySettingsRecord): CompanySettingsFormState {
  return {
    companyName: settings.companyName || '',
    navName: settings.navName || '',
    shortName: settings.shortName || '',
    navSubtitle: settings.navSubtitle || '',
    taxCode: settings.taxCode || '',
    address: settings.address || '',
    hotline: settings.hotline || '',
    email: settings.email || '',
    website: settings.website || '',
    representativeName: settings.representativeName || '',
    representativeTitle: settings.representativeTitle || '',
  };
}

export function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CompanySettingsFormState>(defaultCompanyForm);

  const fetchCompanySettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/company');
      const json = await res.json();
      if (json.success) {
        setForm(mapSettingsToForm(json.data as CompanySettingsRecord));
      }
    } catch (error) {
      console.error(error);
      alert('Không thể tải thông tin công ty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const handleSaveCompanySettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!json.success) {
        alert(json.error || 'Lưu thông tin công ty thất bại');
        return;
      }

      setForm(mapSettingsToForm(json.data as CompanySettingsRecord));
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi khi lưu thông tin công ty');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto pb-8">
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2 glass-panel rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-xs">Đang tải cấu hình công ty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 pb-8">
      <div className="max-w-5xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-foreground">Cấu hình công ty</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý thông tin hiển thị trên hệ thống và các chứng từ PDF.
            </p>
          </div>
        </div>

        <CompanySettingsForm
          form={form}
          saving={saving}
          onChange={setForm}
          onSubmit={handleSaveCompanySettings}
        />
      </div>
    </div>
  );
}
