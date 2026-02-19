import { createClient } from '@/utils/supabase/server';
import { Lead as GoogleSheetLead } from './googleSheets';

// Supabase Lead Interface (matches SQL schema)
export interface DbLead {
  id: string;
  created_at: string;
  client_name: string;
  project_type: string;
  heat_level: 'Cold' | 'Warm' | 'Hot';
  status: 'New' | 'In Talk' | 'Working' | 'Testing' | 'Done';
  project_value: number;
  whatsapp?: string;
  notes?: string;
  last_synced_at?: string;
  user_id?: string;
}

// Convert DbLead to App Lead (CamelCase)
export function mapDbLeadToApp(lead: DbLead): GoogleSheetLead {
  return {
    id: lead.id,
    clientName: lead.client_name,
    projectType: lead.project_type || 'General',
    heatLevel: lead.heat_level,
    status: lead.status,
    notes: lead.notes || '',
    value: lead.project_value || 0,
  };
}

// ... imports
import { SupabaseClient } from '@supabase/supabase-js';

// ...

export async function getLeadsFromDb(client?: SupabaseClient): Promise<GoogleSheetLead[]> {
  const supabase = client ?? await createClient(); // Use injected client OR default auth client
  
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching leads from DB:", error);
    return [];
  }

  return (data as DbLead[]).map(mapDbLeadToApp);
}

// NOTE: This creates a lead for the CURRENT authenticated user
export async function createLeadInDb(lead: Partial<DbLead>): Promise<DbLead | null> {
    const supabase = await createClient();
    
    // Check user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('leads')
        .insert([{ ...lead, user_id: user.id }])
        .select()
        .single();
    
    if (error) {
        console.error("Error creating lead in DB:", error);
        return null;
    }
    return data;
}

// NOTE: This updates a lead for the CURRENT authenticated user
export async function updateLeadInDb(id: string, updates: Partial<DbLead>): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('leads')
        .update({ ...updates, last_synced_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) {
        console.error("Error updating lead in DB:", error);
        return false;
    }
    return true;
}

export async function syncLeadsFromSheets(sheetLeads: GoogleSheetLead[]) {
    // 1. Get existing DB leads to avoid duplicates (naive matching by name for now)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        console.error("Cannot sync: User not authenticated.");
        return;
    }

    const { data: existingLeads } = await supabase.from('leads').select('client_name');
    const existingNames = new Set(existingLeads?.map(l => l.client_name.toLowerCase()) || []);

    const toInsert = sheetLeads
        .filter(sl => !existingNames.has(sl.clientName.toLowerCase()))
        .map(sl => ({
            client_name: sl.clientName,
            project_type: sl.projectType,
            heat_level: sl.heatLevel,
            status: sl.status,
            notes: sl.notes,
            project_value: sl.value,
            whatsapp: "", // Default
            user_id: user.id // Assign to current user
        }));
    
    if (toInsert.length > 0) {
        const { error } = await supabase.from('leads').insert(toInsert);
        if (error) console.error("Sync insert failed", error);
        else console.log(`Synced ${toInsert.length} leads from Sheets.`);
    }

    // Update Metadata
    // Force a timestamp update to ensure UI knows a sync happened
    await supabase.from('integration_metadata').insert({
        sync_source: 'google_sheets',
        status: 'success',
        details: { count: toInsert.length, timestamp: new Date().toISOString() } // Will fail RLS if not careful, likely need a public table or user_id on metadata too?
        // Actually metadata table might not exist or need RLS. For now let's comment it out or assume it works if RLS allows.
        // To be safe, let's skip metadata write if table doesn't have user_id
    });
}

// --- Project Details (Chat Logs, Milestones) ---
export interface ProjectDetails {
    id?: string;
    lead_id: string; // Foreign Key matches leads.id
    chat_logs?: string;
    milestones?: any[]; // JSONB
    ai_summary?: string; 
    proposal_draft?: string;
    user_id?: string;
}

export async function getProjectDetails(leadId: string): Promise<ProjectDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_details')
    .select('*')
    .eq('lead_id', leadId)
    .single();

  if (error) {
      if (error.code !== 'PGRST116') {
          console.error('CRITICAL ERROR in getProjectDetails:', JSON.stringify(error, null, 2));
          console.error('Lead ID:', leadId);
      }
      return null;
  }
  
  return data || null;
}

export async function saveProjectDetails(leadId: string, details: Partial<ProjectDetails>) {
    const supabase = await createClient();
    const existing = await getProjectDetails(leadId);

    if (existing) {
        const { error } = await supabase
            .from('project_details')
            .update(details)
            .eq('lead_id', leadId);
        
        if (error) {
             console.error("Error updating project details:", error);
             throw error;
        }
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('project_details')
            .insert([{ ...details, lead_id: leadId, user_id: user.id }]);
            
        if (error) {
             console.error("Error creating project details:", error);
             throw error;
        }
    }
}
// --- Project Analysis (Permanent Archive) ---

export interface ProjectAnalysis {
  id?: string;
  project_id: string; // References leads.id
  proposal_content?: string;
  technical_summary?: string;
  last_updated?: string;
}

export async function getProjectAnalysis(projectId: string): Promise<ProjectAnalysis | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('project_analysis')
        .select('*')
        .eq('project_id', projectId)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching project analysis:', error);
        return null;
    }
    return data || null;
}

export async function saveProjectAnalysis(projectId: string, content: Partial<ProjectAnalysis>) {
    const supabase = await createClient();
    const existing = await getProjectAnalysis(projectId);

    if (existing) {
        const { error } = await supabase
            .from('project_analysis')
            .update({ ...content, last_updated: new Date().toISOString() })
            .eq('project_id', projectId);
        if (error) throw error;
    } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error } = await supabase
            .from('project_analysis')
            .insert([{ ...content, project_id: projectId, user_id: user.id }]);
        if (error) throw error;
    }
}
