import React, { useState } from 'react';
import Sidebar from '../components/sidebar';

const MainLayout = ({ children, userRole, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#020617] selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Sidebar - Disembunyikan di HP (hidden), muncul di MD ke atas (md:block) */}
      <div className="fixed inset-y-0 left-0 z-50 hidden md:block">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          setIsExpanded={setIsExpanded} 
          isExpanded={isExpanded}
        />
      </div>

      {/* Main Content Area */}
      {/* PERBAIKAN: ml-0 untuk HP, margin hanya aktif di layar md (tablet/laptop) */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out min-w-0 ${isExpanded ? 'md:ml-64' : 'md:ml-24'} ml-0`}>
        
        {/* Background Decorative Glow */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none z-0" />
        
        {/* main: Hapus overflow-x-hidden di sini karena sudah ada di container paling luar */}
        <main className="flex-1 w-full relative z-10 p-4 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        <footer className="py-4 px-8 border-t border-white/5 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] relative z-10">
          © 2026 Task Management System • <span className="text-blue-500/50">Terminal Monitoring v3.0</span>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;