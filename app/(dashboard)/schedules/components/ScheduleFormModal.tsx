'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ScheduleDetail } from '@/features/projects/services/project.service';

interface CustomerOption {
  id: string;
  name: string;
  code: string;
}

interface ProjectOption {
  id: string;
  name: string;
  code: string;
  customerId: string;
}

interface UserOption {
  id: string;
  fullName: string;
}

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  editingSchedule: ScheduleDetail | null;
  customers: CustomerOption[];
  projects: ProjectOption[];
  users: UserOption[];
  currentUserId: string;
}

export function ScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingSchedule,
  customers,
  projects,
  users,
  currentUserId,
}: ScheduleFormModalProps) {
  const [formData, setFormData] = useState({
    customerId: '',
    projectId: '',
    scheduleType: 'meeting',
    title: '',
    startsAt: '',
    endsAt: '',
    ownerUserId: '',
    status: 'planned',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        customerId: editingSchedule.customerId,
        projectId: editingSchedule.projectId || '',
        scheduleType: editingSchedule.scheduleType,
        title: editingSchedule.title,
        startsAt: editingSchedule.startsAt ? new Date(editingSchedule.startsAt).toISOString().slice(0, 16) : '',
        endsAt: editingSchedule.endsAt ? new Date(editingSchedule.endsAt).toISOString().slice(0, 16) : '',
        ownerUserId: editingSchedule.ownerUserId || '',
        status: editingSchedule.status,
        notes: editingSchedule.notes || '',
      });
    } else {
      setFormData({
        customerId: '',
        projectId: '',
        scheduleType: 'meeting',
        title: '',
        startsAt: new Date().toISOString().slice(0, 16),
        endsAt: '',
        ownerUserId: currentUserId,
        status: 'planned',
        notes: '',
      });
    }
  }, [editingSchedule, isOpen, currentUserId]);

  const filteredProjects = projects.filter(p => p.customerId === formData.customerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert('Vui lòng chọn khách hàng!');
      return;
    }
    if (!formData.startsAt) {
      alert('Vui lòng chọn thời gian bắt đầu!');
      return;
    }

    setSaving(true);
    try {
      const ok = await onSubmit(formData);
      if (ok) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSchedule ? 'Cập nhật Lịch trình' : 'Tạo Lịch trình mới'}
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề lịch trình *</label>
          <input
            type="text"
            required
            placeholder="Họp kickoff dự án, Khảo sát địa điểm..."
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="premium-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khách hàng *</label>
            <SearchableSelect
              value={formData.customerId}
              placeholder="-- Chọn khách hàng --"
              searchPlaceholder="Tìm tên, mã khách hàng..."
              options={customers.map(c => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              }))}
              onChange={(customerId) => setFormData({ ...formData, customerId, projectId: '' })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dự án liên kết</label>
            <SearchableSelect
              value={formData.projectId}
              placeholder={formData.customerId ? "-- Chọn dự án --" : "-- Chọn khách hàng trước --"}
              searchPlaceholder="Tìm tên, mã dự án..."
              options={filteredProjects.map(p => ({
                value: p.id,
                label: `${p.name} (${p.code})`,
              }))}
              disabled={!formData.customerId}
              onChange={(projectId) => setFormData({ ...formData, projectId })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Loại lịch trình</label>
            <select
              value={formData.scheduleType}
              onChange={e => setFormData({ ...formData, scheduleType: e.target.value })}
              className="premium-input"
            >
              <option value="meeting">Họp mặt</option>
              <option value="survey">Khảo sát thực địa</option>
              <option value="deployment">Triển khai kỹ thuật</option>
              <option value="acceptance">Nghiệm thu bàn giao</option>
              <option value="customer_care">Chăm sóc khách hàng</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Người phụ trách</label>
            <SearchableSelect
              value={formData.ownerUserId}
              placeholder="-- Chọn người phụ trách --"
              searchPlaceholder="Tìm nhân viên..."
              options={users.map(u => ({
                value: u.id,
                label: u.fullName,
              }))}
              onChange={(ownerUserId) => setFormData({ ...formData, ownerUserId })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thời gian bắt đầu *</label>
            <input
              type="datetime-local"
              required
              value={formData.startsAt}
              onChange={e => setFormData({ ...formData, startsAt: e.target.value })}
              className="premium-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thời gian kết thúc</label>
            <input
              type="datetime-local"
              value={formData.endsAt}
              onChange={e => setFormData({ ...formData, endsAt: e.target.value })}
              className="premium-input"
            />
          </div>
        </div>

        {editingSchedule && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="premium-input"
            >
              <option value="planned">Lên kế hoạch</option>
              <option value="done">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả / Ghi chú</label>
          <textarea
            rows={3}
            placeholder="Nội dung thảo luận, yêu cầu kỹ thuật cần mang theo..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="premium-input resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Đang lưu...' : editingSchedule ? 'Cập nhật' : 'Lưu lại'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
