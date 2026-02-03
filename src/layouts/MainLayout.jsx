import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function MainLayout({ children, userRole, onLogout }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    // Pastikan overflow-x-hidden untuk mencegah layar geser kanan-kiri yang mengganggu scroll atas-bawah
    <div className="flex min-h-screen bg-[#020617] overflow-x-hidden">
      
      {/* SIDEBAR: Hanya ada di MD ke atas. Gunakan h-full, jangan h-screen */}
      <aside className="hidden md:flex sticky top-0 h-screen flex-shrink-0 border-r border-white/5">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      </aside>

      {/* AREA KONTEN: Pastikan tidak ada overflow hidden di sini */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <main className="flex-1 p-4 md:p-10 pb-24">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        
        <footer className="p-8 border-t border-white/5 text-[9px] text-slate-600 uppercase tracking-widest text-center">
          © 2026 Task Management System
        </footer>
      </div>

      {/* Background Glow - Tetap fixed aman */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px]" />
      </div>
    </div>
  );
}