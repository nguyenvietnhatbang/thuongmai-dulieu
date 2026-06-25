import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { deleteCustomerContact, updateCustomerContact } from '@/features/customers/services/customer.service';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = user.roles.includes('system_management') || await hasPermission('customer_contacts.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { contactId } = await params;
    const body = await request.json();
    const { fullName, title, department, contactRoleId, phone, email, isPrimary, notes } = body;

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'fullName is required' }, { status: 400 });
    }

    const contact = await updateCustomerContact(contactId, {
      fullName,
      title,
      department,
      contactRoleId,
      phone,
      email,
      isPrimary: !!isPrimary,
      notes,
    }, user.id);

    return NextResponse.json({ success: true, data: contact });
  } catch (error) {
    console.error('API Customer Contact PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = user.roles.includes('system_management') || await hasPermission('customer_contacts.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { contactId } = await params;
    const deleted = await deleteCustomerContact(contactId, user.id);
    return NextResponse.json({ success: true, data: { deleted } });
  } catch (error) {
    console.error('API Customer Contact DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete contact' }, { status: 500 });
  }
}
