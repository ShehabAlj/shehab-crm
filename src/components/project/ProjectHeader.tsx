import { ArrowLeft, Clock, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { Lead } from "@/lib/googleSheets";

export function ProjectHeader({ lead }: { lead: Lead }) {
    if (!lead) return null;

    return (
        <div className="flex flex-col gap-6 border-b border-white/5 pb-8">
            {/* Breadcrumb / Back */}
            <Link 
                href="/admin/projects" 
                className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors w-fit"
            >
                <ArrowLeft className="h-3 w-3" />
                BACK TO COMMAND CENTER
            </Link>

            <div className="flex items-end justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold tracking-tight text-white glow-text">
                            {lead.clientName}
                        </h1>
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                            {lead.projectType}
                        </span>
                    </div>
                    <p className="text-zinc-400 font-light flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        System Status: <span className="text-emerald-400 font-mono">ACTIVE MONITORING</span>
                    </p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-8">
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Project Value</span>
                        <div className="flex items-center gap-1 text-2xl font-bold text-white font-mono">
                            <span className="text-zinc-600 text-sm">$</span>
                            {lead.value.toLocaleString()} 
                            <span className="text-zinc-600 text-sm">OMR</span>
                        </div>
                     </div>
                     <div className="h-10 w-[1px] bg-white/10"></div>
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pipeline Stage</span>
                        <div className="flex items-center gap-2">
                           <div className={`h-2 w-2 rounded-full ${lead.status === 'Done' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-blue-500 shadow-[0_0_10px_#3b82f6]'}`}></div>
                           <span className="text-lg font-bold text-zinc-200">{lead.status}</span>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
}
