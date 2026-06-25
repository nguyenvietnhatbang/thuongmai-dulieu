import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getQuoteById, updateQuote, deleteQuote } from '@/features/quotes/services/quote.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Check row-level access for quotes
 */
async function canAccessQuote(
  quoteId: string,
  userId: string,
  userDeptId: string | null,
  roles: string[]
): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  const scope = await getPermissionScope('quotes', 'view');
  if (!scope) return false;
  if (scope === 'all') return true;

  const res = await query('SELECT quoted_by FROM app.quotes WHERE id = $1', [quoteId]);
  if (res.rows.length === 0) return false;
  const ownerId = res.rows[0].quoted_by;

  if (scope === 'own') {
    return ownerId === userId;
  }

  if (scope === 'team' && userDeptId) {
    if (!ownerId) return false;
    const ownerDeptRes = await query('SELECT department_id FROM app.users WHERE id = $1', [ownerId]);
    return ownerDeptRes.rows[0]?.department_id === userDeptId;
  }

  return false;
}

/**
 * GET: Retrieve single quote details with line items
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const allowed = await canAccessQuote(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to this quote' }, { status: 403 });
    }

    const quote = await getQuoteById(id);
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: quote
    });
  } catch (error: any) {
    console.error('API Quote GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve quote', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update quote and items, or approve it
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check basic edit permission (requires access to the quote)
    const allowed = await canAccessQuote(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to edit this quote' }, { status: 403 });
    }

    const body = await request.json();
    if (body.vatRate !== undefined && body.vatRate !== null && body.vatRate !== '') {
      const vatRate = Number(body.vatRate);
      if (!Number.isFinite(vatRate) || vatRate < 0) {
        return NextResponse.json({ success: false, error: 'vatRate must be a non-negative number' }, { status: 400 });
      }
      body.vatRate = vatRate;
    }

    // Enforce Approval permission if updating status to "approved"
    if (body.status === 'approved') {
      const canApprove = user.roles.includes('system_management') || await hasPermission('quotes.approve.team');
      if (!canApprove) {
        return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to approve quotes' }, { status: 403 });
      }
    }

    const updated = await updateQuote(id, { ...body, userId: user.id });
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Quote updated successfully'
    });
  } catch (error: any) {
    console.error('API Quote PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quote', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a quote
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canDel = user.roles.includes('system_management') || await hasPermission('quotes.create.all');
    if (!canDel) {
      return NextResponse.json({ success: false, error: 'Forbidden: Permission denied' }, { status: 403 });
    }

    const { id } = await params;

    const deleted = await deleteQuote(id, user.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Quote not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully'
    });
  } catch (error: any) {
    console.error('API Quote DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete quote', details: error.message },
      { status: 500 }
    );
  }
}
