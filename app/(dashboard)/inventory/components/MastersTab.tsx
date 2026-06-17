'use client';

import { useState } from 'react';
import { ListToolbar, PaginationControls, SortableHeader, PageTabs } from '@/components/ui/ListControls';
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
type ProductFormState = Omit<Product, 'id'>;
type SupplierFormState = Omit<Supplier, 'id' | 'phone' | 'email' | 'address'> & { phone: string; email: string; address: string };

interface MastersTabProps {
  products: Product[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  productSearch: string;
  productStatus: string;
  productPage: number;
  productTotal: number;
  productSort: string;
  productOrder: 'asc' | 'desc';
  supplierSearch: string;
  supplierStatus: string;
  supplierPage: number;
  supplierTotal: number;
  supplierSort: string;
  supplierOrder: 'asc' | 'desc';
  warehouseSearch: string;
  warehouseStatus: string;
  warehousePage: number;
  warehouseTotal: number;
  warehouseSort: string;
  warehouseOrder: 'asc' | 'desc';
  onProductSearchChange: (value: string) => void;
  onProductStatusChange: (value: string) => void;
  onProductReset: () => void;
  onProductPageChange: (page: number) => void;
  onProductSort: (sortKey: string) => void;
  onSupplierSearchChange: (value: string) => void;
  onSupplierStatusChange: (value: string) => void;
  onSupplierReset: () => void;
  onSupplierPageChange: (page: number) => void;
  onSupplierSort: (sortKey: string) => void;
  onWarehouseSearchChange: (value: string) => void;
  onWarehouseStatusChange: (value: string) => void;
  onWarehouseReset: () => void;
  onWarehousePageChange: (page: number) => void;
  onWarehouseSort: (sortKey: string) => void;
  onCreateProduct: (data: Omit<Product, 'id'>) => Promise<boolean>;
  onCreateSupplier: (data: Omit<Supplier, 'id'>) => Promise<boolean>;
  onCreateWarehouse: (data: Omit<Warehouse, 'id'>) => Promise<boolean>;
  onUpdateProduct: (id: string, data: Omit<Product, 'id'>) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
  onUpdateSupplier: (id: string, data: Omit<Supplier, 'id'>) => Promise<boolean>;
  onDeleteSupplier: (id: string) => Promise<boolean>;
  onUpdateWarehouse: (id: string, data: Omit<Warehouse, 'id'>) => Promise<boolean>;
  onDeleteWarehouse: (id: string) => Promise<boolean>;
}

export function MastersTab({
  products,
  suppliers,
  warehouses,
  productSearch,
  productStatus,
  productPage,
  productTotal,
  productSort,
  productOrder,
  supplierSearch,
  supplierStatus,
  supplierPage,
  supplierTotal,
  supplierSort,
  supplierOrder,
  warehouseSearch,
  warehouseStatus,
  warehousePage,
  warehouseTotal,
  warehouseSort,
  warehouseOrder,
  onProductSearchChange,
  onProductStatusChange,
  onProductReset,
  onProductPageChange,
  onProductSort,
  onSupplierSearchChange,
  onSupplierStatusChange,
  onSupplierReset,
  onSupplierPageChange,
  onSupplierSort,
  onWarehouseSearchChange,
  onWarehouseStatusChange,
  onWarehouseReset,
  onWarehousePageChange,
  onWarehouseSort,
  onCreateProduct,
  onCreateSupplier,
  onCreateWarehouse,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateSupplier,
  onDeleteSupplier,
  onUpdateWarehouse,
  onDeleteWarehouse
}: MastersTabProps) {
  const [subtab, setSubtab] = useState<'products' | 'suppliers' | 'warehouses'>('products');
  
  // Modal states
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);

