import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardMetrics } from '@/features/dashboard/services/dashboard.service';

export const dynamic = 'force-dynamic';

interface FeatureCard {
  title: string;
  description: string;
  href: string;
  badge: string;
  tone: string;
  icon: React.ReactNode;
}

const iconClass = 'h-5 w-5';

const serviceFlow: FeatureCard[] = [
  {
    title: 'Khách hàng',
    description: 'Hồ sơ, liên hệ và lịch sử chăm sóc.',
    href: '/customers',
    badge: 'Danh bạ khách',
    tone: 'blue',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-6a4 4 0 11-8 0 4 4 0 018 0zm8 1a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Cơ hội',
    description: 'Pipeline tư vấn và khả năng chốt.',
    href: '/opportunities',
    badge: 'Pipeline',
    tone: 'emerald',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title: 'Báo giá',
    description: 'Tạo, duyệt và in báo giá.',
    href: '/quotes',
    badge: 'PDF',
    tone: 'violet',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 3h6l4 4v14H7V3z" />
      </svg>
    ),
  },
  {
    title: 'Hợp đồng',
    description: 'Ký kết, thanh toán và dự án.',
    href: '/contracts',
    badge: 'Tạo dự án',
    tone: 'slate',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Dự án',
    description: 'Tiến độ, việc, lịch và ghi chú.',
    href: '/projects',
    badge: 'Triển khai',
    tone: 'indigo',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m-8 4h10M7 13h4m-4 4h6M5 3h14v18H5V3z" />
      </svg>
    ),
  },
  {
    title: 'Chăm sóc',
    description: 'Nhắc hẹn và kết quả chăm sóc.',
    href: '/customer-care',
    badge: 'CSKH',
    tone: 'rose',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.3 6.3a4.5 4.5 0 016.4 0L12 7.6l1.3-1.3a4.5 4.5 0 116.4 6.4L12 20.4l-7.7-7.7a4.5 4.5 0 010-6.4z" />
      </svg>
    ),
  },
];

