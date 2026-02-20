import { LeadCard } from "@/components/LeadCard";
import { AISummary } from "@/components/AISummary";
import { getLeadsFromDb, getRevenueMetrics } from "@/lib/crm";
import { JarvisCommand } from "@/components/JarvisCommand";
import { RevenueMetrics } from "@/components/RevenueMetrics";

export const revalidate = 0; // Disable caching for real-time updates

export default async function Home({ searchParams }: { searchParams: Promise<{ leadId?: string }> }) {
  const leads = await getLeadsFromDb();
  const { total: revenue, growth } = await getRevenueMetrics();
  
  const params = await searchParams;

  // Find selected lead for AI context
  const selectedLead = params?.leadId 
      ? leads.find(l => l.id === params.leadId) 
      : null;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white glow-text">
            Command Center
        </h1>
        <p className="text-zinc-500 dark:text-[#E5E5E5] opacity-60 text-sm">
            System Status: <span className="text-emerald-500 dark:text-emerald-400 font-mono font-bold tracking-wider">OPTIMAL</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 flex-1 min-h-0">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
          <section>
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                   Prioritized Leads
               </h2>
               <div className="flex gap-2">
                   {/* Filter buttons could go here */}
               </div>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2">
              {leads.map((lead, index) => (
                <LeadCard key={index} {...lead} />
              ))}
            </div>
          </section>
        </div>

        {/* Side Panel / Utilities */}
        <div className="space-y-6 flex flex-col h-full">
           {/* Quick Metrics */}
           <RevenueMetrics initialRevenue={revenue} initialGrowth={growth} />
          
          <section className="flex flex-col flex-1 min-h-[400px] relative">
             <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
                AI Intelligence_
                {selectedLead && (
                    <span className="ml-2 text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                        @{selectedLead.clientName}
                    </span>
                )}
             </h2>
             <AISummary 
                key={selectedLead?.id || 'default'} // Reset state on lead change
                leadNotes={selectedLead?.notes}
                leadValue={selectedLead?.value}
                projectType={selectedLead?.projectType}
                clientName={selectedLead?.clientName}
             />
          </section>
        </div>
      </div>
    </div>
  );
}
