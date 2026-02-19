"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/'); // Redirect to dashboard
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="text-center">
             <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                  <Lock className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Shehab Workspace</h1>
              <p className="text-sm text-zinc-400">Secure Executive Access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="space-y-4">
              <div className="group">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1 block group-focus-within:text-blue-400 transition-colors">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all font-mono text-sm"
                    placeholder="executive@shehab-crm.com"
                  />
              </div>
              <div className="group">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1 block group-focus-within:text-blue-400 transition-colors">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 transition-all font-mono text-sm"
                    placeholder="••••••••••••"
                  />
              </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : (
                <>
                    Enter Workspace
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
            )}
          </button>
        </form>
        
        <div className="text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
}