const commerceFlow: FeatureCard[] = [
  {
    title: 'Mua hàng',
    description: 'PO, nhập kho và chứng từ.',
    href: '/purchases',
    badge: 'Nhập hàng',
    tone: 'sky',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12l1 14H5L6 7zm3 0a3 3 0 116 0" />
      </svg>
    ),
  },
  {
    title: 'Tồn kho',
    description: 'Tồn thực tế và cảnh báo thấp.',
    href: '/inventory',
    badge: 'Kho',
    tone: 'cyan',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zM4 7v10l8 4 8-4V7" />
      </svg>
    ),
  },
  {
    title: 'Bán hàng',
    description: 'Đơn bán, xuất kho và thu tiền.',
    href: '/inventory',
    badge: 'Xuất kho',
    tone: 'emerald',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 7l1 12h10l1-12M9 11h6" />
      </svg>
    ),
  },
  {
    title: 'Công nợ',
    description: 'Theo dõi phải thu và quá hạn.',
    href: '/receivables',
    badge: 'Excel',
    tone: 'red',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2 0-3 .8-3 2s1 2 3 2 3 .8 3 2-1 2-3 2m0-8V6m0 12v-2" />
      </svg>
    ),
  },
  {
    title: 'Báo cáo',
    description: 'Mua, bán, tồn kho và chi tiết.',
    href: '/reports',
    badge: 'Bảng biểu',
    tone: 'amber',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17v-5m4 5V7m4 10v-8M5 21h14" />
      </svg>
    ),
  },
  {
    title: 'Danh mục',
    description: 'Sản phẩm, kho và nhà cung cấp.',
    href: '/masters',
    badge: 'Cấu hình',
    tone: 'zinc',
    icon: (
      <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
];

const toneClasses: Record<string, { card: string; icon: string; badge: string; hover: string }> = {
  blue: {
    card: 'border-blue-100',
    icon: 'border-blue-200 text-blue-600',
    badge: 'border-blue-200 text-blue-600 bg-blue-50',
    hover: 'hover:border-blue-200 hover:bg-blue-50/35',
  },
  emerald: {
    card: 'border-emerald-100',
    icon: 'border-emerald-200 text-emerald-600',
    badge: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/35',
  },
  violet: {
    card: 'border-violet-100',
    icon: 'border-violet-200 text-violet-600',
    badge: 'border-violet-200 text-violet-700 bg-violet-50',
    hover: 'hover:border-violet-200 hover:bg-violet-50/35',
  },
  slate: {
    card: 'border-slate-200',
    icon: 'border-slate-300 text-slate-700',
    badge: 'border-slate-300 text-slate-700 bg-slate-50',
    hover: 'hover:border-slate-300 hover:bg-slate-50',
  },
  indigo: {
    card: 'border-indigo-100',
    icon: 'border-indigo-200 text-indigo-600',
    badge: 'border-indigo-200 text-indigo-700 bg-indigo-50',
    hover: 'hover:border-indigo-200 hover:bg-indigo-50/35',
  },
  rose: {
    card: 'border-rose-100',
    icon: 'border-rose-200 text-rose-600',
    badge: 'border-rose-200 text-rose-700 bg-rose-50',
    hover: 'hover:border-rose-200 hover:bg-rose-50/35',
  },
  sky: {
    card: 'border-sky-100',
    icon: 'border-sky-200 text-sky-600',
    badge: 'border-sky-200 text-sky-700 bg-sky-50',
    hover: 'hover:border-sky-200 hover:bg-sky-50/35',
  },
  cyan: {
    card: 'border-cyan-100',
    icon: 'border-cyan-200 text-cyan-700',
    badge: 'border-cyan-200 text-cyan-700 bg-cyan-50',
    hover: 'hover:border-cyan-200 hover:bg-cyan-50/35',
  },
  red: {
    card: 'border-red-100',
    icon: 'border-red-200 text-red-600',
    badge: 'border-red-200 text-red-700 bg-red-50',
    hover: 'hover:border-red-200 hover:bg-red-50/35',
  },
  amber: {
    card: 'border-amber-100',
    icon: 'border-amber-200 text-amber-600',
    badge: 'border-amber-200 text-amber-700 bg-amber-50',
    hover: 'hover:border-amber-200 hover:bg-amber-50/35',
  },
  zinc: {
    card: 'border-zinc-200',
    icon: 'border-zinc-300 text-zinc-700',
    badge: 'border-zinc-300 text-zinc-700 bg-zinc-50',
    hover: 'hover:border-zinc-300 hover:bg-zinc-50',
  },
};

function FlowChain({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
              {step}
            </span>
            {index < steps.length - 1 && <span className="text-slate-300">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureGrid({ title, steps, items }: { title: string; steps: string[]; items: FeatureCard[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-extrabold text-foreground">{title}</h2>
      <FlowChain steps={steps} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => {
          const tone = toneClasses[item.tone] || toneClasses.blue;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={`group min-h-[150px] rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all ${tone.card} ${tone.hover}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-lg border bg-white shadow-sm ${tone.icon}`}>
                  {item.icon}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${tone.badge}`}>
                  {item.badge}
                </span>
              </div>
              <h3 className="mt-6 text-base font-extrabold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const [currentUser, metrics] = await Promise.all([
    getCurrentUser(),
    getDashboardMetrics(),
  ]);

  const serviceCards = serviceFlow.map((item) => {
    if (item.title === 'Khách hàng') return { ...item, badge: `${metrics.totalCustomers} khách` };
    if (item.title === 'Cơ hội') return { ...item, badge: `${metrics.activeOpportunities} mở` };
    if (item.title === 'Báo giá') return { ...item, badge: `${metrics.pendingQuotes} chờ` };
    if (item.title === 'Hợp đồng') return { ...item, badge: `${metrics.signedContracts} đã ký` };
    if (item.title === 'Dự án') return { ...item, badge: `${metrics.activeProjects} chạy` };
    return item;
  });

  const commerceCards = commerceFlow.map((item) => {
    if (item.title === 'Mua hàng') return { ...item, badge: `${metrics.purchaseCount} phiếu` };
    if (item.title === 'Bán hàng') return { ...item, badge: `${metrics.salesCount} đơn` };
    if (item.title === 'Tồn kho') return { ...item, badge: `${metrics.lowStockItems} cảnh báo` };
    return item;
  });

  return (
    <div className="h-full overflow-y-auto pr-2 pb-8 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">
            {currentUser?.fullName.split('(')[0].trim() || 'Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Chọn nhanh module làm việc theo từng luồng vận hành.</p>
        </div>
        <Link
          href="/dashboard-reports"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-600 hover:bg-blue-50"
        >
          Dashboard báo cáo
        </Link>
      </div>

      <FeatureGrid
        title="Luồng dịch vụ tư vấn / dự án"
        steps={['Khách hàng', 'Cơ hội', 'Báo giá', 'Hợp đồng', 'Dự án', 'Công nợ', 'Chăm sóc lại']}
        items={serviceCards}
      />
      <FeatureGrid
        title="Luồng thương mại / kho"
        steps={['Nhà cung ứng', 'Mua hàng', 'Nhập kho', 'Tồn kho', 'Bán hàng', 'Công nợ', 'Báo cáo']}
        items={commerceCards}
      />
    </div>
  );
}
