import React, { useState } from 'react';
import Sidebar from '../components/sidebar';

const MainLayout = ({ children, userRole, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="relative min-h-screen bg-[#020617] overflow-x-hidden">
      
      {/* SIDEBAR: Gunakan pointer-events-none agar tidak menghalangi sentuhan saat sembunyi */}
      <div className="fixed inset-y-0 left-0 z-[100] hidden md:block w-auto pointer-events-auto">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          setIsExpanded={setIsExpanded} 
          isExpanded={isExpanded}
        />
      </div>

      {/* CONTENT AREA: Gunakan relative z-10 agar berada di atas background glow */}
      <div className={`relative z-10 flex flex-col min-h-screen ${isExpanded ? 'md:ml-64' : 'md:ml-24'} ml-0`}>
        
        <main className="flex-1 w-full p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        <footer className="py-6 px-8 border-t border-white/5 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-10 md:mb-0">
          © 2026 Task Management System
        </footer>
      </div>

      {/* BACKGROUND DECORATION: Pindahkan ke paling bawah dan beri z-index negatif */}
      {/* pointer-events-none WAJIB agar jari bisa tembus ke konten */}
      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 blur-[100px]" />
      </div>

    </div>
  );
};

export default MainLayout;