import { getLeadsFromDb } from "@/lib/crm";
import { Lead } from "@/lib/googleSheets";
import { DollarSign, TrendingUp, Activity, Briefcase } from "lucide-react";
import { LeadIntakeModal } from "@/components/LeadIntakeModal";
import { IncomingLeadsList } from "@/components/IncomingLeadsList";

export const revalidate = 0;

export default async function AdminPage() {
  let leads: Lead[] = [];
  try {
      leads = await getLeadsFromDb();
  } catch (err) {
      console.error("Failed to load leads for admin", err);
  }

  // Calculate Metrics
  const totalPipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const activeRevenue = leads
    .filter(l => l.status === 'Working')
    .reduce((sum, lead) => sum + lead.value, 0);
  
  const conversionRate = leads.length > 0 
    ? Math.round((leads.filter(l => l.status === 'Done' || l.status === 'Working').length / leads.length) * 100) 
    : 0;

  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white glow-text">
                    Executive Overview
                </h1>
                <p className="text-zinc-500 dark:text-[#E5E5E5] opacity-60 text-sm">
                    High-Level Performance Metrics
                </p>
            </div>
            <LeadIntakeModal />
        </div>
        
        {/* Incoming Leads Section */}
        <IncomingLeadsList />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Pipeline */}
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <DollarSign className="h-12 w-12 text-blue-500" />
               </div>
               <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50">Total Pipeline</span>
                   <span className="text-3xl font-bold text-zinc-900 dark:text-white text-brilliance mt-1">
                       <span className="text-sm text-zinc-500 font-normal mr-1 align-top">OMR</span>
                       {totalPipelineValue.toLocaleString()}
                   </span>
               </div>
               <div className="h-1 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                   <div className="h-full bg-blue-500/50 w-full"></div>
               </div>
          </div>

          {/* Active Revenue */}
          <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
               <div className="absolute -inset-1 bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Activity className="h-12 w-12 text-emerald-500" />
               </div>
               <div className="flex flex-col gap-1 relative z-10">
                   <span className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50">Active Revenue</span>
                   <span className="text-3xl font-bold text-zinc-900 dark:text-white text-brilliance mt-1">
                       <span className="text-sm text-zinc-500 font-normal mr-1 align-top">OMR</span>
                       {activeRevenue.toLocaleString()}
                   </span>
               </div>
               <div className="h-1 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden mt-2 relative z-10">
                   <div className="h-full bg-emerald-500 w-[75%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               </div>
          </div>

           {/* Conversion Rate */}
           <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <TrendingUp className="h-12 w-12 text-amber-500" />
               </div>
               <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50">Close Rate</span>
                   <span className="text-3xl font-bold text-zinc-900 dark:text-white text-brilliance mt-1">
                       {conversionRate}%
                   </span>
               </div>
               <div className="h-1 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                   <div className="h-full bg-amber-500 w-[45%]"></div>
               </div>
          </div>
          
           {/* Active Deals */}
           <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Briefcase className="h-12 w-12 text-purple-500" />
               </div>
               <div className="flex flex-col gap-1">
                   <span className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50">Active Deals</span>
                   <span className="text-3xl font-bold text-zinc-900 dark:text-white text-brilliance mt-1">
                       {leads.length}
                   </span>
               </div>
               <div className="h-1 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                   <div className="h-full bg-purple-500 w-[60%]"></div>
               </div>
          </div>
      </div>
    </div>
  );
}
