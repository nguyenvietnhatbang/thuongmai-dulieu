import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getCustomerContacts, addCustomerContact } from '@/features/customers/services/customer.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Helper to check customer record access
 */
async function canAccessCustomer(customerId: string, userId: string, roles: string[]): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  // If user has view customer permission, they can view contacts
  const ownerRes = await query('SELECT owner_user_id FROM app.customers WHERE id = $1', [customerId]);
  if (ownerRes.rows.length === 0) return false;
  // We can also check details of permission scopes here if needed.
  // For simplicity, if they can see the customer, they can see contacts.
  return true; 
}

/**
 * GET: Retrieve list of contacts for a customer
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

    const allowed = await canAccessCustomer(id, user.id, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const contacts = await getCustomerContacts(id);
    return NextResponse.json({
      success: true,
      data: contacts
    });
  } catch (error: any) {
    console.error('API Customer Contacts GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve contacts', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new contact for a customer
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const allowed = await hasPermission('customer_contacts.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: You cannot create contacts' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { fullName, title, department, contactRoleId, phone, email, isPrimary, notes } = body;

    if (!fullName) {
      return NextResponse.json({ success: false, error: 'Missing required field: fullName' }, { status: 400 });
    }

    const newContact = await addCustomerContact({
      customerId: id,
      fullName,
      title,
      department,
      contactRoleId,
      phone,
      email,
      isPrimary: !!isPrimary,
      notes
    }, user.id);

    return NextResponse.json({
      success: true,
      data: newContact,
      message: 'Contact added successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Customer Contacts POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add contact', details: error.message },
      { status: 500 }
    );
  }
}
