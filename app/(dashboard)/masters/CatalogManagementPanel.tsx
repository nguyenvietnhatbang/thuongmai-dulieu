'use client';

import { useEffect, useMemo, useState } from 'react';

interface CatalogCategory {
  code: string;
  name: string;
  description: string | null;
}

interface CatalogItem {
  id: string;
  group: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultGroups = [
  'industry',
  'customer_source',
  'service',
  'contact_role',
  'care_type',
  'product_group',
  'quality_status',
];

export function CatalogManagementPanel() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [group, setGroup] = useState(defaultGroups[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', sortOrder: 100 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.code === group),
    [categories, group],
  );

  const fetchCategories = async () => {
    const res = await fetch('/api/catalog');
    const json = await res.json();
    if (json.success) {
      setCategories(json.data || []);
      if (!json.data?.some((category: CatalogCategory) => category.code === group) && json.data?.[0]?.code) {
        setGroup(json.data[0].code);
      }
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/catalog?group=${encodeURIComponent(group)}&activeOnly=false`);
      const json = await res.json();
      if (json.success) setItems(json.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [group]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ code: '', name: '', sortOrder: 100 });
  };

  const submitItem = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/catalog', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, name: form.name, sortOrder: form.sortOrder } : { group, ...form }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error || 'Không thể lưu danh mục.');
        return;
      }
      resetForm();
      await fetchItems();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: CatalogItem) => {
    const res = await fetch('/api/catalog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
    });
    const json = await res.json();
    if (!json.success) {
      alert(json.error || 'Không thể cập nhật trạng thái danh mục.');
      return;
    }
    await fetchItems();
  };

  return (
    <section className="glass-panel border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">Danh mục dùng chung</h2>
          <p className="text-xs text-muted-foreground mt-1">{selectedCategory?.description || selectedCategory?.name || group}</p>
        </div>
        <select value={group} onChange={(event) => setGroup(event.target.value)} className="premium-input lg:!w-72">
          {(categories.length ? categories : defaultGroups.map((code) => ({ code, name: code, description: null }))).map((category) => (
            <option key={category.code} value={category.code}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-0">
        <form onSubmit={submitItem} className="p-5 border-b lg:border-b-0 lg:border-r border-border space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã danh mục</label>
            <input
              value={form.code}
              disabled={Boolean(editingId)}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              className="premium-input disabled:bg-slate-50"
              placeholder="ma_khong_dau"
              required={!editingId}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên hiển thị</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="premium-input"
              placeholder="Tên danh mục"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Thứ tự</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value || 0) })}
              className="premium-input"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg cursor-pointer disabled:opacity-60">
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-border text-xs font-bold rounded-lg cursor-pointer">
                Hủy
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                <th className="px-5 py-3">Mã</th>
                <th className="px-5 py-3">Tên</th>
                <th className="px-5 py-3 text-center">Thứ tự</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-muted-foreground">Đang tải danh mục...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-xs text-muted-foreground">Chưa có giá trị danh mục.</td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/40">
                  <td className="px-5 py-3 font-mono text-xs text-primary font-bold">{item.code}</td>
                  <td className="px-5 py-3 font-semibold text-foreground">{item.name}</td>
                  <td className="px-5 py-3 text-center text-xs">{item.sortOrder}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-150' : 'bg-slate-50 text-slate-500 border-slate-150'}`}>
                      {item.isActive ? 'Đang dùng' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({ code: item.code, name: item.name, sortOrder: item.sortOrder });
                      }}
                      className="text-xs font-bold text-primary hover:underline mr-3 cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button type="button" onClick={() => toggleActive(item)} className="text-xs font-bold text-slate-600 hover:underline cursor-pointer">
                      {item.isActive ? 'Ẩn' : 'Dùng lại'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
