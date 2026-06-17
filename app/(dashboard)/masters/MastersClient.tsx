'use client';

import { useState, useEffect } from 'react';
import { MastersTab } from '../inventory/components/MastersTab';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export function MastersClient({}: { currentUser: UserSession }) {
  // Loading and data states
  const [loading, setLoading] = useState(true);
  const [productRows, setProductRows] = useState<any[]>([]);
  const [supplierRows, setSupplierRows] = useState<any[]>([]);
  const [warehouseRows, setWarehouseRows] = useState<any[]>([]);

  const [productPage, setProductPage] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [productSearch, setProductSearch] = useState('');
  const [productStatus, setProductStatus] = useState('');
  const [productSort, setProductSort] = useState('name');
  const [productOrder, setProductOrder] = useState<'asc' | 'desc'>('asc');

  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatus, setSupplierStatus] = useState('');
  const [supplierSort, setSupplierSort] = useState('name');
  const [supplierOrder, setSupplierOrder] = useState<'asc' | 'desc'>('asc');

  const [warehousePage, setWarehousePage] = useState(1);
  const [warehouseTotal, setWarehouseTotal] = useState(0);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [warehouseStatus, setWarehouseStatus] = useState('');
  const [warehouseSort, setWarehouseSort] = useState('name');
  const [warehouseOrder, setWarehouseOrder] = useState<'asc' | 'desc'>('asc');

  const fetchProductRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(productPage),
        limit: '10',
        sort: productSort,
        order: productOrder,
      });
      if (productSearch) params.set('search', productSearch);
      if (productStatus) params.set('status', productStatus);

      const res = await fetch(`/api/inventory/products?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProductRows(json.data);
        setProductTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(supplierPage),
        limit: '10',
        sort: supplierSort,
        order: supplierOrder,
      });
      if (supplierSearch) params.set('search', supplierSearch);
      if (supplierStatus) params.set('status', supplierStatus);

      const res = await fetch(`/api/inventory/suppliers?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSupplierRows(json.data);
        setSupplierTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(warehousePage),
        limit: '10',
        sort: warehouseSort,
        order: warehouseOrder,
      });
      if (warehouseSearch) params.set('search', warehouseSearch);
      if (warehouseStatus) params.set('status', warehouseStatus);

      const res = await fetch(`/api/inventory/warehouses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setWarehouseRows(json.data);
        setWarehouseTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductRows();
  }, [productPage, productSearch, productStatus, productSort, productOrder]);

  useEffect(() => {
    fetchSupplierRows();
  }, [supplierPage, supplierSearch, supplierStatus, supplierSort, supplierOrder]);

  useEffect(() => {
    fetchWarehouseRows();
  }, [warehousePage, warehouseSearch, warehouseStatus, warehouseSort, warehouseOrder]);

  // Actions
  const handleCreateProduct = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchProductRows();
        return true;
      } else {
        alert(json.error || 'Error creating product');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateProduct = async (id: string, data: any) => {
    try {
      const res = await fetch('/api/inventory/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (json.success) {
        fetchProductRows();
        return true;
      }
      alert(json.error || 'Error updating product');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Xóa sản phẩm này? Chỉ sản phẩm chưa phát sinh tồn kho/chứng từ mới được xóa.')) return false;
    try {
      const res = await fetch(`/api/inventory/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchProductRows();
        return true;
      }
      alert(json.error || 'Error deleting product');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateSupplier = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchSupplierRows();
        return true;
      } else {
        alert(json.error || 'Error creating supplier');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateSupplier = async (id: string, data: any) => {
    try {
      const res = await fetch('/api/inventory/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (json.success) {
        fetchSupplierRows();
        return true;
      }
      alert(json.error || 'Error updating supplier');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Xóa nhà cung cấp này? Chỉ nhà cung cấp chưa có đơn mua mới được xóa.')) return false;
    try {
      const res = await fetch(`/api/inventory/suppliers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchSupplierRows();
        return true;
      }
      alert(json.error || 'Error deleting supplier');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleCreateWarehouse = async (data: any) => {
    try {
      const res = await fetch('/api/inventory/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        fetchWarehouseRows();
        return true;
      } else {
        alert(json.error || 'Error creating warehouse');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateWarehouse = async (id: string, data: any) => {
    try {
      const res = await fetch('/api/inventory/warehouses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (json.success) {
        fetchWarehouseRows();
        return true;
      }
      alert(json.error || 'Error updating warehouse');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Xóa kho hàng này? Chỉ kho chưa có phát sinh tồn kho/chứng từ mới được xóa.')) return false;
    try {
      const res = await fetch(`/api/inventory/warehouses?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchWarehouseRows();
        return true;
      }
      alert(json.error || 'Error deleting warehouse');
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Danh Mục Cơ Sở</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý các danh mục nền tảng: sản phẩm kinh doanh, danh sách nhà cung cấp và hệ thống kho bãi.
          </p>
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="relative">
        <div className="animate-fade-in">
          <MastersTab
            products={productRows}
            suppliers={supplierRows}
            warehouses={warehouseRows}
            productSearch={productSearch}
            productStatus={productStatus}
            productPage={productPage}
            productTotal={productTotal}
            productSort={productSort}
            productOrder={productOrder}
            supplierSearch={supplierSearch}
            supplierStatus={supplierStatus}
            supplierPage={supplierPage}
            supplierTotal={supplierTotal}
            supplierSort={supplierSort}
            supplierOrder={supplierOrder}
            warehouseSearch={warehouseSearch}
            warehouseStatus={warehouseStatus}
            warehousePage={warehousePage}
            warehouseTotal={warehouseTotal}
            warehouseSort={warehouseSort}
            warehouseOrder={warehouseOrder}
            onProductSearchChange={(value) => { setProductSearch(value); setProductPage(1); }}
            onProductStatusChange={(value) => { setProductStatus(value); setProductPage(1); }}
            onProductReset={() => { setProductSearch(''); setProductStatus(''); setProductPage(1); }}
            onProductPageChange={setProductPage}
            onProductSort={(nextSort) => {
              setProductOrder(productSort === nextSort && productOrder === 'asc' ? 'desc' : 'asc');
              setProductSort(nextSort);
              setProductPage(1);
            }}
            onSupplierSearchChange={(value) => { setSupplierSearch(value); setSupplierPage(1); }}
            onSupplierStatusChange={(value) => { setSupplierStatus(value); setSupplierPage(1); }}
            onSupplierReset={() => { setSupplierSearch(''); setSupplierStatus(''); setSupplierPage(1); }}
            onSupplierPageChange={setSupplierPage}
            onSupplierSort={(nextSort) => {
              setSupplierOrder(supplierSort === nextSort && supplierOrder === 'asc' ? 'desc' : 'asc');
              setSupplierSort(nextSort);
              setSupplierPage(1);
            }}
            onWarehouseSearchChange={(value) => { setWarehouseSearch(value); setWarehousePage(1); }}
            onWarehouseStatusChange={(value) => { setWarehouseStatus(value); setWarehousePage(1); }}
            onWarehouseReset={() => { setWarehouseSearch(''); setWarehouseStatus(''); setWarehousePage(1); }}
            onWarehousePageChange={setWarehousePage}
            onWarehouseSort={(nextSort) => {
              setWarehouseOrder(warehouseSort === nextSort && warehouseOrder === 'asc' ? 'desc' : 'asc');
              setWarehouseSort(nextSort);
              setWarehousePage(1);
            }}
            onCreateProduct={handleCreateProduct}
            onCreateSupplier={handleCreateSupplier}
            onCreateWarehouse={handleCreateWarehouse}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onUpdateWarehouse={handleUpdateWarehouse}
            onDeleteWarehouse={handleDeleteWarehouse}
          />
        </div>
      </div>
    </div>
  );
}
