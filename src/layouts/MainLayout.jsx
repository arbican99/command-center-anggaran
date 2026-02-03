import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

/**
 * MainLayout Component
 * Mengatur struktur dasar halaman termasuk Sidebar dan Area Konten Utama.
 */
export default function MainLayout({ children, userRole, onLogout }) {
  // State untuk mengontrol lebar sidebar (untuk tampilan desktop)
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020617] overflow-x-hidden text-slate-200">
      
      {/* SIDEBAR DESKTOP
        Hanya muncul di layar Medium (md) ke atas. 
        Menggunakan sticky agar tetap terlihat saat konten di-scroll.
      */}
      <aside className="hidden md:flex sticky top-0 h-screen flex-shrink-0 border-r border-white/5 z-20">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      </aside>

      {/* KONTEN UTAMA 
        flex-1 memastikan area ini mengambil sisa ruang yang tersedia.
        flex-col digunakan agar footer selalu berada di paling bawah jika konten sedikit.
      */}
      <div className="flex-1 flex flex-col min-w-0 w-full relative z-10">
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-10 pb-24">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="p-8 border-t border-white/5 text-[10px] text-slate-500 uppercase tracking-[0.2em] text-center">
          © 2026 Task Management System — Command Center Anggaran
        </footer>
      </div>

      {/* BACKGROUND GLOW EFFECT
        Menggunakan fixed agar posisi cahaya tidak bergeser saat scroll.
        -z-10 memastikan cahaya berada di belakang semua elemen.
      */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full transform -translate-x-1/2 translate-y-1/2" />
      </div>

    </div>
  );
}