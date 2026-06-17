'use client';

import { RoleFormState } from './types';

interface RoleFormModalProps {
  isEditing: boolean;
  saving: boolean;
  form: RoleFormState;
  onChange: (form: RoleFormState) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function RoleFormModal({ isEditing, saving, form, onChange, onClose, onSubmit }: RoleFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground">{isEditing ? 'Xem/Sửa vai trò RBAC' : 'Tạo vai trò RBAC'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-foreground cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã vai trò *</label>
            <input required value={form.code} onChange={e => onChange({ ...form, code: e.target.value })} placeholder="sales_supervisor" className="premium-input" />
            <p className="text-[10px] text-muted-foreground mt-1">Chỉ dùng chữ thường, số và dấu gạch dưới.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên vai trò *</label>
            <input required value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="Trưởng nhóm kinh doanh" className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả</label>
            <textarea value={form.description} onChange={e => onChange({ ...form, description: e.target.value })} placeholder="Phạm vi sử dụng của vai trò..." className="premium-input min-h-24" />
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={e => onChange({ ...form, isActive: e.target.checked })} className="rounded border-slate-350 text-primary focus:ring-primary cursor-pointer h-4 w-4" />
            Cho phép gán vai trò này
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy bỏ</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-70 cursor-pointer">{isEditing ? 'Lưu vai trò' : 'Tạo vai trò'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
