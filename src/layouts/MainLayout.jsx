import React, { useState } from 'react';
import Sidebar from '../components/sidebar';

const MainLayout = ({ children, userRole, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#020617] selection:bg-blue-500/30">
      {/* Sidebar - Fixed Position */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar 
          userRole={userRole} 
          onLogout={onLogout} 
          setIsExpanded={setIsExpanded} 
          isExpanded={isExpanded}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${isExpanded ? 'ml-64' : 'ml-24'}`}>
        
        {/* Background Decorative Glow (Sentuhan Futuristik) */}
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] pointer-events-none z-0" />
        <div className="fixed bottom-0 left-64 w-[300px] h-[300px] bg-emerald-600/5 blur-[100px] pointer-events-none z-0" />

        <main className="flex-1 w-full relative z-10 overflow-x-hidden p-4 md:p-8">
          {/* Container untuk memberikan batasan lebar agar konten tidak terlalu lebar di layar ultra-wide */}
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* Footer Kecil (Opsional) */}
        <footer className="py-4 px-8 border-t border-white/5 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] relative z-10">
          © 2026 Task Management System • <span className="text-blue-500/50">Terminal Monitoring v3.0</span>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;