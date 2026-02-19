"use client";

import { 
  User, 
  Bell, 
  Shield, 
  Database, 
  Monitor, 
  LogOut,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun
} from "lucide-react";
import { Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

// ... imports
import { createClient } from "@/utils/supabase/client";
// ...

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('General');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
      email: true,
      push: true,
      updates: false,
      marketing: false
  });
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [webhookStatus, setWebhookStatus] = useState<'checking' | 'connected' | 'error'>('error'); // Mock for now

  const supabase = createClient();

  // Prevent hydration mismatch & Fetch User
  useEffect(() => {
    setMounted(true);
    checkIntegrations();
    
    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserEmail(user.email || "Admin");
    };
    getUser();
  }, [supabase]);

  const checkIntegrations = async () => {
      try {
          // Check Google Sheets via Leads API
          const res = await fetch('/api/leads?limit=1');
          if (res.ok) setDbStatus('connected');
          else setDbStatus('error');
      } catch (e) {
          setDbStatus('error');
      }
  };

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
  };

  const toggleNotification = (key: keyof typeof notifications) => {
      setNotifications(prev => ({
          ...prev,
          [key]: !prev[key]
      }));
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 p-8 max-w-[1200px] mx-auto min-h-screen">
       <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white glow-text">
            Settings
        </h1>
        <p className="text-zinc-500 dark:text-[#E5E5E5] opacity-60 text-sm">
            Manage your account and system preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Navigation / Profile Summary */}
        <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-xl flex flex-col items-center text-center gap-4">
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-[2px]">
                    <div className="h-full w-full rounded-full bg-white dark:bg-black flex items-center justify-center">
                         <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                            {userEmail ? userEmail[0].toUpperCase() : 'LA'}
                         </span>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Lead Architect</h2>
                    <p className="text-sm text-zinc-500">{userEmail || "Loading..."}</p>
                </div>
                <div className="w-full pt-4 border-t border-zinc-200 dark:border-white/5">
                     <button 
                        onClick={handleSignOut}
                        className="w-full py-2 px-4 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex items-center justify-center gap-2"
                     >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                     </button>
                </div>
            </div>

            <nav className="glass-panel p-2 rounded-xl flex flex-col gap-1">
                 {['General', 'Notifications', 'Security', 'Billing'].map((item) => (
                     <button 
                        key={item} 
                        onClick={() => setActiveTab(item)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item ? 'bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                     >
                         {item}
                     </button>
                 ))}
            </nav>
        </div>

        {/* Right Column: Settings Content */}
        <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'General' && (
                <>
                {/* System Status */}
                <div className="glass-panel p-6 rounded-xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
                        <Database className="h-5 w-5 text-blue-500" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">System Integrations</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded flex items-center justify-center transition-colors ${dbStatus === 'connected' ? 'bg-[#0F9D58]/20 text-[#0F9D58]' : 'bg-red-500/20 text-red-500'}`}>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Google Sheets Database</h4>
                                    <p className="text-xs text-zinc-500">Primary data source for CRM</p>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${dbStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                {dbStatus === 'checking' ? (
                                    <span className="animate-pulse">Checking...</span>
                                ) : dbStatus === 'connected' ? (
                                    <>
                                        <CheckCircle2 className="h-3 w-3" />
                                        Connected
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-3 w-3" />
                                        Error
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 opacity-50">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Monitor className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Website Form Hook</h4>
                                    <p className="text-xs text-zinc-500">Incoming leads webhook</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-500 text-xs font-medium border border-zinc-500/20">
                                <AlertCircle className="h-3 w-3" />
                                Not Configured
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
                  <Database className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Database Management</h3>
              </div>
              
              <div className="glass-panel p-6 rounded-xl space-y-4">
                   <div className="flex items-center justify-between">
                       <div>
                           <h4 className="font-semibold text-zinc-900 dark:text-white">Sync with Google Sheets</h4>
                           <p className="text-xs text-zinc-500 dark:text-zinc-400">Import leads from Legacy Master Sheet to Supabase</p>
                       </div>
                       <SyncButton />
                   </div>
              </div>
            </div>

            {/* Appearance */}
                <div className="glass-panel p-6 rounded-xl space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
                        <Monitor className="h-5 w-5 text-purple-500" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Appearance</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <button 
                            onClick={() => setTheme('dark')}
                            className={`p-4 rounded-lg border-2 text-left space-y-2 transition-all ${theme === 'dark' ? 'bg-zinc-100 dark:bg-white/5 border-blue-500' : 'bg-transparent border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'}`}
                        >
                            <div className="h-20 bg-black rounded border border-white/10 flex items-center justify-center">
                                <Moon className="h-6 w-6 text-zinc-400" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="block text-sm font-medium text-zinc-900 dark:text-white">Ambient Dark</span>
                                {theme === 'dark' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                            </div>
                        </button>
                        <button 
                            onClick={() => setTheme('light')}
                            className={`p-4 rounded-lg border-2 text-left space-y-2 transition-all ${theme === 'light' ? 'bg-zinc-100 dark:bg-white/5 border-blue-500' : 'bg-transparent border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'}`}
                        >
                            <div className="h-20 bg-white rounded border border-zinc-200 flex items-center justify-center">
                                <Sun className="h-6 w-6 text-orange-400" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`block text-sm font-medium ${theme === 'light' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>Corporate Light</span>
                                {theme === 'light' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                            </div>
                        </button>
                    </div>
                </div>
                </>
            )}

            {activeTab === 'Notifications' && (
                <div className="glass-panel p-6 rounded-xl space-y-6">
                     <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
                        <Bell className="h-5 w-5 text-amber-500" />
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { id: 'email', label: 'Email Alerts', desc: 'Get emails for new leads' },
                            { id: 'push', label: 'Push Notifications', desc: 'Browser notifications for status changes' },
                            { id: 'updates', label: 'System Updates', desc: 'Changelogs and maintenance alerts' },
                            { id: 'marketing', label: 'Marketing', desc: 'News and promotions' }
                        ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                                <div>
                                    <span className="block text-sm font-medium text-zinc-900 dark:text-white">{item.label}</span>
                                    <span className="text-xs text-zinc-500">{item.desc}</span>
                                </div>
                                 <button 
                                    onClick={() => toggleNotification(item.id as keyof typeof notifications)}
                                    className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${notifications[item.id as keyof typeof notifications] ? 'bg-blue-600' : 'bg-zinc-700'}`}
                                 >
                                    <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notifications[item.id as keyof typeof notifications] ? 'left-7' : 'left-1'}`}></div>
                                 </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(activeTab === 'Security' || activeTab === 'Billing') && (
                <div className="glass-panel p-12 rounded-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
                    <Shield className="h-12 w-12 text-zinc-600 opacity-50" />
                    <h3 className="text-xl font-bold text-zinc-500">Coming Soon</h3>
                    <p className="text-sm text-zinc-600 max-w-xs">
                        The {activeTab} module is currently under development. Check back later.
                    </p>
                </div>
            )}

        </div>
      </div>
    </div>
  );
}

function SyncButton() {
    const [syncing, setSyncing] = useState(false);
    
    const handleSync = async () => {
        setSyncing(true);
        await fetch('/api/sync', { method: 'POST' });
        setSyncing(false);
    };

    return (
        <button 
           onClick={handleSync}
           disabled={syncing}
           className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50"
        >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Sync Data'}
        </button>
    );
}

