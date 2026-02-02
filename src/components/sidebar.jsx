import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import logoImg from "../assets/logo.png"; 
import { 
  LayoutDashboard, UserCog, FilePlus, PencilRuler, 
  ClipboardList, LogOut, ChevronLeft, ChevronRight,
  User, Activity
} from "lucide-react";

export default function Sidebar({ userRole, onLogout, isExpanded, setIsExpanded }) {
  const location = useLocation();
  const [userData, setUserData] = useState({ name: "User", avatar: "" });

  useEffect(() => {
    let isMounted = true;
    async function getUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();
          
          if (data && isMounted) {
            setUserData({
              name: data.full_name || "User",
              avatar: data.avatar_url || ""
            });
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    }
    getUserProfile();
    return () => { isMounted = false; };
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18}/>, roles: ['superadmin', 'Kabid', 'Kasubid', 'Staff', 'Admin', 'Pimpinan'] },
    { name: "Pengumuman Bidang Anggaran", path: "/giat", icon: <Activity size={18}/>, roles: ['superadmin', 'Kabid', 'Kasubid', 'Staff', 'Admin', 'Pimpinan'] },
    { name: "Manajemen User", path: "/users", icon: <UserCog size={18}/>, roles: ['superadmin', 'Admin'] },
    { name: "Pembuatan Tugas", path: "/tasks", icon: <FilePlus size={18}/>, roles: ['superadmin', 'Kabid', 'Kasubid', 'Admin'] },
    { name: "Pengerjaan Tugas", path: "/dojob", icon: <PencilRuler size={18}/>, roles: ['superadmin', 'Kabid', 'Kasubid', 'Staff', 'Admin', 'Pimpinan'] },
    { name: "Pemeriksaan Tugas", path: "/approval", icon: <ClipboardList size={18}/>, roles: ['superadmin', 'Kabid', 'Kasubid'] },
  ];

  return (
    <aside className={`${isExpanded ? 'w-56' : 'w-20'} bg-[#0c1225] border-r border-white/5 flex flex-col p-3 transition-all duration-500 h-screen relative shadow-2xl`}>
      
      {/* Toggle Sidebar */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 bg-blue-600 rounded-lg p-1 border-2 border-[#020617] text-white z-[60] hover:scale-110 transition-all shadow-lg"
      >
        {isExpanded ? <ChevronLeft size={12}/> : <ChevronRight size={12}/>}
      </button>

      {/* Header Logo - Ukuran Diperbesar (max-h-24) dengan margin minimal */}
      <div className={`mb-1 mt-0 flex items-center transition-all duration-300 ${isExpanded ? 'px-0' : 'justify-center'}`}>
        <div className={`${isExpanded ? 'w-full px-1' : 'w-14'} transition-all duration-500`}>
          <img 
            src={logoImg} 
            alt="Logo" 
            className="w-full h-auto max-h-35 object-contain filter drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
          />
        </div>
      </div>

      {/* Profile Section - Sangat rapat dengan logo di atasnya */}
      <div className={`mb-3 flex items-center transition-all duration-500 ${isExpanded ? 'bg-white/5 p-2 rounded-xl border border-white/5' : 'justify-center'}`}>
        <div className="relative flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-blue-500/20 overflow-hidden">
            {userData.avatar ? (
              <img src={userData.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800">
                <User size={16} />
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-[#0c1225] rounded-full"></div>
        </div>

        {isExpanded && (
          <div className="ml-2.5 overflow-hidden text-left">
            <p className="text-[9px] font-black text-white uppercase tracking-tight truncate w-24">
              {userData.name}
            </p>
            <p className="text-[7px] font-bold text-blue-500/80 uppercase tracking-widest leading-none mt-0.5">
              {userRole}
            </p>
          </div>
        )}
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden text-left">
        {menuItems.map((item) => (
          item.roles.includes(userRole) && (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center group px-3 py-2.5 rounded-xl transition-all duration-300 border ${
                location.pathname === item.path 
                ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-sm" 
                : "text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300"
              }`}
            >
              <div className={location.pathname === item.path ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"}>
                {item.icon}
              </div>
              {isExpanded && <span className="ml-3 text-[9px] font-bold uppercase tracking-[0.1em] block leading-tight">{item.name}</span>}
              {!isExpanded && (
                <div className="absolute left-16 bg-blue-600 text-white text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity uppercase tracking-widest z-50">
                  {item.name}
                </div>
              )}
            </Link>
          )
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto pt-2 border-t border-white/5">
        <button onClick={onLogout} className="w-full flex items-center px-3 py-3 text-red-500/40 hover:text-red-400 rounded-xl transition-all group">
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          {isExpanded && <span className="ml-3 text-[9px] font-bold uppercase tracking-widest">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}