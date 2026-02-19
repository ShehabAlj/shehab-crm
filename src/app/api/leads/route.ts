import { NextResponse } from 'next/server';
import { getIncomingLeads } from '@/lib/googleSheets';
import { getLeadsFromDb, createLeadInDb, updateLeadInDb, DbLead } from '@/lib/crm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'incoming') {
      // Incoming leads still come from the raw Google Sheet (Website Form)
      const incoming = await getIncomingLeads();
      return NextResponse.json(incoming);
  }

  // Main leads now come from Supabase
  const leads = await getLeadsFromDb();
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Basic validation
    if (!body.clientName || !body.projectType) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const result = await createLeadInDb({
        client_name: body.clientName,
        project_type: body.projectType,
        heat_level: body.heatLevel || 'Warm',
        status: body.status || 'New',
        notes: body.notes || '',
        project_value: body.value || 0,
    });

    if (result) {
        return NextResponse.json({ success: true, lead: result });
    } else {
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }

    // Map updates to DB columns if necessary, or pass raw if keys match? 
    // The body comes from frontend which uses camelCase. DB uses snake_case.
    const dbUpdates: Partial<DbLead> = {};
    if (updates.clientName) dbUpdates.client_name = updates.clientName;
    if (updates.projectType) dbUpdates.project_type = updates.projectType;
    if (updates.heatLevel) dbUpdates.heat_level = updates.heatLevel;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.notes) dbUpdates.notes = updates.notes;
    if (updates.value !== undefined) dbUpdates.project_value = updates.value;

    const success = await updateLeadInDb(id, dbUpdates);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
