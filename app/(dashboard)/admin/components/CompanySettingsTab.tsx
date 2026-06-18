'use client';

import { CompanySettingsFormState } from './types';

interface CompanySettingsTabProps {
  form: CompanySettingsFormState;
  saving: boolean;
  onChange: (form: CompanySettingsFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
}

const fields: Array<{
  name: keyof CompanySettingsFormState;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'url';
  area?: boolean;
  required?: boolean;
}> = [
  { name: 'companyName', label: 'Tên công ty', required: true },
  { name: 'navName', label: 'Tên trên thanh điều hướng', required: true },
  { name: 'shortName', label: 'Ký hiệu ngắn', placeholder: 'FL', required: true },
  { name: 'navSubtitle', label: 'Dòng phụ trên thanh điều hướng', placeholder: 'Commerce Edition' },
  { name: 'taxCode', label: 'Mã số thuế' },
  { name: 'address', label: 'Địa chỉ', area: true },
  { name: 'hotline', label: 'Hotline' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'website', label: 'Website', type: 'url' },
  { name: 'representativeName', label: 'Người đại diện' },
  { name: 'representativeTitle', label: 'Chức danh người đại diện' },
];

export function CompanySettingsTab({ form, saving, onChange, onSubmit }: CompanySettingsTabProps) {
  const setField = (name: keyof CompanySettingsFormState, value: string) => {
    onChange({ ...form, [name]: value });
  };

  return (
    <form onSubmit={onSubmit} className="glass-panel rounded-xl border border-border overflow-hidden">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Thông tin công ty</h2>
          <p className="text-xs text-muted-foreground mt-1">Dùng cho thanh điều hướng, báo giá, hợp đồng và chứng từ in PDF.</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary/10 cursor-pointer"
        >
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {fields.map((field) => (
          <label key={field.name} className={`space-y-2 ${field.area ? 'lg:col-span-2' : ''}`}>
            <span className="text-xs font-bold text-slate-600">
              {field.label}
              {field.required && <span className="text-rose-500 ml-1">*</span>}
            </span>
            {field.area ? (
              <textarea
                value={form[field.name]}
                onChange={(event) => setField(field.name, event.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 resize-none"
              />
            ) : (
              <input
                type={field.type || 'text'}
                value={form[field.name]}
                onChange={(event) => setField(field.name, event.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            )}
          </label>
        ))}
      </div>
    </form>
  );
}
