"use client";

import { useState, useRef, useEffect } from "react";
import { Terminal, Send, X, Minimize2, Maximize2, Loader2, Sparkles } from "lucide-react";

interface Message {
    role: 'user' | 'jarvis';
    text: string;
}

export function JarvisCommand() {
    const [isOpen, setIsOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: 'jarvis', text: 'Jarvis Online. Command Center Active.' }
    ]);
    const [processing, setProcessing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const cmd = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: cmd }]);
        setProcessing(true);

        try {
            const response = await fetch('/api/jarvis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            });
            const data = await response.json();
            
            setMessages(prev => [...prev, { role: 'jarvis', text: data.reply || "Systems unstable. No response." }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'jarvis', text: "Error connecting to mainframe." }]);
        } finally {
            setProcessing(false);
        }
    };

    // Sidebar Button Trigger
    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="group flex items-center justify-center rounded-xl p-3 text-zinc-400 hover:text-blue-400 transition-all duration-300 hover:bg-blue-500/10 relative"
                title="Jarvis Command"
            >
                <Terminal className="h-5 w-5" strokeWidth={1.5} />
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
            </button>
        );
    }

    return (
        <>
            {/* Button active state */}
            <button 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center rounded-xl p-3 bg-blue-500/10 text-blue-400 relative"
                title="Close Jarvis"
            >
                <Terminal className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {/* Chat Window (Popped out to the right of sidebar) */}
            <div className={`fixed bottom-4 left-24 bg-[#050505]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 transition-all duration-300 flex flex-col overflow-hidden font-mono ${minimized ? 'w-72 h-14' : 'w-[400px] h-[600px]'}`}>
                {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Jarvis Command</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setMinimized(!minimized)} className="text-zinc-500 hover:text-white transition-colors">
                        {minimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            {!minimized && (
                <>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' 
                                    : 'bg-zinc-900 border border-white/10 text-zinc-300 whitespace-pre-wrap'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {processing && (
                             <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Processing command...</span>
                             </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-black/20 border-t border-white/5">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Execute command..."
                                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-4 pr-10 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <button 
                                onClick={handleSend}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
        </>
    );
}
