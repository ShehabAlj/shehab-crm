"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Lead } from "@/lib/googleSheets";
import { ProjectDetails } from "@/lib/crm";

export function DeliverablesView({ lead, details }: { lead: Lead, details: ProjectDetails | null }) {
    // Mock milestones for now
    const milestones = details?.milestones || [
        { id: '1', title: 'Project Kickoff & Requirements', status: 'Done' },
        { id: '2', title: 'Wireframe & Design Approval', status: 'In Progress' },
        { id: '3', title: 'Database Schema & API Setup', status: 'Pending' },
        { id: '4', title: 'Frontend Implementation', status: 'Pending' },
        { id: '5', title: 'QA & Testing', status: 'Pending' },
        { id: '6', title: 'Deployment & Handover', status: 'Pending' },
    ];

    return (
        <div className="py-6 fade-in max-w-3xl">
            <h3 className="text-lg font-semibold text-white mb-6">Milestone Checklist</h3>
            
            <div className="space-y-3">
                {milestones.map((m: any) => (
                    <div key={m.id} className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                        {m.status === 'Done' ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        ) : m.status === 'In Progress' ? (
                            <Circle className="h-6 w-6 text-blue-500 animate-pulse" />
                        ) : (
                             <Circle className="h-6 w-6 text-zinc-600" />
                        )}
                        
                        <div className="flex flex-col">
                            <span className={`text-sm font-medium ${m.status === 'Done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                                {m.title}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                {m.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
