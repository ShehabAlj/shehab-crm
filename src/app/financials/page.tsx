import { getLeads, Lead } from "@/lib/googleSheets";
import { DollarSign, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";

export const revalidate = 0;

// Helper to mock monthly data since we don't have real dates yet
function getMonthlyRevenue(leads: Lead[]) {
  // Mock distribution for demo purposes
  // In real app, we'd parse leads.date or similar
  const total = leads.reduce((sum, l) => sum + l.value, 0);
  return [
    { month: 'Jan', value: total * 0.1 },
    { month: 'Feb', value: total * 0.15 },
    { month: 'Mar', value: total * 0.12 },
    { month: 'Apr', value: total * 0.2 },
    { month: 'May', value: total * 0.25 },
    { month: 'Jun', value: total * 0.18 }, // Current
  ];
}

export default async function FinancialsPage() {
  const leads = await getLeads();
  const closedDeals = leads.filter(l => l.status === 'Done');
  const totalRevenue = closedDeals.reduce((sum, l) => sum + l.value, 0);
  const pipelineValue = leads.filter(l => l.status !== 'Done').reduce((sum, l) => sum + l.value, 0);
  const monthlyData = getMonthlyRevenue(closedDeals);
  const maxMonth = Math.max(...monthlyData.map(d => d.value));

  return (
    <div className="space-y-8 p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white glow-text">
            Financial Performance
        </h1>
        <p className="text-zinc-500 dark:text-[#E5E5E5] opacity-60 text-sm">
            Revenue Analysis & Transaction History
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KPI Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50">Total Revenue (YTD)</p>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mt-2 text-brilliance">
                            <span className="text-sm font-normal text-zinc-500 mr-1">OMR</span>
                            {totalRevenue.toLocaleString()}
                        </h2>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <DollarSign className="h-6 w-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12.5% vs last month</span>
                </div>
            </div>

            <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50">Projected Pipeline</p>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mt-2 text-brilliance">
                             <span className="text-sm font-normal text-zinc-500 mr-1">OMR</span>
                            {pipelineValue.toLocaleString()}
                        </h2>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                        <Calendar className="h-6 w-6" />
                    </div>
                </div>
                 <div className="mt-4 flex items-center gap-2 text-xs text-blue-400">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>{leads.filter(l => l.status !== 'Done').length} Active Deals</span>
                </div>
            </div>

             <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                {/* Placeholder for future metric */}
                <div className="flex justify-between items-start">
                     <div>
                        <p className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50">Avg. Deal Size</p>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mt-2 text-brilliance">
                             <span className="text-sm font-normal text-zinc-500 mr-1">OMR</span>
                            {closedDeals.length > 0 ? Math.round(totalRevenue / closedDeals.length).toLocaleString() : 0}
                        </h2>
                    </div>
                     <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>
            </div>
        </div>

        {/* Chart Section */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col gap-6">
            <h3 className="text-sm font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-70">Revenue Trend</h3>
            <div className="flex items-end justify-between h-64 gap-4 px-4 pb-2 border-b border-zinc-200 dark:border-white/5">
                {monthlyData.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                         <div className="w-full relative flex items-end justify-center h-full">
                            <div 
                                className="w-full max-w-[40px] bg-blue-500/20 group-hover:bg-blue-500/40 border-t border-blue-500/50 rounded-t-sm transition-all duration-500 relative"
                                style={{ height: `${(d.value / maxMonth) * 100}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none z-10">
                                    OMR {d.value.toLocaleString()}
                                </div>
                            </div>
                         </div>
                         <span className="text-[10px] font-mono text-zinc-500 uppercase">{d.month}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Transaction History */}
        <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 overflow-hidden">
             <h3 className="text-sm font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-70">Recent Transactions</h3>
             <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {closedDeals.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-8">No closed deals yet.</p>
                ) : (
                    closedDeals.slice(0, 5).map(lead => (
                        <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/5 group">
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{lead.clientName}</span>
                                <span className="text-xs text-zinc-500">{lead.projectType}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-sm font-mono text-emerald-400">+ OMR {lead.value.toLocaleString()}</span>
                                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Closed</span>
                            </div>
                        </div>
                    ))
                )}
             </div>
             {closedDeals.length > 5 && (
                 <button className="text-xs text-zinc-500 hover:text-white text-center mt-2 transition-colors">View All Transactions</button>
             )}
        </div>
      </div>
    </div>
  );
}
