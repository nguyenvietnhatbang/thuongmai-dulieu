'use client';

import { useState } from 'react';
import { Opportunity } from '@/features/opportunities/services/opportunity.service';
import { OPPORTUNITY_STAGES } from './opportunity-stages';

const STAGE_THEME: Record<string, { column: string; header: string; drop: string; card: string; code: string }> = {
  new: {
    column: '!border-blue-200 bg-blue-50/70 ring-1 ring-blue-100',
    header: '!border-blue-500 bg-blue-100/80 text-blue-900',
    drop: '!border-blue-400 bg-blue-100/80 text-blue-700',
    card: '!border-blue-200 bg-blue-50/60 hover:!border-blue-400 hover:bg-blue-50',
    code: 'bg-blue-100 text-blue-700',
  },
  consulting: {
    column: '!border-indigo-200 bg-indigo-50/70 ring-1 ring-indigo-100',
    header: '!border-indigo-500 bg-indigo-100/80 text-indigo-900',
    drop: '!border-indigo-400 bg-indigo-100/80 text-indigo-700',
    card: '!border-indigo-200 bg-indigo-50/60 hover:!border-indigo-400 hover:bg-indigo-50',
    code: 'bg-indigo-100 text-indigo-700',
  },
  info_sent: {
    column: '!border-purple-200 bg-purple-50/70 ring-1 ring-purple-100',
    header: '!border-purple-500 bg-purple-100/80 text-purple-900',
    drop: '!border-purple-400 bg-purple-100/80 text-purple-700',
    card: '!border-purple-200 bg-purple-50/60 hover:!border-purple-400 hover:bg-purple-50',
    code: 'bg-purple-100 text-purple-700',
  },
  waiting_quote: {
    column: '!border-amber-200 bg-amber-50/80 ring-1 ring-amber-100',
    header: '!border-amber-500 bg-amber-100/80 text-amber-900',
    drop: '!border-amber-400 bg-amber-100/80 text-amber-700',
    card: '!border-amber-200 bg-amber-50/70 hover:!border-amber-400 hover:bg-amber-50',
    code: 'bg-amber-100 text-amber-700',
  },
  quoted: {
    column: '!border-teal-200 bg-teal-50/70 ring-1 ring-teal-100',
    header: '!border-teal-500 bg-teal-100/80 text-teal-900',
    drop: '!border-teal-400 bg-teal-100/80 text-teal-700',
    card: '!border-teal-200 bg-teal-50/60 hover:!border-teal-400 hover:bg-teal-50',
    code: 'bg-teal-100 text-teal-700',
  },
  paused: {
    column: '!border-slate-300 bg-slate-100/80 ring-1 ring-slate-200',
    header: '!border-slate-500 bg-slate-200/80 text-slate-900',
    drop: '!border-slate-400 bg-slate-200/80 text-slate-700',
    card: '!border-slate-300 bg-slate-100/70 hover:!border-slate-500 hover:bg-slate-100',
    code: 'bg-slate-200 text-slate-700',
  },
  won: {
    column: '!border-emerald-200 bg-emerald-50/75 ring-1 ring-emerald-100',
    header: '!border-emerald-500 bg-emerald-100/80 text-emerald-900',
    drop: '!border-emerald-400 bg-emerald-100/80 text-emerald-700',
    card: '!border-emerald-200 bg-emerald-50/65 hover:!border-emerald-400 hover:bg-emerald-50',
    code: 'bg-emerald-100 text-emerald-700',
  },
  lost: {
    column: '!border-rose-200 bg-rose-50/75 ring-1 ring-rose-100',
    header: '!border-rose-500 bg-rose-100/80 text-rose-900',
    drop: '!border-rose-400 bg-rose-100/80 text-rose-700',
    card: '!border-rose-200 bg-rose-50/65 hover:!border-rose-400 hover:bg-rose-50',
    code: 'bg-rose-100 text-rose-700',
  },
};

interface OpportunityPipelineBoardProps {
  opportunities: Opportunity[];
  formatCurrency: (amount: number) => string;
  onOpenOpportunity: (opportunity: Opportunity) => void;
  onStageChange: (opportunityId: string, stage: string) => void;
}

