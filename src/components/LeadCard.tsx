"use client";

import { Flame, Sparkles, MoreHorizontal, Scan, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lead } from "@/lib/googleSheets";

// Re-export HeatLevel to handle the type mismatch or use the one from lib
type HeatLevel = "Cold" | "Warm" | "Hot";

interface LeadCardProps extends Lead {
  onStatusChange?: (id: string, newStatus: string) => void;
  onNextStep?: (notes: string) => void;
  isSyncing?: boolean;
  // value is inherited
}

const heatLevelStyles = {
  Cold: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  Warm: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  Hot: "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

export function LeadCard({
  id,
  clientName,
  projectType,
  heatLevel,
  status,
  notes,
  onStatusChange,
  onNextStep,
  isSyncing,
}: LeadCardProps) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // State for inline editing
  const [projectTypeState, setProjectTypeState] = useState(projectType);
  const [heatLevelState, setHeatLevelState] = useState(heatLevel);

  const handleFieldUpdate = async (field: keyof Lead, value: string) => {
      // Optimistic Update
      if (field === 'projectType') setProjectTypeState(value);
      if (field === 'heatLevel') setHeatLevelState(value as Lead['heatLevel']);

      try {
        await fetch('/api/leads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, [field]: value }),
        });
      } catch (error) {
          console.error("Failed to update field", field, error);
          // Revert logic would go here ideally
      }
  };

  const router = useRouter();

  const handleFocus = () => {
     router.push(`/admin/projects/${id}`);
  };

  const handleNextStep = async () => {
    setLoadingAI(true);
    if (onNextStep) {
        await onNextStep(notes);
    }
    setLoadingAI(false);
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus as Lead['status']);
    setUpdatingStatus(true);
    
    // Call props callback if exists
    onStatusChange?.(id, newStatus);
    
    // Call API to update status
    try {
        await fetch('/api/leads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus }),
        });
        // Optionally refresh router here if we want to sync
    } catch (error) {
        console.error("Failed to update status", error);
    } finally {
        setUpdatingStatus(false);
    }
  };

  return (
    <div className={`group relative flex flex-col gap-4 rounded-xl glass-panel p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
        heatLevelState === 'Hot' ? 'shadow-[0_0_40px_rgba(0,122,255,0.1)]' : ''
    } ${isSyncing ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          {/* Project Type Dropdown (Inline) */}
           <div className="relative group/edit">
              <select 
                value={projectTypeState}
                onChange={(e) => handleFieldUpdate('projectType', e.target.value)}
                className="appearance-none bg-transparent text-[10px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-[#E5E5E5] opacity-70 dark:opacity-50 hover:opacity-100 hover:text-zinc-900 dark:hover:text-white cursor-pointer focus:outline-none transition-all"
              >
                 <option value="Mobile App" className="bg-white dark:bg-[#0F111A] text-zinc-900 dark:text-zinc-100">Mobile App</option>
                 <option value="Web Redesign" className="bg-white dark:bg-[#0F111A] text-zinc-900 dark:text-zinc-100">Web Redesign</option>
                 <option value="UI/UX Audit" className="bg-white dark:bg-[#0F111A] text-zinc-900 dark:text-zinc-100">UI/UX Audit</option>
                 <option value="AI Integration" className="bg-white dark:bg-[#0F111A] text-zinc-900 dark:text-zinc-100">AI Integration</option>
                 <option value="Full-Stack Dev" className="bg-white dark:bg-[#0F111A] text-zinc-900 dark:text-zinc-100">Full-Stack Dev</option>
                 <option value="SEO" className="bg-white dark:bg-[#0F111A] text-zinc-900 dark:text-zinc-100">SEO</option>
                 {/* Fallback for existing data not in list */}
                 {!['Mobile App', 'Web Redesign', 'UI/UX Audit', 'AI Integration', 'Full-Stack Dev', 'SEO'].includes(projectTypeState) && (
                     <option value={projectTypeState} className="bg-[#0F111A]">{projectTypeState}</option>
                 )}
              </select>
           </div>
          
          <Link href={`/admin/projects/${id}`} className="font-semibold text-xl tracking-tight text-[#E5E5E5] group-hover:text-white transition-colors hover:underline decoration-blue-500/50 underline-offset-4">
            {clientName}
          </Link>
          
          <button 
            onClick={handleFocus}
            title="Focus on this lead (AI)"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Scan className="h-4 w-4" />
          </button>
        </div>
        
        {/* Heat Level Dropdown (Inline) */}
        <div className="relative group/heat">
             <div
            className={`relative flex items-center justify-center h-2 w-2 rounded-full led-indicator transition-all ${heatLevelState === 'Hot' ? 'bg-red-500 text-red-500' : heatLevelState === 'Warm' ? 'bg-amber-500 text-amber-500' : 'bg-blue-500 text-blue-500'}`}
            >
            {heatLevelState === 'Hot' && (
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-50"></span>
            )}
            </div>
             <select 
                value={heatLevelState}
                onChange={(e) => handleFieldUpdate('heatLevel', e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Change Heat Level"
              >
                  <option value="Hot">Hot</option>
                  <option value="Warm">Warm</option>
                  <option value="Cold">Cold</option>
              </select>
        </div>
       
      </div>
      
      {/* Last Activity & Notes Preview */}
      <div className="flex flex-col gap-3">
         <p className="text-sm text-zinc-600 dark:text-[#E5E5E5] font-light leading-relaxed line-clamp-2 min-h-[2.5rem] opacity-80">
           {notes || "No recent notes..."}
         </p>
         <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-[#E5E5E5] font-mono uppercase tracking-wider opacity-50">
           <span>ACTIVITY: 2H AGO</span>
         </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 dark:border-white/5 pt-4">
        <div className="flex items-center gap-2">
           <span className={`h-1.5 w-1.5 rounded-full led-indicator ${(updatingStatus || isSyncing) ? 'animate-pulse bg-white' : currentStatus === 'New' ? 'bg-blue-500 text-blue-500' : currentStatus === 'In Talk' ? 'bg-amber-500 text-amber-500' : currentStatus === 'Working' ? 'bg-emerald-500 text-emerald-500' : 'bg-zinc-500 text-zinc-500'}`}></span>
           <select
            value={currentStatus}
            onChange={handleStatusChange}
            disabled={updatingStatus}
            className="bg-transparent text-xs font-medium text-zinc-700 dark:text-[#E5E5E5] focus:outline-none hover:text-black dark:hover:text-white cursor-pointer uppercase tracking-wider opacity-70 hover:opacity-100 disabled:opacity-50"
          >
            <option value="New" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">New</option>
            <option value="In Talk" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">In Talk</option>
            <option value="Working" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Working</option>
            <option value="Testing" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Testing</option>
            <option value="Done" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Done</option>
          </select>
        </div>

        <button 
          onClick={handleNextStep}
          disabled={loadingAI}
          title="Run Analysis"
          className="group/btn flex items-center justify-center rounded-lg p-2 text-zinc-400 dark:text-[#E5E5E5] opacity-50 transition-all hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
        >
           <Sparkles className={`h-4 w-4 ${loadingAI ? 'animate-spin text-blue-400' : 'group-hover/btn:text-blue-500 dark:group-hover/btn:text-blue-400'}`} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
