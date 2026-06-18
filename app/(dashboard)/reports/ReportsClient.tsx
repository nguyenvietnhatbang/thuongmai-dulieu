'use client';

import { useEffect, useState } from 'react';
import { PageTabs } from '@/components/ui/ListControls';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

interface UserSession {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

interface ReportSummary {
  purchases: { count: number; totalAmount: number };
  sales: { count: number; totalAmount: number; paidAmount: number; debtAmount: number };
  inventory: { totalProducts: number; lowStockItems: number; totalQuantityOnHand: number };
  receivables: { totalDue: number; totalPaid: number; totalRemaining: number; overdueCount: number };
  salesByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  purchaseByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  lowStockItems: Array<{
    productCode: string;
    productName: string;
    warehouseName: string;
    quantityOnHand: number;
    minQuantity: number;
    unitCode: string;
  }>;
}

interface ReportOption {
  id: string;
  name: string;
  code?: string;
}

export function ReportsClient({ currentUser }: { currentUser: UserSession }) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [customers, setCustomers] = useState<ReportOption[]>([]);
  const [suppliers, setSuppliers] = useState<ReportOption[]>([]);
  const [warehouses, setWarehouses] = useState<ReportOption[]>([]);

  // Detail drill-down list states
  const [detailType, setDetailType] = useState<'sales' | 'purchases' | 'inventory'>('sales');
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailPage, setDetailPage] = useState(1);
  const [detailTotal, setDetailTotal] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailLimit = 20;

  useEffect(() => {
    const fetchOptions = async () => {
      const [customerRes, supplierRes, warehouseRes] = await Promise.all([
        fetch('/api/customers?limit=100').then((res) => res.json()),
        fetch('/api/inventory/suppliers?limit=100&status=active&sort=name&order=asc').then((res) => res.json()),
        fetch('/api/inventory/warehouses?limit=100&status=active&sort=name&order=asc').then((res) => res.json()),
      ]);
      if (customerRes.success) setCustomers(customerRes.data);
      if (supplierRes.success) setSuppliers(supplierRes.data);
      if (warehouseRes.success) setWarehouses(warehouseRes.data);
    };

    fetchOptions().catch(() => undefined);
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (customerId) params.set('customerId', customerId);
        if (supplierId) params.set('supplierId', supplierId);
        if (warehouseId) params.set('warehouseId', warehouseId);

        const res = await fetch(`/api/reports/summary?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setSummary(json.data);
        } else {
          setError(json.error || 'Không tải được báo cáo');
        }
      } catch {
        setError('Không tải được báo cáo');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [dateFrom, dateTo, customerId, supplierId, warehouseId]);

  const fetchDetailData = async () => {
    setDetailLoading(true);
    try {
      const params = new URLSearchParams({
        type: detailType,
        page: detailPage.toString(),
        limit: detailLimit.toString(),
      });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (customerId) params.set('customerId', customerId);
      if (supplierId) params.set('supplierId', supplierId);
      if (warehouseId) params.set('warehouseId', warehouseId);

      const res = await fetch(`/api/reports/details?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDetailData(json.data);
        setDetailTotal(json.pagination.total || json.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [detailType, detailPage, dateFrom, dateTo, customerId, supplierId, warehouseId]);

  useEffect(() => {
    setDetailPage(1);
  }, [detailType, dateFrom, dateTo, customerId, supplierId, warehouseId]);

  const handleExportDetail = () => {
    const params = new URLSearchParams({
      type: detailType,
    });
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (customerId) params.set('customerId', customerId);
    if (supplierId) params.set('supplierId', supplierId);
    if (warehouseId) params.set('warehouseId', warehouseId);

    window.open(`/api/reports/details/export?${params.toString()}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Bản nháp';
      case 'ordered': return 'Đã đặt hàng';
      case 'received': return 'Đã nhập đủ';
      case 'confirmed': return 'Đã xác nhận';
      case 'delivered': return 'Đã giao hàng';
      case 'partially_paid': return 'Thu một phần';
      case 'paid': return 'Đã thu đủ';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const canExport = currentUser.roles.includes('system_management') || currentUser.permissions.includes('reports.export.team');
  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCustomerId('');
    setSupplierId('');
    setWarehouseId('');
  };

  return (
    <div className="flex h-full w-full items-stretch overflow-hidden gap-6">
      <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-6">

      <div className="glass-panel p-4 rounded-xl flex flex-nowrap gap-3 items-center overflow-x-auto">
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="premium-input h-10 !w-40 shrink-0"
          aria-label="Từ ngày"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="premium-input h-10 !w-40 shrink-0"
          aria-label="Đến ngày"
        />
        <SearchableSelect
          value={customerId}
          placeholder="Tất cả khách hàng"
          searchPlaceholder="Tìm khách hàng..."
          options={customers.map((customer) => ({
            value: customer.id,
            label: customer.name,
            description: customer.code,
          }))}
          onChange={setCustomerId}
          className="w-48 shrink-0"
        />
        <SearchableSelect
          value={supplierId}
          placeholder="Tất cả NCC"
          searchPlaceholder="Tìm nhà cung cấp..."
          options={suppliers.map((supplier) => ({
            value: supplier.id,
            label: supplier.name,
            description: supplier.code,
          }))}
          onChange={setSupplierId}
          className="w-48 shrink-0"
        />
        <SearchableSelect
          value={warehouseId}
          placeholder="Tất cả kho"
          searchPlaceholder="Tìm kho..."
          options={warehouses.map((warehouse) => ({
            value: warehouse.id,
            label: warehouse.name,
            description: warehouse.code,
          }))}
          onChange={setWarehouseId}
          className="w-44 shrink-0"
        />
        <button
          type="button"
          onClick={resetFilters}
          className="h-10 px-3 border border-border rounded-lg bg-card text-xs font-semibold text-slate-600 hover:bg-muted transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          Xóa lọc
        </button>
      </div>

      {loading ? (
        <div className="glass-panel py-20 text-center text-muted-foreground rounded-xl">
          <p className="text-xs animate-pulse">Đang tải dữ liệu báo cáo...</p>
        </div>
      ) : error ? (
        <div className="glass-panel py-20 text-center text-rose-600 rounded-xl">
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Mua hàng</p>
              <h3 className="text-xl font-extrabold text-foreground mt-1">{formatCurrency(summary.purchases.totalAmount)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.purchases.count} phiếu mua</p>
              <a href="/inventory" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem chứng từ mua</a>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Bán hàng</p>
              <h3 className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(summary.sales.totalAmount)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.sales.count} đơn bán</p>
              <a href="/inventory" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem đơn bán</a>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Công nợ còn lại</p>
              <h3 className="text-xl font-extrabold text-rose-600 mt-1">{formatCurrency(summary.receivables.totalRemaining)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.receivables.overdueCount} khoản quá hạn</p>
              <a href="/receivables" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem công nợ</a>
            </div>
            <div className="glass-panel p-4 rounded-xl">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Tồn kho</p>
              <h3 className="text-xl font-extrabold text-primary mt-1">{summary.inventory.totalQuantityOnHand}</h3>
              <p className="text-xs text-muted-foreground mt-1">{summary.inventory.lowStockItems} SKU dưới định mức</p>
              <a href="/inventory" className="inline-block text-xs font-bold text-primary mt-3 hover:underline">Xem tồn kho</a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportTable title="Báo cáo bán hàng theo trạng thái" rows={summary.salesByStatus} formatCurrency={formatCurrency} statusText={statusText} />
            <ReportTable title="Báo cáo mua hàng theo trạng thái" rows={summary.purchaseByStatus} formatCurrency={formatCurrency} statusText={statusText} />
          </div>

          <div className="glass-panel rounded-xl overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-border bg-slate-50/50">
              <h2 className="text-sm font-bold text-foreground">Cảnh báo tồn kho thấp</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                    <th className="px-6 py-4">Mã hàng</th>
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4">Kho</th>
                    <th className="px-6 py-4 text-right">Tồn</th>
                    <th className="px-6 py-4 text-right">Định mức</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {summary.lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        Không có mặt hàng dưới định mức.
                      </td>
                    </tr>
                  ) : summary.lowStockItems.map(item => (
                    <tr key={`${item.productCode}-${item.warehouseName}`} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4 font-mono text-xs text-primary">{item.productCode}</td>
                      <td className="px-6 py-4 font-bold text-foreground">{item.productName}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">{item.warehouseName}</td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600">{item.quantityOnHand} {item.unitCode}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-600">{item.minQuantity} {item.unitCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Reports Detailed Drill-Down Section */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border mt-8">
        <PageTabs
          tabs={[
            { id: 'sales', label: 'Chi tiết bán hàng' },
            { id: 'purchases', label: 'Chi tiết mua hàng' },
            { id: 'inventory', label: 'Chi tiết tồn kho' },
          ]}
          active={detailType}
          onChange={(v) => setDetailType(v as any)}
          rightSlot={
            canExport ? (
              <button
                onClick={handleExportDetail}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-primary-foreground text-xs font-semibold shadow-md shadow-emerald-500/15 transition-all flex items-center gap-1 cursor-pointer mr-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Xuất CSV chi tiết
              </button>
            ) : undefined
          }
        />

        <div className="overflow-x-auto min-h-[200px]">
          {detailLoading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-[11px]">Đang tải dữ liệu chi tiết...</p>
            </div>
          ) : detailData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-16">Không tìm thấy bản ghi chi tiết nào phù hợp.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                  {detailType === 'sales' && (
                    <>
                      <th className="px-6 py-4">Mã đơn bán</th>
                      <th className="px-6 py-4">Ngày bán</th>
                      <th className="px-6 py-4">Khách hàng</th>
                      <th className="px-6 py-4 text-right">Tổng trị giá</th>
                      <th className="px-6 py-4 text-right">Đã thanh toán</th>
                      <th className="px-6 py-4 text-right">Còn nợ</th>
                      <th className="px-6 py-4">Trạng thái</th>
                    </>
                  )}
                  {detailType === 'purchases' && (
                    <>
                      <th className="px-6 py-4">Mã phiếu mua</th>
                      <th className="px-6 py-4">Ngày mua</th>
                      <th className="px-6 py-4">Nhà cung cấp</th>
                      <th className="px-6 py-4 text-right">Tổng thanh toán</th>
                      <th className="px-6 py-4">Trạng thái</th>
                    </>
                  )}
                  {detailType === 'inventory' && (
                    <>
                      <th className="px-6 py-4">Mã sản phẩm</th>
                      <th className="px-6 py-4">Tên sản phẩm</th>
                      <th className="px-6 py-4">Kho hàng</th>
                      <th className="px-6 py-4 text-right">Tồn thực tế</th>
                      <th className="px-6 py-4 text-right">Định mức tối thiểu</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {detailData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/20">
                    {detailType === 'sales' && (
                      <>
                        <td className="px-6 py-4 font-mono font-bold text-primary">{row.code}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.saleDate ? new Date(row.saleDate).toLocaleDateString('vi-VN') : '-'}</td>
                        <td className="px-6 py-4 font-bold text-foreground">{row.customerName}</td>
                        <td className="px-6 py-4 text-right font-bold text-foreground">{formatCurrency(row.totalAmount)}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600">{formatCurrency(row.paidAmount)}</td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600">{formatCurrency(row.debtAmount)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                            {statusText(row.status)}
                          </span>
                        </td>
                      </>
                    )}
                    {detailType === 'purchases' && (
                      <>
                        <td className="px-6 py-4 font-mono font-bold text-primary">{row.code}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString('vi-VN') : '-'}</td>
                        <td className="px-6 py-4 font-bold text-foreground">{row.supplierName}</td>
                        <td className="px-6 py-4 text-right font-bold text-foreground">{formatCurrency(row.totalAmount)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
                            {statusText(row.status)}
                          </span>
                        </td>
                      </>
                    )}
                    {detailType === 'inventory' && (
                      <>
                        <td className="px-6 py-4 font-mono font-bold text-primary">{row.productCode}</td>
                        <td className="px-6 py-4 font-bold text-foreground">{row.productName}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{row.warehouseName}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">{row.quantityOnHand} {row.unitCode}</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-400">{row.minQuantity} {row.unitCode}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Inline detailed pagination controls */}
        {!detailLoading && detailTotal > detailLimit && (
          <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-border text-xs shrink-0 select-none">
            <span className="font-semibold text-muted-foreground">
              Hiển thị {((detailPage - 1) * detailLimit) + 1} - {Math.min(detailPage * detailLimit, detailTotal)} trong tổng số {detailTotal} dòng
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={detailPage === 1}
                onClick={() => setDetailPage(p => Math.max(p - 1, 1))}
                className="px-2 py-1 rounded border border-border bg-card font-bold hover:bg-muted disabled:opacity-50 disabled:hover:bg-card cursor-pointer"
              >
                Trước
              </button>
              <span className="px-3 py-1 font-bold text-foreground bg-secondary/50 rounded">{detailPage}</span>
              <button
                disabled={detailPage * detailLimit >= detailTotal}
                onClick={() => setDetailPage(p => p + 1)}
                className="px-2 py-1 rounded border border-border bg-card font-bold hover:bg-muted disabled:opacity-50 disabled:hover:bg-card cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

function ReportTable({
  title,
  rows,
  formatCurrency,
  statusText,
}: {
  title: string;
  rows: Array<{ status: string; count: number; totalAmount: number }>;
  formatCurrency: (value: number) => string;
  statusText: (status: string) => string;
}) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-border">
      <div className="px-6 py-4 border-b border-border bg-slate-50/50">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-border text-muted-foreground text-xs uppercase font-semibold">
            <th className="px-6 py-4">Trạng thái</th>
            <th className="px-6 py-4 text-right">Số lượng</th>
            <th className="px-6 py-4 text-right">Giá trị</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(row => (
            <tr key={row.status}>
              <td className="px-6 py-4 font-semibold text-foreground">{statusText(row.status)}</td>
              <td className="px-6 py-4 text-right font-mono">{row.count}</td>
              <td className="px-6 py-4 text-right font-bold">{formatCurrency(row.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
