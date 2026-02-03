import React, { useState } from "react";
import Sidebar from "../components/sidebar";

export default function MainLayout({ children, userRole, onLogout }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // State baru untuk membuka sidebar di HP
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020617] overflow-x-hidden">
      
      {/* SIDEBAR DESKTOP: Tetap seperti kemarin */}
      <aside className="hidden md:flex sticky top-0 h-screen flex-shrink-0 border-r border-white/5 z-40">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      </aside>

      {/* MOBILE HEADER: Tombol untuk buka menu di HP */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20 text-white active:scale-90 transition-transform"
        >
          {isMobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY: Muncul saat tombol di klik */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-[45] bg-[#020617]/90 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="h-full w-[280px] border-r border-white/10">
              <Sidebar 
                userRole={userRole} 
                onLogout={onLogout} 
                isExpanded={true} 
                setIsExpanded={() => {}} 
              />
           </div>
           {/* Klik area kosong untuk tutup */}
           <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* AREA KONTEN UTAMA */}
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

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px]" />
      </div>
    </div>
  );
}