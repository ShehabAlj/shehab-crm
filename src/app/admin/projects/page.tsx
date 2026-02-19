import { KanbanBoard } from "@/components/KanbanBoard";
import { getLeadsFromDb } from "@/lib/crm";

export const revalidate = 0; // Ensure fresh data on load

export default async function ProjectsPage() {
  const leads = await getLeadsFromDb();

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white glow-text">
                Project Board
            </h1>
            <p className="text-zinc-500 dark:text-[#E5E5E5] opacity-60 text-sm">
                Workflow Management
            </p>
        </div>
        <div className="flex gap-2">
            {/* Future filters */}
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto pb-4">
        <KanbanBoard initialLeads={leads} />
      </div>
    </div>
  );
}