export function OpportunityPipelineBoard({
  opportunities,
  formatCurrency,
  onOpenOpportunity,
  onStageChange,
}: OpportunityPipelineBoardProps) {
  const [draggingOpportunityId, setDraggingOpportunityId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const draggingOpportunity = opportunities.find((opportunity) => opportunity.id === draggingOpportunityId);

  const handleDropOnStage = (stageCode: string) => {
    if (!draggingOpportunity || draggingOpportunity.stage === stageCode) {
      setDraggingOpportunityId(null);
      setDragOverStage(null);
      return;
    }

    onStageChange(draggingOpportunity.id, stageCode);
    setDraggingOpportunityId(null);
    setDragOverStage(null);
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex w-max min-w-full items-stretch gap-4">
        {OPPORTUNITY_STAGES.map((stage) => {
          const theme = STAGE_THEME[stage.code] || STAGE_THEME.new;
          const stageOpportunities = opportunities.filter((opportunity) => opportunity.stage === stage.code);
          const stageTotalValue = stageOpportunities.reduce(
            (total, opportunity) => total + Number(opportunity.expectedValue),
            0,
          );

          return (
            <div
              key={stage.code}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverStage(stage.code);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragOverStage(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDropOnStage(stage.code);
              }}
              className={`flex h-[calc(100vh-21rem)] min-h-[520px] w-[320px] shrink-0 flex-col gap-3 rounded-lg border p-3 transition-colors ${
                dragOverStage === stage.code
                  ? `${theme.drop} border-dashed`
                  : theme.column
              }`}
            >
              <div className={`rounded-md border-l-4 px-3 py-2.5 shadow-sm ${theme.header}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-bold uppercase text-foreground">{stage.name}</h3>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">
                      {stageOpportunities.length} thẻ · {formatCurrency(stageTotalValue)}
                    </p>
                  </div>
                  <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {stageOpportunities.length}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {dragOverStage === stage.code && (
                  <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-current bg-white/70 text-[11px] font-bold">
                    Thả vào {stage.name}
                  </div>
                )}

                {stageOpportunities.length === 0 ? (
                  <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-card/60 px-3 text-center text-[11px] text-slate-400">
                    Không có cơ hội
                  </div>
                ) : (
                  stageOpportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      draggable
                      onDragStart={(event) => {
                        setDraggingOpportunityId(opportunity.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', opportunity.id);
                      }}
                      onDragEnd={() => {
                        setDraggingOpportunityId(null);
                        setDragOverStage(null);
                      }}
                      onClick={() => {
                        if (draggingOpportunityId) return;
                        onOpenOpportunity(opportunity);
                      }}
                      className={`rounded-lg border p-3.5 shadow-sm transition-all cursor-grab active:cursor-grabbing ${theme.card} ${
                        draggingOpportunityId === opportunity.id
                          ? 'scale-[0.98] border-primary/40 opacity-55 shadow-none'
                          : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <span className={`inline-block max-w-full truncate rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${theme.code}`}>
                          {opportunity.code}
                        </span>
                        <h4 className="mt-2 line-clamp-2 text-sm font-bold leading-5 text-foreground">{opportunity.title}</h4>
                        <p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground" title={opportunity.customerName}>
                          Khách: {opportunity.customerName}
                        </p>
                      </div>

                      <p className="mt-3 text-sm font-bold text-slate-900">
                        {formatCurrency(opportunity.expectedValue)}
                      </p>

                      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                        <span className="min-w-0 flex-1 truncate">
                          PM: {opportunity.ownerName || 'Chưa gán'}
                        </span>
                        <select
                          value={opportunity.stage}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => onStageChange(opportunity.id, event.target.value)}
                          className="h-7 max-w-[118px] shrink-0 rounded-md border border-border bg-secondary px-2 text-[10px] font-bold text-primary cursor-pointer"
                        >
                          {OPPORTUNITY_STAGES.map((stageOption) => (
                            <option key={stageOption.code} value={stageOption.code}>{stageOption.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
