'use client';

import { useMemo, useState } from 'react';
import { ListToolbar, PaginationControls, SortableHeader } from '@/components/ui/ListControls';
import { Modal } from '@/components/ui/Modal';

interface Product {
  id: string;
  code: string;
  name: string;
  unitCode: string;
  minStockQuantity: number;
  status: 'active' | 'inactive';
}

interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: 'active' | 'inactive';
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  status: 'active' | 'inactive';
}

type WarehouseFormState = Omit<Warehouse, 'id' | 'address'> & { address: string };

interface MastersTabProps {
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onCreateProduct: (data: Omit<Product, 'id'>) => Promise<boolean>;
  onCreateSupplier: (data: Omit<Supplier, 'id'>) => Promise<boolean>;
  onCreateWarehouse: (data: Omit<Warehouse, 'id'>) => Promise<boolean>;
  onUpdateWarehouse: (id: string, data: Omit<Warehouse, 'id'>) => Promise<boolean>;
  onDeleteWarehouse: (id: string) => Promise<boolean>;
}

export function MastersTab({
  products,
  suppliers,
  warehouses,
  onCreateProduct,
  onCreateSupplier,
  onCreateWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse
}: MastersTabProps) {
  const [subtab, setSubtab] = useState<'products' | 'suppliers' | 'warehouses'>('products');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState({ code: '', name: '', unitCode: 'item', minStockQuantity: 0, status: 'active' as const });
  const [newSupplier, setNewSupplier] = useState({ code: '', name: '', phone: '', email: '', address: '', status: 'active' as const });
  const [newWarehouse, setNewWarehouse] = useState<WarehouseFormState>({ code: '', name: '', address: '', status: 'active' });
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onCreateProduct(newProduct);
    if (ok) {
      setIsProductOpen(false);
      setNewProduct({ code: '', name: '', unitCode: 'item', minStockQuantity: 0, status: 'active' });
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onCreateSupplier(newSupplier);
    if (ok) {
      setIsSupplierOpen(false);
      setNewSupplier({ code: '', name: '', phone: '', email: '', address: '', status: 'active' });
    }
  };

  const handleWarehouseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = editingWarehouseId
      ? await onUpdateWarehouse(editingWarehouseId, newWarehouse)
      : await onCreateWarehouse(newWarehouse);
    if (ok) {
      setIsWarehouseOpen(false);
      setEditingWarehouseId(null);
      setNewWarehouse({ code: '', name: '', address: '', status: 'active' });
    }
  };

  const startEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouseId(warehouse.id);
    setNewWarehouse({
      code: warehouse.code,
      name: warehouse.name,
      address: warehouse.address || '',
      status: warehouse.status,
    });
    setIsWarehouseOpen(true);
  };

  const closeWarehouseModal = () => {
    setIsWarehouseOpen(false);
    setEditingWarehouseId(null);
    setNewWarehouse({ code: '', name: '', address: '', status: 'active' });
  };

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((product) => !term || product.name.toLowerCase().includes(term) || product.code.toLowerCase().includes(term))
      .filter((product) => !status || product.status === status)
      .sort((a, b) => {
        const left = a[sort as keyof Product];
        const right = b[sort as keyof Product];
        const result = typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left || '').localeCompare(String(right || ''), 'vi');
        return order === 'asc' ? result : -result;
      });
  }, [products, search, status, sort, order]);

  const filteredSuppliers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return suppliers
      .filter((supplier) => !term || supplier.name.toLowerCase().includes(term) || supplier.code.toLowerCase().includes(term))
      .filter((supplier) => !status || supplier.status === status)
      .sort((a, b) => {
        const left = a[sort as keyof Supplier];
        const right = b[sort as keyof Supplier];
        const result = String(left || '').localeCompare(String(right || ''), 'vi');
        return order === 'asc' ? result : -result;
      });
  }, [suppliers, search, status, sort, order]);

  const filteredWarehouses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return warehouses
      .filter((warehouse) => !term || warehouse.name.toLowerCase().includes(term) || warehouse.code.toLowerCase().includes(term))
      .filter((warehouse) => !status || warehouse.status === status)
      .sort((a, b) => {
        const left = a[sort as keyof Warehouse];
        const right = b[sort as keyof Warehouse];
        const result = String(left || '').localeCompare(String(right || ''), 'vi');
        return order === 'asc' ? result : -result;
      });
  }, [warehouses, search, status, sort, order]);

  const limit = 10;
  const activeRows = subtab === 'products' ? filteredProducts : subtab === 'suppliers' ? filteredSuppliers : filteredWarehouses;
  const pagedProducts = filteredProducts.slice((page - 1) * limit, page * limit);
  const pagedSuppliers = filteredSuppliers.slice((page - 1) * limit, page * limit);
  const pagedWarehouses = filteredWarehouses.slice((page - 1) * limit, page * limit);

  const changeSubtab = (nextSubtab: 'products' | 'suppliers' | 'warehouses') => {
    setSubtab(nextSubtab);
    setSearch('');
    setStatus('');
    setPage(1);
    setSort('name');
    setOrder('asc');
  };

  const handleSort = (nextSort: string) => {
    setOrder(sort === nextSort && order === 'asc' ? 'desc' : 'asc');
    setSort(nextSort);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-50/50 border border-border rounded-xl text-xs font-bold text-slate-600 p-2">
        <div className="flex gap-1">
          <button
            onClick={() => changeSubtab('products')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              subtab === 'products' ? 'bg-card text-primary shadow-xs' : 'hover:bg-slate-100/50'
            }`}
          >
            Sản phẩm ({products.length})
          </button>
          <button
            onClick={() => changeSubtab('suppliers')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              subtab === 'suppliers' ? 'bg-card text-primary shadow-xs' : 'hover:bg-slate-100/50'
            }`}
          >
            Nhà cung cấp ({suppliers.length})
          </button>
          <button
            onClick={() => changeSubtab('warehouses')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              subtab === 'warehouses' ? 'bg-card text-primary shadow-xs' : 'hover:bg-slate-100/50'
            }`}
          >
            Kho hàng ({warehouses.length})
          </button>
        </div>

        <div>
          {subtab === 'products' && (
            <button
              onClick={() => setIsProductOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-[11px] font-semibold shadow-sm cursor-pointer"
            >
              + Sản phẩm
            </button>
          )}
          {subtab === 'suppliers' && (
            <button
              onClick={() => setIsSupplierOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-[11px] font-semibold shadow-sm cursor-pointer"
            >
              + Nhà cung cấp
            </button>
          )}
          {subtab === 'warehouses' && (
            <button
              onClick={() => {
                setEditingWarehouseId(null);
                setNewWarehouse({ code: '', name: '', address: '', status: 'active' });
                setIsWarehouseOpen(true);
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-[11px] font-semibold shadow-sm cursor-pointer"
            >
              + Kho hàng
            </button>
          )}
        </div>
      </div>

      <ListToolbar
        search={search}
        searchPlaceholder={subtab === 'products' ? 'Tìm mã, tên sản phẩm...' : subtab === 'suppliers' ? 'Tìm mã, tên NCC...' : 'Tìm mã, tên kho...'}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        onSearchSubmit={(event) => event.preventDefault()}
        showSearchButton={false}
        searchClassName="!w-64"
        filters={[
          {
            value: status,
            placeholder: 'Tất cả trạng thái',
            onChange: (value) => { setStatus(value); setPage(1); },
            options: [
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Ngừng hoạt động' },
            ],
            className: '!w-40',
          },
        ]}
        onReset={() => { setSearch(''); setStatus(''); setPage(1); }}
      />

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        {subtab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã sản phẩm" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tên sản phẩm" sortKey="name" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Đơn vị tính" sortKey="unitCode" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-center"><SortableHeader label="Định mức" sortKey="minStockQuantity" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có sản phẩm phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{p.code}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{p.name}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{p.unitCode}</td>
                      <td className="px-6 py-4 text-center font-medium text-slate-600">{p.minStockQuantity}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {p.status === 'active' ? 'Đang kinh doanh' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {subtab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã số" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tên nhà cung cấp" sortKey="name" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4"><SortableHeader label="Email" sortKey="email" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Địa chỉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có nhà cung cấp phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedSuppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{s.code}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{s.name}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">{s.phone || '-'}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{s.email || '-'}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{s.address || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {subtab === 'warehouses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã kho" sortKey="code" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tên kho hàng" sortKey="name" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Địa chỉ kho</th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={sort} order={order} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có kho hàng phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  pagedWarehouses.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{w.code}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{w.name}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{w.address || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          w.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {w.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEditWarehouse(w)}
                            className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-muted cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteWarehouse(w.id)}
                            className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold hover:bg-red-100 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControls page={page} limit={limit} total={activeRows.length} onPageChange={setPage} alwaysShow />
      </div>

      {/* CREATE PRODUCT MODAL */}
      <Modal isOpen={isProductOpen} onClose={() => setIsProductOpen(false)} title="Thêm Sản phẩm mới">
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã sản phẩm *</label>
            <input type="text" required placeholder="SKU-PROD-01..." value={newProduct.code} onChange={e => setNewProduct({...newProduct, code: e.target.value})} className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên sản phẩm *</label>
            <input type="text" required placeholder="Tên hàng hóa..." value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="premium-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Đơn vị tính</label>
              <select value={newProduct.unitCode} onChange={e => setNewProduct({...newProduct, unitCode: e.target.value})} className="premium-input">
                <option value="item">Cái (item)</option>
                <option value="package">Gói (package)</option>
                <option value="hour">Giờ (hour)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tồn tối thiểu</label>
              <input type="number" value={newProduct.minStockQuantity} onChange={e => setNewProduct({...newProduct, minStockQuantity: Number(e.target.value)})} className="premium-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsProductOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">Lưu sản phẩm</button>
          </div>
        </form>
      </Modal>

      {/* CREATE SUPPLIER MODAL */}
      <Modal isOpen={isSupplierOpen} onClose={() => setIsSupplierOpen(false)} title="Thêm Nhà cung cấp">
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã nhà cung cấp *</label>
            <input type="text" required placeholder="SUP-001..." value={newSupplier.code} onChange={e => setNewSupplier({...newSupplier, code: e.target.value})} className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên nhà cung cấp *</label>
            <input type="text" required placeholder="Công ty cung ứng..." value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} className="premium-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số điện thoại</label>
              <input type="text" placeholder="SĐT" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} className="premium-input" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
              <input type="email" placeholder="Email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} className="premium-input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Địa chỉ</label>
            <input type="text" placeholder="Địa chỉ giao dịch" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} className="premium-input" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsSupplierOpen(false)} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">Lưu</button>
          </div>
        </form>
      </Modal>

      {/* CREATE WAREHOUSE MODAL */}
      <Modal isOpen={isWarehouseOpen} onClose={closeWarehouseModal} title={editingWarehouseId ? 'Cập nhật Kho hàng' : 'Thêm Kho lưu trữ'}>
        <form onSubmit={handleWarehouseSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mã kho *</label>
            <input type="text" required placeholder="WH-HN, WH-SG..." value={newWarehouse.code} onChange={e => setNewWarehouse({...newWarehouse, code: e.target.value})} className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên kho hàng *</label>
            <input type="text" required placeholder="Kho trung tâm..." value={newWarehouse.name} onChange={e => setNewWarehouse({...newWarehouse, name: e.target.value})} className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Địa chỉ kho</label>
            <input type="text" placeholder="Địa chỉ kho bãi" value={newWarehouse.address} onChange={e => setNewWarehouse({...newWarehouse, address: e.target.value})} className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
            <select value={newWarehouse.status} onChange={e => setNewWarehouse({...newWarehouse, status: e.target.value as 'active' | 'inactive'})} className="premium-input">
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeWarehouseModal} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">
              {editingWarehouseId ? 'Cập nhật kho' : 'Lưu kho'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
