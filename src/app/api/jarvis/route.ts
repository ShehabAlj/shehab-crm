import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getRecentMemory, saveMemory } from '@/lib/jarvis-memory';
import { 
    getDeepClientContext, 
    findLeadByName, 
    updateProjectStatus, 
    generateAndArchiveProposal, 
    getFinancialReport 
} from '@/lib/crm';

export async function POST(req: Request) {
    try {
        const { command } = await req.json();
        if (!command) return NextResponse.json({ error: "No command provided" }, { status: 400 });

        const supabase = await createClient();
        
        // 0. Get User ID (Required for Memory)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Gather Global Context (Mini-State) - Scoped to User via RLS
        const { data: leads } = await supabase.from('leads').select('id, client_name, status, project_value, notes');
        const globalSummary = leads?.map(l => `- ${l.client_name} (${l.status})`).join('\n') || "No leads.";

        // 2. Identify Subject (Simple Heuristic or AI-based if needed)
        // ... (keep existing detectedClient logic) ...
        let focusedContext = "";
        const detectedClient = leads?.find(l => command.toLowerCase().includes(l.client_name.toLowerCase()));
        
        if (detectedClient) {
            const deepContext = await getDeepClientContext(detectedClient.id);
            if (deepContext) {
                focusedContext = `
                *** DEEP DIVE CONTEXT FOR: ${deepContext.client} ***
                Status: ${deepContext.status} (Inactive for ${deepContext.days_inactive} days)
                ${deepContext.stagnant ? "⚠️ STAGNATION WARNING: Project in 'Working' for >7 days without updates." : ""}
                
                LATEST TECHNICAL ANALYSIS:
                ${deepContext.technical_summary}

                COMMUNICATION LOGS:
                ${deepContext.recent_chat_logs}

                LATEST PROPOSAL DRAFT:
                ${deepContext.latest_proposal.substring(0, 200)}...
                `;
            }
        }

        // 2.5. Fetch Long-Term Memory
        const memory = await getRecentMemory(supabase, user.id, 15);
        
        // Extract the last meaningful assistant/user topic
        let lastTopicContext = "No prior conversation context.";
        if (memory.length > 0) {
            lastTopicContext = memory
                .slice(-3) // Look at the last 3 messages for immediate context
                .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
                .join('\n');
        }

        const systemPrompt = `
            You are Jarvis, a high-level Technical Architect & Chief of Staff.
            Your ultimate goal is to maximize technical ROI, project velocity, and hit the OMR 2,000 revenue target. 
            Do NOT offer generic project management advice. Focus strictly on technical execution, system architecture, and unblocking development.

            GLOBAL PIPELINE:
            ${globalSummary}

            ${focusedContext}

            RECENT CONTEXT & MEMORY:
            ${lastTopicContext}

            INSTRUCTIONS - "CONTEXT-FIRST" THINKING:
            1. If the user greets you (e.g., 'Hi', 'Hello'), DO NOT reply with a generic greeting. Look at the RECENT CONTEXT above. If there is an ongoing topic, say: "Welcome back. We were last discussing [Topic Name]. Are we ready to push that forward?"
            2. Pull specific Technical Requirements, Milestones, or Proposals from the DEEP DIVE CONTEXT. Avoid generic phrases like "Analyzing Project...". Be specific with the data.
            3. If the project is STAGNANT, proactively suggest an architectural or technical intervention to unblock it. 
            4. Be concise, high-density, and executive.
            5. If you do NOT have enough technical data to be specific, DO NOT invent a generic plan. Instead, ask a targeted, high-level technical question to gather the missing requirements.

            AVAILABLE TOOLS (Output JSON ONLY for actions - no markdown wrapped JSON blocks if you want it to execute cleanly, though the system will attempt to parse it):
            
            1. MOVE CARD: { "tool": "update_status", "client": "Name", "status": "New|In Talk|Working|Testing|Done" }
            2. GENERATE PROPOSAL: { "tool": "generate_proposal", "client": "Name" }
            3. FINANCIAL REPORT: { "tool": "financial_report" }

            Example Chain of Thought Response:
            "Analyzing Lava Cafe infrastructure... Status is Working but stagnant (8 days). Technical schema requires redundant load balancing.
            Plan:
            1. Review AWS redundancy configuration (Technical).
            2. Update status to Testing once Terraform is applied.
            
            Are the load balancer health checks passing, or should we review the logs?"
        `;

        // 3. Call AI with History
        const apiKey = process.env.OPENROUTER_API_KEY;
        
        // Construct Message Array: System -> History -> User
        const messages = [
            { "role": "system", "content": systemPrompt },
            ...memory.map(m => ({ "role": m.role, "content": m.content })),
            { "role": "user", "content": command }
        ];

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
                "messages": messages
            })
        });

        const aiData = await response.json();
        const content = aiData.choices?.[0]?.message?.content || "";

        // 4. Archiving (Fire-and-Forget)
        // Store the interaction in long-term memory
        if (user && user.id) {
            Promise.all([
                saveMemory(supabase, user.id, command, 'user', 'web'),
                saveMemory(supabase, user.id, content, 'assistant', 'web')
            ]).catch(err => console.error("Memory saving failed", err));
        }

        // 5. Parse & Execute logic...
        const results: string[] = [];
        let finalReply = content; // Default to raw text if no JSON found

        try {
            // Attempt to find JSON in the response (It might be wrapped in markdown code blocks)
            const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const cleanJson = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '');
                const parsed = JSON.parse(cleanJson);
                
                // If it's an array of commands/results
                const toolArray = Array.isArray(parsed) ? parsed : [parsed];
                
                for (const tool of toolArray) {
                    if (tool.tool === 'update_status') {
                        const lead = await findLeadByName(tool.client);
                        if (lead) {
                            const res = await updateProjectStatus(lead.id, tool.status);
                            results.push(`[STATUS] ${res}`);
                        } else {
                            results.push(`[ERROR] Client '${tool.client}' not found.`);
                        }
                    } 
                    else if (tool.tool === 'generate_proposal') {
                         const lead = await findLeadByName(tool.client);
                         if (lead) {
                             // Context for proposal
                             const fullLead = leads?.find(l => l.id === lead.id);
                             const res = await generateAndArchiveProposal(lead.id, lead.client_name, fullLead?.project_value || 0, fullLead?.notes || "");
                             results.push(`[PROPOSAL] ${res}`);
                         } else {
                             results.push(`[ERROR] Client '${tool.client}' not found.`);
                         }
                    }
                    else if (tool.tool === 'financial_report') {
                        const res = await getFinancialReport();
                        results.push(`[FINANCE] ${res}`);
                    }
                }
                finalReply = results.join('\n');
            }
        } catch (e) {
            console.error("Jarvis Parse Error", e);
            // If parse fails, just return the raw content (maybe it wasn't a tool call)
        }

        return NextResponse.json({ reply: finalReply });

    } catch (error) {
        console.error("Jarvis API Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
