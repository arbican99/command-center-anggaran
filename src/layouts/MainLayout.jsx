import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, userRole, onLogout }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020617] overflow-x-hidden">
      
      {/* SIDEBAR: Muncul di desktop, sticky saat scroll */}
      <aside className="hidden md:flex sticky top-0 h-screen flex-shrink-0 border-r border-white/5 z-20">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      </aside>

      {/* AREA KONTEN */}
      <div className="flex-1 flex flex-col min-w-0 w-full relative z-10">
        <main className="flex-1 p-4 md:p-10 pb-24">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="p-8 border-t border-white/5 text-[9px] text-slate-600 uppercase tracking-widest text-center">
          © 2026 Task Management System
        </footer>
      </div>

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px]" />
      </div>
    </div>
  );
}