import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getQuotes, createQuote } from '@/features/quotes/services/quote.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of quotes matching user's permission scope
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getPermissionScope('quotes', 'view');
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing view permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      createdAt: 'q.created_at',
      quoteNumber: 'q.quote_number',
      customerName: 'c.name',
      quoteDate: 'q.quote_date',
      totalAmount: 'q.total_amount',
      status: 'q.status',
    }, 'createdAt');

    const result = await getQuotes({
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
    console.error('API Quotes GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new quote with line-items
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await hasPermission('quotes.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing creation permission' }, { status: 403 });
    }

    const body = await request.json();
    const { code, quoteNumber, customerId, opportunityId, quoteDate, quotedBy, termsNote, items } = body;

    if (!code || !quoteNumber || !customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing required fields: code, quoteNumber, customerId, items[]' }, { status: 400 });
    }

    const newQuote = await createQuote({
      code,
      quoteNumber,
      customerId,
      opportunityId,
      quoteDate,
      quotedBy,
      termsNote,
      items,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: newQuote,
      message: 'Quote created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Quotes POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quote', details: error.message },
      { status: 500 }
    );
  }
}