  // Form states
  const [newProduct, setNewProduct] = useState<ProductFormState>({ code: '', name: '', unitCode: 'item', minStockQuantity: 0, status: 'active' });
  const [newSupplier, setNewSupplier] = useState<SupplierFormState>({ code: '', name: '', phone: '', email: '', address: '', status: 'active' });
  const [newWarehouse, setNewWarehouse] = useState<WarehouseFormState>({ code: '', name: '', address: '', status: 'active' });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = editingProductId
      ? await onUpdateProduct(editingProductId, newProduct)
      : await onCreateProduct(newProduct);
    if (ok) {
      setIsProductOpen(false);
      setEditingProductId(null);
      setNewProduct({ code: '', name: '', unitCode: 'item', minStockQuantity: 0, status: 'active' });
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = editingSupplierId
      ? await onUpdateSupplier(editingSupplierId, newSupplier)
      : await onCreateSupplier(newSupplier);
    if (ok) {
      setIsSupplierOpen(false);
      setEditingSupplierId(null);
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

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setNewProduct({
      code: product.code,
      name: product.name,
      unitCode: product.unitCode,
      minStockQuantity: product.minStockQuantity,
      status: product.status,
    });
    setIsProductOpen(true);
  };

  const closeProductModal = () => {
    setIsProductOpen(false);
    setEditingProductId(null);
    setNewProduct({ code: '', name: '', unitCode: 'item', minStockQuantity: 0, status: 'active' });
  };

  const startEditSupplier = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setNewSupplier({
      code: supplier.code,
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status,
    });
    setIsSupplierOpen(true);
  };

