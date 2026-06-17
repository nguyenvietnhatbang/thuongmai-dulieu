'use client';

import { DepartmentRecord, RoleRecord, UserFormState } from './types';

interface UserFormModalProps {
  isEditing: boolean;
  saving: boolean;
  form: UserFormState;
  roles: RoleRecord[];
  departments: DepartmentRecord[];
  onChange: (form: UserFormState) => void;
  onRoleToggle: (roleId: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function UserFormModal({
  isEditing,
  saving,
  form,
  roles,
  departments,
  onChange,
  onRoleToggle,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="bg-card w-full max-w-2xl rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground">{isEditing ? 'Xem/Sửa tài khoản người dùng' : 'Tạo tài khoản người dùng'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-foreground cursor-pointer">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ tên *</label>
              <input required value={form.fullName} onChange={e => onChange({ ...form, fullName: e.target.value })} className="premium-input" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email đăng nhập *</label>
              <input required type="email" value={form.email} onChange={e => onChange({ ...form, email: e.target.value })} className="premium-input" placeholder="user@company.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{isEditing ? 'Đổi mật khẩu' : 'Mật khẩu ban đầu *'}</label>
              <input required={!isEditing} type="password" minLength={8} value={form.password} onChange={e => onChange({ ...form, password: e.target.value })} className="premium-input" placeholder={isEditing ? 'Để trống nếu không đổi' : 'Tối thiểu 8 ký tự'} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phòng ban</label>
              <select value={form.departmentId} onChange={e => onChange({ ...form, departmentId: e.target.value })} className="premium-input">
                <option value="">Chưa gán phòng ban</option>
                {departments.filter(dept => dept.status === 'active').map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
              <select value={form.status} onChange={e => onChange({ ...form, status: e.target.value as UserFormState['status'] })} className="premium-input">
                <option value="active">Đang hoạt động</option>
                <option value="locked">Đã khóa</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Vai trò RBAC</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {roles.map(role => (
                <label key={role.id} className="flex items-center gap-3 p-2.5 border border-border rounded-lg hover:bg-slate-50/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={() => onRoleToggle(role.id)} className="rounded border-slate-350 text-primary focus:ring-primary cursor-pointer h-4 w-4" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{role.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-none font-mono">{role.code}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy bỏ</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-70 cursor-pointer">{isEditing ? 'Lưu người dùng' : 'Tạo người dùng'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
