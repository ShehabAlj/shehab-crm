import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { clientName, projectType, value, notes } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        return NextResponse.json({ 
            proposal: "ERROR: OPENROUTER_API_KEY not found. Please configure it in .env.local to generate proposals." 
        });
    }

    const prompt = `
      ACT AS: Senior Technical Architect & Strategy Consultant.
      CONTEXT: You are drafting a high-stakes executive proposal for ${clientName}.
      PROJECT: ${projectType}
      VALUE: ${value} OMR
      NOTES: ${notes}

      OBJECTIVE: Write a persuasive, executive-level proposal. Avoid generic academic or "supportive" language. Be authoritative, innovative, and commercial.

      CORE PILLARS:
      1. INFRASTRUCTURE & PERFORMANCE:
         - Do not say "Native App". Use: "High-Performance Cross-Platform Architecture with 99.9% Uptime".
         - Emphasize "Zero-Latency Backend" designed for peak load scalability (e.g., weekend rushes).
      2. ROI & OPTIMIZATION:
         - Explicitly mention: "Loyalty Integration estimated to increase repeat customer frequency by 15-20%".
         - Frame the project as a "Revenue Engine", not just software.
      3. SCALABILITY:
         - Focus on "Modular Microservices" ready for regional expansion.

      REQUIRED STRUCTURE:
      ### EXECUTIVE SUMMARY
      (Focus on the "Why". Business impact first.)

      ### STRATEGIC TECHNICAL ARCHITECTURE
      (Focus on the "How". Technical pillars: Infrastructure, Performance, Security.)

      ### INVESTMENT & SCALABILITY PHASE
      (Focus on Value. Reference the ${value} OMR investment as a "Growth Engine".)

      ### IMMEDIATE ACTION PLAN
      (The "What Next". Clear next steps.)

      FORMAT: Plain text, bullet points, concise (under 400 words).
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Shehab CRM"
      },
      body: JSON.stringify({
        "model": "google/gemini-2.0-flash-001",
        "messages": [
          {
            "role": "system",
            "content": "You are an elite Digital Strategist. Output clean, monospaced text suitable for a terminal window. Use aggressive, high-performance business language."
          },
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API Error:", response.status, errorText);
        return NextResponse.json({ 
            proposal: `Error: OpenRouter API returned ${response.status}. Check console for details.` 
        });
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
        console.error("OpenRouter Empty Choices:", JSON.stringify(data));
        return NextResponse.json({ 
            proposal: "Error: AI returned no content. The model might be overloaded or the prompt filtered." 
        });
    }

    const proposal = data.choices[0].message?.content || "Failed to generate proposal content.";

    return NextResponse.json({ proposal });

  } catch (error) {
     console.error("Proposal Generation Error:", error);
    return NextResponse.json({ error: 'Failed to generate proposal' }, { status: 500 });
  }
}
