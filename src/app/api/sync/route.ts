import { NextResponse } from 'next/server';
import { getLeads } from '@/lib/googleSheets'; // Read from Sheets
import { syncLeadsFromSheets } from '@/lib/crm'; // Write to Supabase

export async function POST() {
  try {
    // 1. Fetch from Google Sheets
    const sheetLeads = await getLeads();
    
    // 2. Sync to Supabase
    await syncLeadsFromSheets(sheetLeads);

    return NextResponse.json({ success: true, count: sheetLeads.length });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
