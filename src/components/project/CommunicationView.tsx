"use client";

import { useState } from "react";
import { Save, MessageSquare } from "lucide-react";
import { Lead } from "@/lib/googleSheets";
import { ProjectDetails } from "@/types/crm";

export function CommunicationView({ lead, details }: { lead: Lead, details: ProjectDetails | null }) {
    const [logs, setLogs] = useState(details?.chat_logs || lead.notes || "");
    const [saving, setSaving] = useState(false);

    // Placeholder for actual save logic
    const handleSave = async () => {
        setSaving(true);
        // Simulate save delay
        await new Promise(r => setTimeout(r, 1000));
        setSaving(false);
    };

    return (
        <div className="py-6 fade-in space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-white">Project Communication Log</h3>
                    <p className="text-sm text-zinc-500">Paste raw WhatsApp/Email logs here for AI context.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-bold uppercase"
                >
                    {saving ? "Syncing..." : "Save Logs"}
                    <Save className="h-3 w-3" />
                </button>
            </div>

            <textarea 
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                placeholder="Paste chat logs here..."
                className="w-full h-[500px] bg-[#050505] border border-white/10 rounded-xl p-6 font-mono text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 resize-y"
            />
        </div>
    );
}
