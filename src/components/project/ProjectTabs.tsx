"use client";

import { useState } from "react";
import { Brain, MessageSquare, ListTodo, Archive } from "lucide-react";
import { IntelligenceView } from "./IntelligenceView";
import { CommunicationView } from "./CommunicationView";
import { DeliverablesView } from "./DeliverablesView";
import { ProjectDetails, ProjectAnalysis } from "@/types/crm";
import { Lead } from "@/lib/googleSheets";

type Tab = 'intelligence' | 'communication' | 'deliverables' | 'archive';

export function ProjectTabs({ lead, details, analysis }: { lead: Lead, details: ProjectDetails | null, analysis: ProjectAnalysis | null }) {
    const [activeTab, setActiveTab] = useState<Tab>('intelligence');

    return (
        <div className="flex flex-col gap-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-white/5">
                <TabButton 
                    active={activeTab === 'intelligence'} 
                    onClick={() => setActiveTab('intelligence')}
                    icon={<Brain className="h-4 w-4" />}
                    label="Intelligence"
                />
                <TabButton 
                    active={activeTab === 'communication'} 
                    onClick={() => setActiveTab('communication')}
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="Communication"
                />
                <TabButton 
                    active={activeTab === 'deliverables'} 
                    onClick={() => setActiveTab('deliverables')}
                    icon={<ListTodo className="h-4 w-4" />}
                    label="Deliverables"
                />
                 <TabButton 
                    active={activeTab === 'archive'} 
                    onClick={() => setActiveTab('archive')}
                    icon={<Archive className="h-4 w-4" />}
                    label="Archive"
                />
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'intelligence' && <IntelligenceView lead={lead} details={details} initialAnalysis={analysis} />}
                {activeTab === 'communication' && <CommunicationView lead={lead} details={details} />}
                {activeTab === 'deliverables' && <DeliverablesView lead={lead} details={details} />}
                {activeTab === 'archive' && (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                        <Archive className="h-12 w-12 mb-4 opacity-20" />
                        <p>Project Archive is clean.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-300
                ${active 
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
}
