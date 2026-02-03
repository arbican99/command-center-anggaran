import React, { useState } from "react";
import Sidebar from "../components/Sidebar"; // Pastikan path ini benar sesuai folder Anda

export default function MainLayout({ children, userRole, onLogout }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#020617] selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. Background Glow (Hiasan agar tidak sepi) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="flex h-screen overflow-hidden">
        
        {/* 2. SIDEBAR 
            'hidden md:flex' artinya: Hilang di HP, Muncul di Laptop.
            Ini supaya Dashboard di HP punya ruang penuh dan bisa di-scroll.
        */}
        <div className="hidden md:flex flex-shrink-0 border-r border-white/5">
          <Sidebar 
            userRole={userRole} 
            onLogout={onLogout} 
            isExpanded={isExpanded} 
            setIsExpanded={setIsExpanded} 
          />
        </div>

        {/* 3. AREA KONTEN UTAMA */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Container ini yang bertanggung jawab atas Scroll */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#020617]/50">
            <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto min-h-full">
              
              {/* Tempat konten Dashboard/Tugas Anda muncul */}
              {children}

              {/* Footer kecil di dalam scroll */}
              <footer className="mt-20 py-6 border-t border-white/5 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                © 2026 Task Management System
              </footer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}