import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { chatLog } = await req.json();

    if (!chatLog) {
      return NextResponse.json({ error: 'Chat log is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        // Fallback mock if no key
        return NextResponse.json({ 
            error: "System Configuration Error: OPENROUTER_API_KEY is missing." 
        }, { status: 500 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-001",
        "messages": [
          {
            "role": "system",
            "content": "You are a Senior Systems Architect. Analyze the following project notes/chat log. Output exactly 3 lines in this format:\n\nEXECUTIVE SUMMARY: (Max 2 sentences)\nTECHNICAL REQUIREMENTS: (Comma separated list)\nNEXT HIGH-ROI STEP: (One clear action)"
          },
          {
            "role": "user",
            "content": chatLog
          }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse into array
    const summary = content.split('\n').filter((line: string) => line.trim().length > 0);

    return NextResponse.json({ summary });

  } catch (error) {
     console.error("AI Summary Error:", error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
