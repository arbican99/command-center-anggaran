import React, { useState } from "react";
import Sidebar from "../components/sidebar"; // Menggunakan s kecil sesuai nama file kamu

export default function MainLayout({ children, userRole, onLogout }) {
  // State untuk sidebar desktop (lebar/kecil)
  const [isExpanded, setIsExpanded] = useState(false);
  // State untuk sidebar mobile (buka/tutup)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden relative">
      
      {/* 1. TOMBOL MENU MOBILE 
          Hanya muncul di layar HP (dibawah 768px). 
          Z-index tinggi agar tidak tertindih konten lain.
      */}
      <div className="md:hidden fixed top-4 left-4 z-[70]">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-900/40 text-white active:scale-95 transition-all flex items-center justify-center"
        >
          {isMobileOpen ? (
            <span className="text-xl font-bold">✕</span> // Tombol Close
          ) : (
            <span className="text-xl font-bold">☰</span> // Tombol Menu
          )}
        </button>
      </div>

      {/* 2. SIDEBAR MOBILE (OVERLAY)
          Muncul melayang dari kiri saat tombol diklik di HP.
      */}
      {isMobileOpen && (
        <>
          {/* Backdrop/Latar Gelap: Klik di mana saja untuk menutup menu */}
          <div 
            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[50] transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Container Sidebar Mobile */}
          <div className="md:hidden fixed inset-y-0 left-0 w-[280px] z-[60] bg-[#020617] shadow-2xl transform transition-transform duration-300 ease-in-out">
            <Sidebar 
              userRole={userRole} 
              onLogout={onLogout} 
              isExpanded={true} 
              setIsExpanded={() => {}} 
            />
          </div>
        </>
      )}

      {/* 3. SIDEBAR DESKTOP
          Tetap diam di samping (sticky) untuk layar laptop ke atas.
      */}
      <aside className="hidden md:flex sticky top-0 h-screen flex-shrink-0 border-r border-white/5 z-40">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
        />
      </aside>

      {/* 4. AREA KONTEN UTAMA
          mt-16 di HP agar konten tidak tertutup tombol menu.
      */}
      <div className="flex-1 flex flex-col min-w-0 w-full relative z-10">
        <main className="flex-1 p-4 md:p-10 pb-24 mt-16 md:mt-0">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
        
        {/* Footer Sederhana */}
        <footer className="p-8 border-t border-white/5 text-[10px] text-slate-500 uppercase tracking-widest text-center">
          © 2026 Task Management System — Command Center
        </footer>
      </div>

      {/* Efek Cahaya Latar (Glow) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}