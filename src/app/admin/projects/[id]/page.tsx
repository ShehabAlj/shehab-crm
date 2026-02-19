import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectTabs } from "@/components/project/ProjectTabs";
import { getLeadsFromDb, getProjectDetails, getProjectAnalysis, mapDbLeadToApp } from "@/lib/crm";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const revalidate = 0; // Fresh data

export default async function ProjectFolderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Lead Data (Base)
    const { data: leadData } = await supabaseAdmin.from('leads').select('*').eq('id', id).single();
    
    if (!leadData) {
        return <div className="p-10 text-white">Project not found.</div>;
    }

    const lead = mapDbLeadToApp(leadData);

    // Fetch Extended Details
    const details = await getProjectDetails(id);
    const analysis = await getProjectAnalysis(id);

    return (
        <div className="min-h-screen bg-[#050505] p-10 flex flex-col gap-8">
            <ProjectHeader lead={lead} />
            <ProjectTabs lead={lead} details={details} analysis={analysis} />
        </div>
    );
}
