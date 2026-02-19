import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

    if (!notes) {
      return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
    }

    // Mock response for now
    // In production: Use OpenRouter/OpenAI to analyze notes
    
    // Simulating delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const advice = `Based on the notes "${notes.substring(0, 30)}...", here is the recommended next step:
    
1. **Immediate Action**: Send a follow-up email re-iterating the value proposition mentioned in the notes.
2. **Strategy**: Focus on the specific pain point identified.
3. **Closing**: Propose a quick 10-min call to finalize details.`;

    return NextResponse.json({ advice });
  } catch (error) {
    console.error("AI Next Step Error:", error);
    return NextResponse.json({ error: 'Failed to generate advice' }, { status: 500 });
  }
}
