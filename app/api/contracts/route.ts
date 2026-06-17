import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { createContract, getContracts } from '@/features/contracts/services/contract.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

interface ContractMilestonePayload {
  name?: string;
  dueDate?: string;
  amountDue?: number | string;
}

/**
 * GET: Retrieve list of contracts matching user's permission scope
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getPermissionScope('contracts', 'view');
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing view permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      createdAt: 'ctr.created_at',
      contractNumber: 'ctr.contract_number',
      customerName: 'c.name',
      contractValue: 'ctr.contract_value',
      signedDate: 'ctr.signed_date',
      status: 'ctr.status',
    }, 'createdAt');

    const result = await getContracts({
      search,
      status,
      scope: (scope === 'department' ? 'team' : scope) as 'own' | 'team' | 'all',
      currentUserId: user.id,
      currentUserDeptId: user.departmentId,
      ...pagination,
      ...sort
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('API Contracts GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contracts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a manual draft contract.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await hasPermission('contracts.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing creation permission' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code,
      contractNumber,
      customerId,
      quoteId,
      contractValue,
      ownerUserId,
      notes,
      milestones
    } = body;

    const numericContractValue = Number(contractValue);
    if (!code || !contractNumber || !customerId || !Number.isFinite(numericContractValue) || numericContractValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: code, contractNumber, customerId, contractValue > 0' },
        { status: 400 }
      );
    }

    if (milestones !== undefined) {
      if (!Array.isArray(milestones) || milestones.length === 0) {
        return NextResponse.json({ success: false, error: 'milestones must be a non-empty array' }, { status: 400 });
      }

      const invalidMilestone = milestones.some((milestone: ContractMilestonePayload) => {
        const amountDue = Number(milestone?.amountDue);
        return !milestone?.name || !milestone?.dueDate || !Number.isFinite(amountDue) || amountDue <= 0;
      });

      if (invalidMilestone) {
        return NextResponse.json(
          { success: false, error: 'Each milestone requires name, dueDate and amountDue > 0' },
          { status: 400 }
        );
      }
    }

    const created = await createContract({
      code,
      contractNumber,
      customerId,
      quoteId: quoteId || null,
      contractValue: numericContractValue,
      ownerUserId: ownerUserId || user.id,
      notes: notes || null,
      milestones: milestones?.map((milestone: ContractMilestonePayload) => ({
        name: milestone.name,
        dueDate: milestone.dueDate,
        amountDue: Number(milestone.amountDue)
      })),
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Contract created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Contracts POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create contract' },
      { status: 500 }
    );
  }
}
