"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, DollarSign, Settings, Users, Server, Activity } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { JarvisCommand } from "./JarvisCommand";

const navigation = [
  { name: "Leads", href: "/", icon: Users },
  { name: "Projects", href: "/admin/projects", icon: FolderKanban },
  { name: "Financials", href: "/financials", icon: DollarSign },
  { name: "Admin", href: "/admin", icon: Server },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) setUserEmail(user.email || "Exec");
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
     await supabase.auth.signOut();
     router.push('/login');
     router.refresh();
  };

  return (
    <div 
      className="relative flex h-screen w-20 flex-col justify-between border-r border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black z-50"
    >
      <div>
        <div className="mb-8 flex h-20 items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black shadow-deep">
             <Activity className="h-5 w-5" strokeWidth={1.5} />
          </div>
        </div>
        
        <nav className="flex flex-col gap-4 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-center rounded-xl p-3 transition-all duration-300 ${
                  isActive
                    ? "bg-white text-black shadow-lg shadow-black/5 dark:bg-white/10 dark:text-white dark:shadow-none"
                    : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
                title={item.name}
              >
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 flex flex-col items-center gap-4">
        {/* Jarvis integration */}
        <JarvisCommand />
        
        <div className="h-px w-8 bg-zinc-200 dark:bg-white/10" />
        
        <button 
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-100 ring-2 ring-white dark:from-zinc-800 dark:to-zinc-900 dark:ring-white/5 hover:ring-red-500/50 transition-all cursor-pointer group relative" 
            title={userEmail || "Logout"}
        >
             <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 group-hover:opacity-0 transition-opacity">
                {userEmail ? userEmail[0].toUpperCase() : 'LA'}
             </span>
             <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
             </span>
        </button>
      </div>
    </div>
  );
}
