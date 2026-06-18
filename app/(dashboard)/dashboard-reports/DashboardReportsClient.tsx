'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import type { ApexOptions } from 'apexcharts';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface OptionRecord {
  id: string;
  name: string;
  code?: string;
}

interface DashboardAnalytics {
  serviceFlow: Array<{ label: string; count: number }>;
  quoteStatus: Array<{ status: string; count: number; totalAmount: number }>;
  contractStatus: Array<{ status: string; count: number; totalAmount: number }>;
  projectStatus: Array<{ status: string; count: number }>;
  commerceSummary: {
    purchaseTotal: number;
    salesTotal: number;
    paidTotal: number;
    debtTotal: number;
    receivableRemaining: number;
    lowStockItems: number;
  };
  salesByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  purchasesByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  receivablesByStatus: Array<{ status: string; count: number; totalRemaining: number }>;
  inventoryByWarehouse: Array<{ warehouseName: string; quantityOnHand: number; lowStockItems: number }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);
}

function statusText(status: string) {
  const map: Record<string, string> = {
    draft: 'Nháp',
    sent: 'Đã gửi',
    revision_requested: 'Cần sửa',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    converted: 'Chuyển HĐ',
    negotiating: 'Đàm phán',
    signed: 'Đã ký',
    paused: 'Tạm dừng',
    completed: 'Hoàn tất',
    confirmed: 'Xác nhận',
    delivered: 'Giao hàng',
    partially_paid: 'Thu một phần',
    paid: 'Đã thu đủ',
    ordered: 'Đã đặt',
    partially_received: 'Nhận một phần',
    received: 'Đã nhận',
    not_due: 'Chưa đến hạn',
    due_soon: 'Sắp đến hạn',
    due_today: 'Hạn hôm nay',
    overdue: 'Quá hạn',
    cancelled: 'Đã hủy',
    new: 'Mới',
    waiting_deployment: 'Chờ triển khai',
    in_progress: 'Đang làm',
    closed: 'Đã đóng',
  };
  return map[status] || status;
}

function baseChartOptions(): ApexOptions {
  return {
    chart: {
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: '#64748b',
    },
    dataLabels: { enabled: false },
    grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
    legend: { position: 'bottom', fontSize: '12px' },
    tooltip: { theme: 'light' },
  };
}

function ChartPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 min-h-[340px]">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function DashboardReportsClient() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [customers, setCustomers] = useState<OptionRecord[]>([]);
  const [suppliers, setSuppliers] = useState<OptionRecord[]>([]);
  const [warehouses, setWarehouses] = useState<OptionRecord[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const [customerRes, supplierRes, warehouseRes] = await Promise.all([
        fetch('/api/customers?limit=100&sort=name&order=asc').then((res) => res.json()),
        fetch('/api/inventory/suppliers?limit=100&status=active&sort=name&order=asc').then((res) => res.json()),
        fetch('/api/inventory/warehouses?limit=100&status=active&sort=name&order=asc').then((res) => res.json()),
      ]);
      if (customerRes.success) setCustomers(customerRes.data);
      if (supplierRes.success) setSuppliers(supplierRes.data);
      if (warehouseRes.success) setWarehouses(warehouseRes.data);
    };

    loadOptions().catch(() => undefined);
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        if (customerId) params.set('customerId', customerId);
        if (supplierId) params.set('supplierId', supplierId);
        if (warehouseId) params.set('warehouseId', warehouseId);

        const response = await fetch(`/api/dashboard/analytics?${params.toString()}`);
        const json = await response.json();
        if (!json.success) {
          setError(json.error || 'Không tải được dữ liệu biểu đồ.');
          return;
        }
        setAnalytics(json.data);
      } catch {
        setError('Không tải được dữ liệu biểu đồ.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [dateFrom, dateTo, customerId, supplierId, warehouseId]);

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setCustomerId('');
    setSupplierId('');
    setWarehouseId('');
  };

  const serviceFlowOptions = useMemo<ApexOptions>(() => ({
    ...baseChartOptions(),
    chart: { ...baseChartOptions().chart, type: 'bar' },
    colors: ['#2563eb'],
    plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '42%' } },
    xaxis: { categories: analytics?.serviceFlow.map((item) => item.label) || [] },
  }), [analytics]);

  const quoteStatusOptions = useMemo<ApexOptions>(() => ({
    ...baseChartOptions(),
    labels: analytics?.quoteStatus.map((item) => statusText(item.status)) || [],
    colors: ['#64748b', '#2563eb', '#f59e0b', '#10b981', '#ef4444', '#7c3aed'],
  }), [analytics]);

  const commerceMoneyOptions = useMemo<ApexOptions>(() => ({
    ...baseChartOptions(),
    chart: { ...baseChartOptions().chart, type: 'bar' },
    colors: ['#0f766e'],
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    xaxis: {
      categories: ['Mua hàng', 'Bán hàng', 'Đã thu', 'Còn nợ', 'Công nợ còn lại'],
      labels: { formatter: (value) => formatCurrency(Number(value)) },
    },
    tooltip: { y: { formatter: (value) => formatCurrency(value) } },
  }), []);

  const statusCompareOptions = useMemo<ApexOptions>(() => ({
    ...baseChartOptions(),
    chart: { ...baseChartOptions().chart, type: 'bar', stacked: false },
    colors: ['#16a34a', '#f59e0b'],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '45%' } },
    xaxis: {
      categories: Array.from(new Set([
        ...(analytics?.salesByStatus.map((item) => statusText(item.status)) || []),
        ...(analytics?.purchasesByStatus.map((item) => statusText(item.status)) || []),
      ])),
    },
  }), [analytics]);

  const inventoryOptions = useMemo<ApexOptions>(() => ({
    ...baseChartOptions(),
    chart: { ...baseChartOptions().chart, type: 'bar' },
    colors: ['#0284c7', '#ef4444'],
    plotOptions: { bar: { borderRadius: 3, columnWidth: '48%' } },
    xaxis: { categories: analytics?.inventoryByWarehouse.map((item) => item.warehouseName) || [] },
  }), [analytics]);

  const statusCategories = statusCompareOptions.xaxis && !Array.isArray(statusCompareOptions.xaxis)
    ? (statusCompareOptions.xaxis.categories as string[] || [])
    : [];

  return (
    <div className="h-full overflow-y-auto pr-2 pb-8 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard báo cáo</h1>
          <p className="text-sm text-muted-foreground mt-1">Biểu đồ vận hành cho luồng dịch vụ và luồng thương mại.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 flex flex-nowrap gap-3 items-center overflow-x-auto">
        <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="premium-input h-10 !w-40 shrink-0" />
        <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="premium-input h-10 !w-40 shrink-0" />
        <SearchableSelect
          value={customerId}
          placeholder="Tất cả khách hàng"
          searchPlaceholder="Tìm khách hàng..."
          options={customers.map((customer) => ({ value: customer.id, label: customer.name, description: customer.code }))}
          onChange={setCustomerId}
          className="w-52 shrink-0"
        />
        <SearchableSelect
          value={supplierId}
          placeholder="Tất cả NCC"
          searchPlaceholder="Tìm nhà cung cấp..."
          options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name, description: supplier.code }))}
          onChange={setSupplierId}
          className="w-48 shrink-0"
        />
        <SearchableSelect
          value={warehouseId}
          placeholder="Tất cả kho"
          searchPlaceholder="Tìm kho..."
          options={warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name, description: warehouse.code }))}
          onChange={setWarehouseId}
          className="w-44 shrink-0"
        />
        <button type="button" onClick={resetFilters} className="h-10 px-3 border border-border rounded-lg bg-card text-xs font-semibold text-slate-600 hover:bg-muted cursor-pointer whitespace-nowrap">
          Xóa lọc
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center text-xs text-muted-foreground">Đang tải biểu đồ...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 py-20 text-center text-sm font-semibold text-rose-700">{error}</div>
      ) : analytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              ['Mua hàng', analytics.commerceSummary.purchaseTotal],
              ['Bán hàng', analytics.commerceSummary.salesTotal],
              ['Đã thu', analytics.commerceSummary.paidTotal],
              ['Còn nợ', analytics.commerceSummary.debtTotal],
              ['Công nợ còn lại', analytics.commerceSummary.receivableRemaining],
              ['SKU tồn thấp', analytics.commerceSummary.lowStockItems],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
                <p className="mt-2 text-lg font-extrabold text-foreground">
                  {typeof value === 'number' && label !== 'SKU tồn thấp' ? formatCurrency(value) : value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartPanel title="Luồng dịch vụ: Cơ hội → Báo giá → Hợp đồng → Dự án">
              <Chart options={serviceFlowOptions} series={[{ name: 'Số lượng', data: analytics.serviceFlow.map((item) => item.count) }]} type="bar" height={280} />
            </ChartPanel>

            <ChartPanel title="Trạng thái báo giá">
              <Chart options={quoteStatusOptions} series={analytics.quoteStatus.map((item) => item.count)} type="donut" height={280} />
            </ChartPanel>

            <ChartPanel title="Giá trị thương mại và công nợ">
              <Chart
                options={commerceMoneyOptions}
                series={[{
                  name: 'Giá trị',
                  data: [
                    analytics.commerceSummary.purchaseTotal,
                    analytics.commerceSummary.salesTotal,
                    analytics.commerceSummary.paidTotal,
                    analytics.commerceSummary.debtTotal,
                    analytics.commerceSummary.receivableRemaining,
                  ],
                }]}
                type="bar"
                height={280}
              />
            </ChartPanel>

            <ChartPanel title="Trạng thái mua hàng và bán hàng">
              <Chart
                options={statusCompareOptions}
                series={[
                  {
                    name: 'Bán hàng',
                    data: statusCategories.map((label) => analytics.salesByStatus.find((item) => statusText(item.status) === label)?.count || 0),
                  },
                  {
                    name: 'Mua hàng',
                    data: statusCategories.map((label) => analytics.purchasesByStatus.find((item) => statusText(item.status) === label)?.count || 0),
                  },
                ]}
                type="bar"
                height={280}
              />
            </ChartPanel>

            <ChartPanel title="Tồn kho theo kho">
              <Chart
                options={inventoryOptions}
                series={[
                  { name: 'Tồn thực tế', data: analytics.inventoryByWarehouse.map((item) => item.quantityOnHand) },
                  { name: 'SKU tồn thấp', data: analytics.inventoryByWarehouse.map((item) => item.lowStockItems) },
                ]}
                type="bar"
                height={280}
              />
            </ChartPanel>

            <ChartPanel title="Công nợ theo trạng thái">
              <Chart
                options={{
                  ...baseChartOptions(),
                  labels: analytics.receivablesByStatus.map((item) => statusText(item.status)),
                  colors: ['#64748b', '#38bdf8', '#f59e0b', '#ef4444', '#10b981', '#a855f7'],
                  tooltip: { y: { formatter: (value) => formatCurrency(value) } },
                }}
                series={analytics.receivablesByStatus.map((item) => item.totalRemaining)}
                type="pie"
                height={280}
              />
            </ChartPanel>
          </div>
        </>
      )}
    </div>
  );
}
