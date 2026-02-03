import React, { useState } from 'react';
import Sidebar from '../components/sidebar';

const MainLayout = ({ children, userRole, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    // Gunakan 'relative' bukan hanya flex untuk memastikan alur dokumen benar
    <div className="relative min-h-screen bg-[#020617] selection:bg-blue-500/30">
      
      {/* Sidebar - Hanya muncul di Desktop */}
      <div className="fixed inset-y-0 left-0 z-50 hidden md:block">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          setIsExpanded={setIsExpanded} 
          isExpanded={isExpanded}
        />
      </div>

      {/* Konten Utama */}
      <div className={`flex flex-col min-h-screen transition-all duration-500 ${isExpanded ? 'md:ml-64' : 'md:ml-24'} ml-0`}>
        
        {/* Dekorasi Background - Pastikan 'pointer-events-none' agar tidak menghalangi sentuhan jari */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none -z-10" />
        <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/5 blur-[100px] pointer-events-none -z-10" />

        {/* Area Main - Tambahkan overflow-visible untuk memastikan scroll tidak tertahan */}
        <main className="flex-grow w-full p-4 md:p-8 overflow-y-visible relative z-10">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer - Beri padding bawah ekstra untuk navigasi HP */}
        <footer className="py-6 px-8 border-t border-white/5 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-16 md:mb-0">
          © 2026 Task Management System • <span className="text-blue-500/50">Terminal Monitoring v3.0</span>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;