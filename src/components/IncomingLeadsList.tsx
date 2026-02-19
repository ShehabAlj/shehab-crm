"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, Check, ExternalLink } from "lucide-react";
import { Lead } from "@/lib/googleSheets";
import { useRouter } from "next/navigation";

export function IncomingLeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchIncoming = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads?type=incoming");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (error) {
      console.error("Failed to fetch incoming leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (lead: Lead) => {
    setSyncingId(lead.id);
    try {
        const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientName: lead.clientName,
              projectType: lead.projectType,
              value: 0, // Incoming usually doesn't have value yet
              notes: lead.notes,
              heatLevel: "Warm",
              status: "New"
            }),
          });
    
          if (res.ok) {
            // Remove from list visually
            setLeads(prev => prev.filter(l => l.id !== lead.id));
            router.refresh();
          }
    } catch (error) {
        console.error("Sync failed", error);
    } finally {
        setSyncingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-70">
            Website Inquiries
         </h3>
         <button 
           onClick={fetchIncoming}
           disabled={loading}
           className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
         >
            <Download className={`h-3.5 w-3.5 ${loading ? 'animate-bounce' : ''}`} />
            {loading ? 'Checking...' : 'Check for Updates'}
         </button>
      </div>

      <div className="flex flex-col gap-3">
        {leads.length === 0 && !loading && (
             <div className="p-4 border border-dashed border-zinc-300 dark:border-white/10 rounded-xl text-center">
                 <p className="text-xs text-zinc-500">No new inquiries found.</p>
             </div>
        )}

        {leads.map((lead) => (
            <div key={lead.id} className="glass-panel p-4 rounded-xl flex items-center justify-between group">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        <h4 className="font-semibold text-zinc-900 dark:text-white text-sm">{lead.clientName}</h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-[200px]">{lead.notes}</p>
                </div>
                
                <button
                  onClick={() => handleSync(lead)}
                  disabled={syncingId === lead.id}
                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                  title="Accept to Pipeline"
                >
                    {syncingId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
            </div>
        ))}
      </div>
    </div>
  );
}
