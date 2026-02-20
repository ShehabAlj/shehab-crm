"use client";

import { useState } from "react";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function LeadIntakeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    clientName: "",
    projectType: "",
    value: "",
    notes: "",
    heatLevel: "Warm",
    status: "New"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseInt(formData.value) || 0,
        }),
      });

      if (res.ok) {
        setFormData({ clientName: "", projectType: "", value: "", notes: "", heatLevel: "Warm", status: "New" });
        setIsOpen(false);
        router.refresh();
      } else {
          console.error("Failed to create lead");
      }
    } catch (error) {
      console.error("Error submitting form", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/20"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-semibold tracking-wide">New Lead</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-[#0F111A] border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden transition-colors">
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            New Lead Intake
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Client Name</label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Project Type</label>
                <div className="relative">
                    <select
                        required
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white appearance-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    >
                        <option value="" className="bg-white dark:bg-[#0F111A] text-zinc-500">Select Type...</option>
                        <option value="Mobile App" className="bg-white dark:bg-[#0F111A]">Mobile App</option>
                        <option value="Web Redesign" className="bg-white dark:bg-[#0F111A]">Web Redesign</option>
                        <option value="UI/UX Audit" className="bg-white dark:bg-[#0F111A]">UI/UX Audit</option>
                        <option value="AI Integration" className="bg-white dark:bg-[#0F111A]">AI Integration</option>
                        <option value="Full-Stack Dev" className="bg-white dark:bg-[#0F111A]">Full-Stack Dev</option>
                    </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Est. Value</label>
                <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">OMR</span>
                    <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                    placeholder="0"
                    />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Heat Level */}
            <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Heat Level</label>
                <select
                    value={formData.heatLevel}
                    onChange={(e) => setFormData({...formData, heatLevel: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500/50 appearance-none transition-all"
                >
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                </select>
             </div>
              {/* Status */}
             <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Status</label>
                 <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500/50 appearance-none transition-all"
                >
                    <option value="New">New</option>
                    <option value="In Talk">In Talk</option>
                    <option value="Working">Working</option>
                    <option value="Testing">Testing</option>
                    <option value="Done">Done</option>
                </select>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Notes / Contact</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-24 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-lg px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all resize-none"
              placeholder="Enter project details..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Pipeline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
