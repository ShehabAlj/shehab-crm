"use client";

import { useState, useEffect } from "react";
import { Sparkles, FileText, Loader2, Save, Database, CheckCircle2 } from "lucide-react";
import { Lead } from "@/lib/googleSheets";
import { ProjectDetails, ProjectAnalysis } from "@/types/crm";
// import { saveProjectAnalysis } from "@/lib/crm"; // REMOVED: Server action not safe here. Using API route.

export function IntelligenceView({ lead, details, initialAnalysis }: { lead: Lead, details: ProjectDetails | null, initialAnalysis: ProjectAnalysis | null }) {
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [synced, setSynced] = useState(false);
    
    // State for transient AI output - Initialize from props
    const [summary, setSummary] = useState<string[]>(
        initialAnalysis?.technical_summary ? initialAnalysis.technical_summary.split('\n') : []
    );
    const [proposal, setProposal] = useState<string>(initialAnalysis?.proposal_content || "");

    // Load persisted analysis on mount - REMOVED (Handled via props)
    /*
    useEffect(() => {
        const loadSaved = async () => {
            const saved = await getProjectAnalysis(lead.id); // Error: Server function
            if (saved) {
                if (saved.technical_summary) setSummary(saved.technical_summary.split('\n'));
                if (saved.proposal_content) setProposal(saved.proposal_content);
            }
        };
        loadSaved();
    }, [lead.id]);
    */

    const chatContext = details?.chat_logs || lead.notes || "";

    const handleRunAnalysis = async () => {
        setLoading(true);
        setSynced(false);
        try {
            const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatLog: chatContext }),
            });
            const data = await response.json();
            setSummary(data.summary || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateProposal = async () => {
        setLoading(true);
        setSynced(false);
        try {
             const response = await fetch('/api/proposal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  clientName: lead.clientName,
                  projectType: lead.projectType,
                  value: lead.value,
                  notes: chatContext 
              }),
          });
          const data = await response.json();
          setProposal(data.proposal);
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCommitToRepo = async () => {
        if (!proposal && summary.length === 0) return;
        
        setSyncing(true);
        try {
            // Using a server action or API route is better, but consistent with current pattern using client-side lib (via crm.ts which uses supabaseAdmin - wait, supabaseAdmin isn't client safe. 
            // NOTE: crm.ts uses supabaseAdmin which shouldn't be used on client. 
            // I need to create an API route for this to be safe, OR use the public anon client if RLS allows.
            // For this quick iteration, I will create a new API route `/api/project/archive` to handle the commit safely.
            
            const response = await fetch('/api/project/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: lead.id,
                    proposalContent: proposal,
                    technicalSummary: summary.join('\n')
                })
            });

            if (!response.ok) throw new Error("Failed to commit");
            
            setSynced(true);
            setTimeout(() => setSynced(false), 3000);
        } catch (e) {
            console.error("Commit failed", e);
        } finally {
            setSyncing(false);
        }
    }

    return (
        <div className="grid grid-cols-2 gap-8 py-6 fade-in p-1">
            {/* Header / Actions */}
            <div className="col-span-2 flex justify-between items-center border-b border-white/5 pb-4">
                 <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-zinc-500" />
                    <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">Project Repository</h3>
                 </div>
                 
                 <button 
                    onClick={handleCommitToRepo}
                    disabled={syncing || (!proposal && summary.length === 0)}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-xs font-bold uppercase
                        ${synced 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                        }
                    `}
                >
                    {syncing ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Syncing to Database...
                        </>
                    ) : synced ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Committed
                        </>
                    ) : (
                        <>
                            <Save className="h-3 w-3" />
                            Commit to Repository
                        </>
                    )}
                </button>
            </div>

            {/* Left: Analysis & Summary */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Executive Analysis</h3>
                    <button 
                        onClick={handleRunAnalysis}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 hover:bg-zinc-700 transition-colors text-xs font-bold uppercase"
                    >
                        {loading ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3"/>}
                        {summary.length > 0 ? "Re-run Analysis" : "Run Architecture Analysis"}
                    </button>
                </div>
                
                <div className="min-h-[300px] bg-[#0A0A0A] rounded-xl border border-white/10 p-6 font-mono text-xs leading-relaxed text-zinc-300 shadow-inner">
                    {summary.length > 0 ? (
                        <div className="space-y-4">
                            {summary.map((line, i) => (
                                <p key={i} className={line.startsWith("NEXT") ? "text-emerald-400 font-bold" : ""}>
                                    {line}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                            <Sparkles className="h-8 w-8 mb-2" />
                            <p>No analysis generated yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Proposal Draft */}
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">Strategic Proposal</h3>
                        {proposal && <span className="text-[10px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">DRAFT V1</span>}
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={handleGenerateProposal}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-xs font-bold uppercase"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin"/> : <FileText className="h-3 w-3"/>}
                            {proposal ? "Regenerate" : "Generate Draft"}
                        </button>
                    </div>
                </div>

                 <div className="relative min-h-[500px] bg-[#0A0A0A] rounded-xl border border-white/10 p-6 font-mono text-xs leading-relaxed text-zinc-400 shadow-inner overflow-y-auto max-h-[600px]">
                    {proposal ? (
                         <div className="whitespace-pre-wrap">{proposal}</div>
                    ) : (
                         <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                            <FileText className="h-8 w-8 mb-2" />
                            <p>No proposal draft available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
