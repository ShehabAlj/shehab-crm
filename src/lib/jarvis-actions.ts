import { createClient } from '@/utils/supabase/server';
import { getProjectAnalysis, saveProjectAnalysis, getProjectDetails } from './crm';

// --- Helper: Fuzzy Find Lead ---
export async function findLeadByName(name: string) {
    const supabase = await createClient();
    // ilike matches case-insensitive. RLS ensures we only see our own leads.
    const { data: leads } = await supabase.from('leads').select('id, client_name, project_value').ilike('client_name', `%${name}%`);
    if (leads && leads.length > 0) return leads[0];
    return null;
}

// --- Context Engine ---
export async function getDeepClientContext(leadId: string) {
    const supabase = await createClient();
    const [details, analysis, leadRes] = await Promise.all([
        getProjectDetails(leadId), // Uses createClient internally
        getProjectAnalysis(leadId), // Uses createClient internally
        supabase.from('leads').select('*').eq('id', leadId).single()
    ]);
    
    const lead = leadRes.data;
    if (!lead) return null;

    // Stagnation Check
    const lastUpdate = new Date(lead.updated_at || lead.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const isStagnant = lead.status === 'Working' && diffDays > 7;

    return {
        client: lead.client_name,
        status: lead.status,
        value: lead.project_value,
        stagnant: isStagnant,
        days_inactive: diffDays,
        technical_summary: analysis?.technical_summary || "No technical analysis archived.",
        latest_proposal: analysis?.proposal_content || "No proposal drafted.",
        recent_chat_logs: details?.chat_logs || "No recent team notes.",
        milestones: details?.milestones || []
    };
}

// --- Tool: Update Status ---
export async function updateProjectStatus(leadId: string, status: string) {
    const supabase = await createClient();
    // Validate status (basic check, can be expanded)
    const validStatuses = ['New', 'In Talk', 'Working', 'Testing', 'Done'];
    // Simple mapping or strict check
    const mappedStatus = validStatuses.find(s => s.toLowerCase() === status.toLowerCase()) || status;

    const { error } = await supabase
        .from('leads')
        .update({ status: mappedStatus, last_synced_at: new Date().toISOString() })
        .eq('id', leadId);

    if (error) throw new Error(`Failed to update status: ${error.message}`);
    return `Updated status to ${mappedStatus}.`;
}

// --- Tool: Financial Report ---
export async function getFinancialReport() {
    const supabase = await createClient();
    // RLS ensures we only fetch *our* leads
    const { data: leads } = await supabase.from('leads').select('project_value, status');
    if (!leads) return "No data found.";

    const totalValue = leads.reduce((sum, l) => sum + (l.project_value || 0), 0);
    const activeCount = leads.filter(l => l.status === 'Working').length;
    const goal = 2000;
    const progress = Math.round((totalValue / goal) * 100);

    return `
    REPORT (My Pipeline):
    - Total Pipeline Value: ${totalValue.toLocaleString()} OMR
    - Goal Progress: ${progress}% of ${goal.toLocaleString()} OMR
    - Active Projects: ${activeCount}
    `;
}

// --- Tool: Generate & Archive Proposal ---
export async function generateAndArchiveProposal(leadId: string, clientName: string, projectValue: number, notes: string) {
    try {
        // 1. Generate Proposal (Call OpenRouter directly here to reuse logic)
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const prompt = `
            Act as a Professional Proposal Writer.
            Client: ${clientName}
            Value: ${projectValue} OMR
            Notes: ${notes}
            
            Generate a concise, high-impact project proposal (max 300 words).
            Include: Strategy, Deliverables, Investment.
            Format: Plain Text.
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://shehab-crm.com", 
                "X-Title": "Shehab CRM"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [{ "role": "user", "content": prompt }]
            })
        });

        const data = await response.json();
        const proposalText = data.choices?.[0]?.message?.content || "Generation failed.";

        // 2. Archive it
        await saveProjectAnalysis(leadId, {
            project_id: leadId,
            proposal_content: proposalText
        });

        return "Proposal generated and archived to Intelligence folder.";

    } catch (e: any) {
        console.error("Jarvis Proposal Error:", e);
        throw new Error(`Proposal generation failed: ${e.message}`);
    }
}