  const closeSupplierModal = () => {
    setIsSupplierOpen(false);
    setEditingSupplierId(null);
    setNewSupplier({ code: '', name: '', phone: '', email: '', address: '', status: 'active' });
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

  const limit = 10;

  const changeSubtab = (nextSubtab: 'products' | 'suppliers' | 'warehouses') => {
    setSubtab(nextSubtab);
  };

  const handleSort = (nextSort: string) => {
    if (subtab === 'products') {
      onProductSort(nextSort);
      return;
    }
    if (subtab === 'suppliers') {
      onSupplierSort(nextSort);
      return;
    }
    onWarehouseSort(nextSort);
  };

  return (
    <div className="space-y-4">
      {/* Unified Tab Switcher with inline Add button */}
      <PageTabs
        tabs={[
          { id: 'products', label: `Sản phẩm (${products.length})` },
          { id: 'suppliers', label: `Nhà cung cấp (${suppliers.length})` },
          { id: 'warehouses', label: `Kho hàng (${warehouses.length})` },
        ]}
        active={subtab}
        onChange={changeSubtab}
        rightSlot={
          subtab === 'products' ? (
            <button
              onClick={() => {
                setEditingProductId(null);
                setNewProduct({ code: '', name: '', unitCode: 'item', minStockQuantity: 0, status: 'active' });
                setIsProductOpen(true);
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-sm cursor-pointer transition-all"
            >
              + Sản phẩm
            </button>
          ) : subtab === 'suppliers' ? (
            <button
              onClick={() => {
                setEditingSupplierId(null);
                setNewSupplier({ code: '', name: '', phone: '', email: '', address: '', status: 'active' });
                setIsSupplierOpen(true);
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-sm cursor-pointer transition-all"
            >
              + Nhà cung cấp
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingWarehouseId(null);
                setNewWarehouse({ code: '', name: '', address: '', status: 'active' });
                setIsWarehouseOpen(true);
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold shadow-sm cursor-pointer transition-all"
            >
              + Kho hàng
            </button>
          )
        }
      />

      <ListToolbar
        search={subtab === 'products' ? productSearch : subtab === 'suppliers' ? supplierSearch : warehouseSearch}
        searchPlaceholder={subtab === 'products' ? 'Tìm mã, tên sản phẩm...' : subtab === 'suppliers' ? 'Tìm mã, tên NCC...' : 'Tìm mã, tên kho...'}
        onSearchChange={subtab === 'products' ? onProductSearchChange : subtab === 'suppliers' ? onSupplierSearchChange : onWarehouseSearchChange}
        onSearchSubmit={(event) => event.preventDefault()}
        showSearchButton={false}
        searchClassName="!w-64"
        filters={[
          {
            value: subtab === 'products' ? productStatus : subtab === 'suppliers' ? supplierStatus : warehouseStatus,
            placeholder: 'Tất cả trạng thái',
            onChange: subtab === 'products' ? onProductStatusChange : subtab === 'suppliers' ? onSupplierStatusChange : onWarehouseStatusChange,
            options: [
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Ngừng hoạt động' },
            ],
            className: '!w-40',
          },
        ]}
        onReset={subtab === 'products' ? onProductReset : subtab === 'suppliers' ? onSupplierReset : onWarehouseReset}
      />

      <div className="glass-panel border border-border rounded-xl overflow-hidden">
        {subtab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  <th className="px-6 py-4"><SortableHeader label="Mã sản phẩm" sortKey="code" activeSort={productSort} order={productOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tên sản phẩm" sortKey="name" activeSort={productSort} order={productOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Đơn vị tính" sortKey="unitCode" activeSort={productSort} order={productOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-center"><SortableHeader label="Định mức" sortKey="minStockQuantity" activeSort={productSort} order={productOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={productSort} order={productOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có sản phẩm phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
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
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEditProduct(p)} className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-muted cursor-pointer">Sửa</button>
                          <button type="button" onClick={() => onDeleteProduct(p.id)} className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold hover:bg-red-100 cursor-pointer">Xóa</button>
                        </div>
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
                  <th className="px-6 py-4"><SortableHeader label="Mã số" sortKey="code" activeSort={supplierSort} order={supplierOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tên nhà cung cấp" sortKey="name" activeSort={supplierSort} order={supplierOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4"><SortableHeader label="Email" sortKey="email" activeSort={supplierSort} order={supplierOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Địa chỉ</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có nhà cung cấp phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-primary">{s.code}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{s.name}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">{s.phone || '-'}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{s.email || '-'}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{s.address || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => startEditSupplier(s)} className="px-2 py-1 rounded-md border border-border bg-card text-[11px] font-semibold hover:bg-muted cursor-pointer">Sửa</button>
                          <button type="button" onClick={() => onDeleteSupplier(s.id)} className="px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold hover:bg-red-100 cursor-pointer">Xóa</button>
                        </div>
                      </td>
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
                  <th className="px-6 py-4"><SortableHeader label="Mã kho" sortKey="code" activeSort={warehouseSort} order={warehouseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4"><SortableHeader label="Tên kho hàng" sortKey="name" activeSort={warehouseSort} order={warehouseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4">Địa chỉ kho</th>
                  <th className="px-6 py-4"><SortableHeader label="Trạng thái" sortKey="status" activeSort={warehouseSort} order={warehouseOrder} onSort={handleSort} /></th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {warehouses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      Không có kho hàng phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  warehouses.map((w) => (
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
        <PaginationControls
          page={subtab === 'products' ? productPage : subtab === 'suppliers' ? supplierPage : warehousePage}
          limit={limit}
          total={subtab === 'products' ? productTotal : subtab === 'suppliers' ? supplierTotal : warehouseTotal}
          onPageChange={subtab === 'products' ? onProductPageChange : subtab === 'suppliers' ? onSupplierPageChange : onWarehousePageChange}
          alwaysShow
        />
      </div>

      {/* CREATE PRODUCT MODAL */}
      <Modal isOpen={isProductOpen} onClose={closeProductModal} title={editingProductId ? 'Cập nhật Sản phẩm' : 'Thêm Sản phẩm mới'}>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
            <select value={newProduct.status} onChange={e => setNewProduct({...newProduct, status: e.target.value as 'active' | 'inactive'})} className="premium-input">
              <option value="active">Đang kinh doanh</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeProductModal} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">{editingProductId ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}</button>
          </div>
        </form>
      </Modal>

      {/* CREATE SUPPLIER MODAL */}
      <Modal isOpen={isSupplierOpen} onClose={closeSupplierModal} title={editingSupplierId ? 'Cập nhật Nhà cung cấp' : 'Thêm Nhà cung cấp'}>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trạng thái</label>
            <select value={newSupplier.status} onChange={e => setNewSupplier({...newSupplier, status: e.target.value as 'active' | 'inactive'})} className="premium-input">
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeSupplierModal} className="px-4 py-2 border border-border text-xs font-semibold rounded-lg bg-card hover:bg-muted cursor-pointer">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/95 cursor-pointer">{editingSupplierId ? 'Cập nhật' : 'Lưu'}</button>
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
