import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSchedules, createProjectSchedule } from '@/features/projects/services/project.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const scheduleType = searchParams.get('scheduleType') || undefined;
    const status = searchParams.get('status') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      startsAt: 's.starts_at',
      endsAt: 's.ends_at',
      title: 's.title',
      scheduleType: 's.schedule_type',
      status: 's.status',
      customerName: 'c.name',
      projectName: 'p.name',
      ownerName: 'u.full_name',
    }, 'startsAt');

    const result = await getSchedules({
      search,
      scheduleType,
      status,
      ...pagination,
      ...sort,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('API Schedules GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, projectId, scheduleType, title, startsAt, endsAt, ownerUserId, notes } = body;

    if (!customerId || !scheduleType || !title || !startsAt) {
      return NextResponse.json({
        success: false,
        error: 'Mã khách hàng, loại lịch trình, tiêu đề và thời gian bắt đầu là bắt buộc!'
      }, { status: 400 });
    }

    const newSchedule = await createProjectSchedule({
      projectId: projectId || null,
      customerId,
      scheduleType,
      title,
      startsAt,
      endsAt: endsAt || null,
      ownerUserId: ownerUserId || user.id,
      status: 'planned',
      notes: notes || null,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: newSchedule,
      message: 'Tạo lịch trình thành công!'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Schedules POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
