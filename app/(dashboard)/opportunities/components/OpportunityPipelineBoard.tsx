'use client';

import { Opportunity } from '@/features/opportunities/services/opportunity.service';
import { OPPORTUNITY_STAGES } from './opportunity-stages';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 overflow-x-auto pb-4">
      {OPPORTUNITY_STAGES.map((stage) => {
        const stageOpportunities = opportunities.filter((opportunity) => opportunity.stage === stage.code);
        const stageTotalValue = stageOpportunities.reduce(
          (total, opportunity) => total + Number(opportunity.expectedValue),
          0,
        );

        return (
          <div key={stage.code} className="min-w-[260px] flex flex-col gap-3.5 shrink-0 bg-slate-50/70 p-3.5 rounded-xl border border-border">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">{stage.name}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                  {stageOpportunities.length} thẻ · {formatCurrency(stageTotalValue)}
                </p>
              </div>
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1" />
            </div>

            <div className="h-0.5 bg-border/50" />

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {stageOpportunities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-[11px] border border-dashed border-border rounded-lg bg-card/50">
                  Không có cơ hội
                </div>
              ) : (
                stageOpportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    onClick={() => onOpenOpportunity(opportunity)}
                    className="glass-card bg-card border border-border p-3.5 rounded-xl flex flex-col justify-between gap-3 cursor-pointer"
                  >
                    <div>
                      <span className="font-mono text-[9px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                        {opportunity.code}
                      </span>
                      <h4 className="font-bold text-xs text-foreground mt-1.5 line-clamp-2">{opportunity.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-1 truncate">
                        Khách: {opportunity.customerName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-none">
                        {formatCurrency(opportunity.expectedValue)}
                      </p>
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                        <span>PM: {opportunity.ownerName ? opportunity.ownerName.split(' ')[0] : 'Chưa gán'}</span>
                        <select
                          value={opportunity.stage}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => onStageChange(opportunity.id, event.target.value)}
                          className="bg-secondary text-[10px] rounded border-0 px-1 py-0.5 text-primary font-bold cursor-pointer"
                        >
                          {OPPORTUNITY_STAGES.map((stageOption) => (
                            <option key={stageOption.code} value={stageOption.code}>{stageOption.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
