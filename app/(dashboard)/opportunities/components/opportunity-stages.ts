export const OPPORTUNITY_STAGES = [
  { code: 'new', name: 'Mới tạo', color: 'border-blue-400 bg-blue-50/20 text-blue-700' },
  { code: 'consulting', name: 'Đang tư vấn', color: 'border-indigo-400 bg-indigo-50/20 text-indigo-700' },
  { code: 'info_sent', name: 'Đã gửi thông tin', color: 'border-purple-400 bg-purple-50/20 text-purple-700' },
  { code: 'waiting_quote', name: 'Chờ báo giá', color: 'border-amber-400 bg-amber-50/20 text-amber-700' },
  { code: 'quoted', name: 'Đã báo giá', color: 'border-teal-400 bg-teal-50/20 text-teal-700' },
  { code: 'paused', name: 'Tạm dừng', color: 'border-slate-400 bg-slate-50/20 text-slate-700' },
  { code: 'won', name: 'Thành công (Won)', color: 'border-emerald-400 bg-emerald-50/20 text-emerald-700' },
  { code: 'lost', name: 'Thất bại (Lost)', color: 'border-rose-400 bg-rose-50/20 text-rose-700' }
];

export function getOpportunityStage(code: string) {
  return OPPORTUNITY_STAGES.find((stage) => stage.code === code);
}
