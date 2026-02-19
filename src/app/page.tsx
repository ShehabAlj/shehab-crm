import { LeadCard } from "@/components/LeadCard";
import { AISummary } from "@/components/AISummary";
import { getLeadsFromDb } from "@/lib/crm";
import { JarvisCommand } from "@/components/JarvisCommand";

export const revalidate = 0; // Disable caching for real-time updates

export default async function Home({ searchParams }: { searchParams: Promise<{ leadId?: string }> }) {
  const leads = await getLeadsFromDb();
  
  const params = await searchParams;

  // Find selected lead for AI context
  const selectedLead = params?.leadId 
      ? leads.find(l => l.id === params.leadId) 
      : null;

  return (
    <div className="space-y-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white glow-text">
            Command Center
        </h1>
        <p className="text-zinc-500 dark:text-[#E5E5E5] opacity-60 text-sm">
            System Status: <span className="text-emerald-500 dark:text-emerald-400 font-mono font-bold tracking-wider">OPTIMAL</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
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
        <div className="space-y-8">
          <section className="flex flex-col h-full max-h-[600px]">
             <h2 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
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

          {/* Quick Metrics Placeholder */}
          <section className="rounded-xl glass-panel p-6">
              <h3 className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50 mb-4">Revenue Metrics</h3>
              <div className="space-y-4">
                  <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold text-zinc-900 dark:text-white text-brilliance">OMR 1,450</span>
                      <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold shadow-emerald-500/20 drop-shadow-sm">+12%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-[#E5E5E5] opacity-50">Target: OMR 2,000 / mo</p>
              </div>
          </section>
        </div>
      </div>
    </div>
  );
}
