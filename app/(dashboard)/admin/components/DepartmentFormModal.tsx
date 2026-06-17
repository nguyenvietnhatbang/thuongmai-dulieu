'use client';

import { DepartmentFormState } from './types';

interface DepartmentFormModalProps {
  isEditing: boolean;
  saving: boolean;
  form: DepartmentFormState;
  onChange: (form: DepartmentFormState) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function DepartmentFormModal({ isEditing, saving, form, onChange, onClose, onSubmit }: DepartmentFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground">{isEditing ? 'Xem/Sửa phòng ban' : 'Tạo phòng ban'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-foreground cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã phòng ban *</label>
            <input required value={form.code} onChange={e => onChange({ ...form, code: e.target.value })} placeholder="SALES" className="premium-input" />
            <p className="text-[10px] text-muted-foreground mt-1">Chỉ dùng chữ in hoa, số và dấu gạch dưới.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên phòng ban *</label>
            <input required value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="Phòng Kinh doanh" className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
            <select value={form.status} onChange={e => onChange({ ...form, status: e.target.value as 'active' | 'inactive' })} className="premium-input">
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm tắt</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy bỏ</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-70 cursor-pointer">{isEditing ? 'Lưu phòng ban' : 'Tạo phòng ban'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
