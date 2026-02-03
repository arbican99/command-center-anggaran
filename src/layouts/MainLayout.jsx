import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, userRole, onLogout }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020617]">
      
      {/* SIDEBAR: Muncul hanya di layar besar */}
      <div className="hidden md:block sticky top-0 h-screen flex-shrink-0 border-r border-white/5">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      </div>

      {/* AREA KONTEN: Biarkan tinggi otomatis agar bisa di-scroll secara alami */}
      <div className="flex-1 w-full min-w-0">
        <main className="p-4 md:p-10 pb-20">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="p-8 border-t border-white/5 text-[9px] text-slate-600 uppercase tracking-widest text-center">
          © 2026 Task Management System
        </footer>
      </div>

      {/* Background Glow - Posisikan Fixed agar tidak ikut tergulung */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px]" />
      </div>
    </div>
  );
}