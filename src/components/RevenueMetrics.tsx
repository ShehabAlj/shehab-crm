"use client";

import { useState } from "react";
import { Edit2, Check, X } from "lucide-react";

export function RevenueMetrics({ initialRevenue, initialGrowth }: { initialRevenue: number, initialGrowth: number }) {
    const [target, setTarget] = useState(2000);
    const [isEditing, setIsEditing] = useState(false);
    const [tempTarget, setTempTarget] = useState(target.toString());

    const progress = Math.min((initialRevenue / target) * 100, 100);

    const handleSave = () => {
        const val = parseInt(tempTarget.replace(/,/g, ''));
        if (!isNaN(val) && val > 0) {
            setTarget(val);
        }
        setIsEditing(false);
    };

    return (
        <section className="rounded-xl glass-panel p-6 shrink-0 relative group">
            <h3 className="text-[10px] font-bold text-zinc-500 dark:text-[#E5E5E5] uppercase tracking-widest opacity-50 mb-4 flex justify-between items-center">
                Revenue Metrics
                <button 
                    onClick={() => {
                        setTempTarget(target.toString());
                        setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-500"
                >
                    <Edit2 className="h-3 w-3" />
                </button>
            </h3>
            
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-white text-brilliance bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                      OMR {initialRevenue.toLocaleString()}
                    </span>
                    <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold shadow-emerald-500/20 drop-shadow-sm">+{initialGrowth}%</span>
                </div>
                
                <div className="h-2 w-full bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[65%] rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000 ease-out relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[2px]"></div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-[#E5E5E5] opacity-50 font-mono">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <span>Target: OMR</span>
                            <input 
                                type="text" 
                                value={tempTarget}
                                onChange={(e) => setTempTarget(e.target.value)}
                                className="w-16 bg-transparent border-b border-blue-500 focus:outline-none text-blue-500 font-bold"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            />
                            <button onClick={handleSave} className="text-emerald-500 hover:scale-110 transition-transform"><Check className="h-3 w-3" /></button>
                            <button onClick={() => setIsEditing(false)} className="text-red-500 hover:scale-110 transition-transform"><X className="h-3 w-3" /></button>
                        </div>
                    ) : (
                        <span>Target: OMR {target.toLocaleString()} / mo</span>
                    )}
                    <span>{progress.toFixed(0)}%</span>
                </div>
            </div>
        </section>
    );
}
