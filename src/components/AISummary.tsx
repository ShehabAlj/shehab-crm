"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, Loader2, FileText, Bot } from "lucide-react";

export function AISummary({ leadNotes, leadValue, projectType, clientName }: { leadNotes?: string, leadValue?: number, projectType?: string, clientName?: string }) {
  const [chatLog, setChatLog] = useState(leadNotes || "");
  const [summary, setSummary] = useState<string[]>([]);
  const [proposal, setProposal] = useState<string>("");
  const [mode, setMode] = useState<'summary' | 'proposal'>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!chatLog.trim()) return;

    setLoading(true);
    setMode('summary');
    setSummary([]); 
    setProposal("");
    setError(null);
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatLog }),
      });

      if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'Failed to fetch summary');
      }

      const data = await response.json();
      if (Array.isArray(data.summary)) {
          setSummary(data.summary);
      } else if (typeof data.summary === 'string') {
           setSummary([data.summary]);
      }
    } catch (err: any) {
      console.error("Failed to summarize", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDraftProposal = async () => {
      setLoading(true);
      setMode('proposal');
      setSummary([]);
      setProposal("");
      setError(null);

      try {
          const response = await fetch('/api/proposal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  clientName: clientName || "Client",
                  projectType: projectType || "Project",
                  value: leadValue || 0,
                  notes: chatLog 
              }),
          });

          if (!response.ok) {
             const errData = await response.json();
             throw new Error(errData.error || 'Failed to generate proposal');
          }
          
          const data = await response.json();
          if (data.proposal) {
             setProposal(data.proposal);
          } else {
             throw new Error("No proposal generated.");
          }

      } catch (err: any) {
          console.error("Failed to generate proposal", err);
          setError(err.message || "An unexpected error occurred.");
      } finally {
          setLoading(false);
      }
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div 
        ref={containerRef}
        className={`flex flex-col gap-0 rounded-xl glass-panel overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isExpanded ? 'max-h-[800px] h-full absolute inset-x-0 bottom-0 z-50 shadow-2xl lg:static lg:h-auto' : 'max-h-[60px] h-auto'} `}
        onClick={() => !isExpanded && setIsExpanded(true)}
    >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 cursor-pointer">
            <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-[#E5E5E5] opacity-70">
                <Bot className="h-3 w-3" />
                AI_INTELLIGENCE_MODULE
            </h3>
            <div className="flex gap-2 items-center">
                <div className={`h-2 w-2 rounded-full ${loading ? 'animate-pulse bg-blue-500' : 'bg-zinc-300 dark:bg-white/20'}`}></div>
                {isExpanded && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                        className="text-zinc-400 hover:text-white"
                    >
                        <span className="text-xs">▼</span>
                    </button>
                )}
            </div>
        </div>
      
      {/* Content Content (Only visible when expanded) */}
      <div className={`flex flex-col flex-1 relative transition-opacity duration-500 delay-200 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Input Area */}
        <textarea
          value={chatLog}
          onChange={(e) => setChatLog(e.target.value)}
          placeholder="// Paste notes or chat log here for analysis..."
          className="flex-1 w-full resize-none border-none bg-transparent p-4 text-xs font-mono text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:ring-0 leading-relaxed"
          spellCheck={false}
        />
        
        {/* Actions Toolbar */}
        <div className="p-2 flex justify-end gap-2 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/5">
            <button
                onClick={handleDraftProposal}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 disabled:opacity-50 transition-all border border-zinc-200 dark:border-white/5"
            >
                {loading && mode === 'proposal' ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                Draft Proposal
            </button>
            <button
                onClick={handleSummarize}
                disabled={loading || !chatLog.trim()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 disabled:opacity-50 transition-all border border-blue-500/20"
            >
                {loading && mode === 'summary' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Analyze
            </button>
        </div>
      

      {/* Output Area or Error */}
      {(summary.length > 0 || proposal || error) && (
          <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-[#050505] min-h-[200px] overflow-y-auto max-h-[300px]">
           
           {error ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-mono">
                    <span className="font-bold">ERROR:</span> {error}
                </div>
           ) : loading ? (
             <div className="flex items-center gap-2 text-xs font-mono text-blue-500 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing data stream...
             </div>
           ) : mode === 'summary' && summary.length > 0 ? (
               <ul className="space-y-4">
                  {summary.map((point, index) => {
                      const [title, content] = point.includes(':') ? point.split(':') : ['', point];
                      return (
                        <li key={index} className="flex flex-col gap-1 text-xs font-mono">
                            {title && <span className="text-blue-500 font-bold uppercase tracking-wider">{title}:</span>}
                            <span className="text-zinc-600 dark:text-zinc-400 pl-4 border-l border-zinc-300 dark:border-zinc-800">{content || point}</span>
                        </li>
                      );
                  })}
              </ul>
           ) : (
               <div className="whitespace-pre-wrap font-mono text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                   {proposal}
               </div>
           )}
          </div>
      )}
      </div>
    </div>
  );
}
