import { NextResponse } from 'next/server';
import { saveProjectAnalysis } from '@/lib/crm';

export async function POST(req: Request) {
  try {
    const { projectId, proposalContent, technicalSummary } = await req.json();

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    await saveProjectAnalysis(projectId, {
        project_id: projectId,
        proposal_content: proposalContent,
        technical_summary: technicalSummary
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Archive Error:", error);
    return NextResponse.json({ error: 'Failed to archive' }, { status: 500 });
  }
}
