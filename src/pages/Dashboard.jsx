import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, Briefcase, ShieldCheck, AlignLeft, Clock, User, CalendarDays, MapPin, BarChart3, Timer
} from 'lucide-react';

export default function Dashboard() {
  const [personnelStats, setPersonnelStats] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const privilegedRoles = ['superadmin', 'Kabid', 'Kasubid'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      // --- 1. AMBIL DATA KEGIATAN ---
      const { data: kegiatanData } = await supabase
        .from('kegiatan')
        .select(`*, profiles:created_by (full_name, avatar_url)`)
        .order('tanggal', { ascending: false })
        .limit(5);
      setRecentActivities(kegiatanData || []);

      // --- 2. TUGAS PRIBADI ---
      const { data: myAssignments } = await supabase
        .from('task_assignments')
        .select(`*, tasks!inner(id, title, narasi, due_date, created_by)`)
        .eq('user_id', user.id);

      if (myAssignments) {
        const orderWeight = { 'Assigned': 1, 'Submitted': 2, 'Completed': 3 };
        const sortedTasks = [...myAssignments].sort((a, b) => 
          (orderWeight[a.status] || 99) - (orderWeight[b.status] || 99)
        );
        
        const creatorIds = [...new Set(sortedTasks.map(a => a.tasks.created_by))];
        const { data: creators } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', creatorIds);

        setPersonalTasks(sortedTasks.map(assignment => ({
          ...assignment,
          pemberi: creators?.find(c => c.id === assignment.tasks.created_by) || { full_name: 'Pimpinan' }
        })));
      }

      // --- 3. GRAFIK PERSONEL (HANYA UNTUK PRIVILEGED ROLES) ---
      if (profile && privilegedRoles.includes(profile.role)) {
        const { data: staffData } = await supabase
          .from('task_assignments')
          .select(`
            *,
            profiles:user_id (id, full_name, avatar_url),
            tasks!inner(created_by)
          `)
          .eq('tasks.created_by', profile.id);

        if (staffData) setPersonnelStats(groupDataByPerson(staffData));
      }

    } catch (err) {
      console.error("Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupDataByPerson = (data) => {
    const grouped = data.reduce((acc, curr) => {
      const staffProfile = curr.profiles;
      if (!staffProfile) return acc;
      const userId = staffProfile.id;
      if (!acc[userId]) {
        acc[userId] = {
          name: staffProfile.full_name,
          avatar: staffProfile.avatar_url,
          initial: staffProfile.full_name?.charAt(0),
          Assigned: 0, Submitted: 0, Completed: 0, total: 0
        };
      }
      if (curr.status && acc[userId][curr.status] !== undefined) {
        acc[userId][curr.status] += 1;
        acc[userId].total += 1;
      }
      return acc;
    }, {});
    return Object.values(grouped);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Assigned': return { bg: 'bg-blue-600', border: 'border-blue-500' };
      case 'Submitted': return { bg: 'bg-amber-600', border: 'border-amber-500' };
      case 'Completed': return { bg: 'bg-emerald-600', border: 'border-emerald-500' };
      default: return { bg: 'bg-slate-600', border: 'border-slate-500' };
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-blue-400 font-mono text-[10px] tracking-[0.3em] p-6 text-center">
      SYNCHRONIZING SECURE SYSTEMS...
    </div>
  );

  return (
    /* PERBAIKAN: Gunakan flex-1 dan pastikan overflow tidak di-hidden */
    <div className="flex-1 w-full text-white font-sans text-left">
      <div className="p-2 md:p-4 space-y-6 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase italic leading-none">Command Center</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">
                {userProfile?.full_name} <span className="text-white/30 px-1">|</span> {userProfile?.role}
              </p>
            </div>
          </div>
        </div>

        {/* --- TABEL KEGIATAN --- */}
        <div className="bg-[#0c1225] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-blue-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">KEGIATAN BIDANG ANGGARAN</h3>
            </div>
            <span className="text-[8px] font-mono text-white/40 font-black tracking-tighter">OPERATIONAL LOG</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <tbody className="divide-y divide-white/5">
                {recentActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="p-4 w-12">
                      <div className="w-9 h-9 rounded-full border border-blue-500/30 overflow-hidden bg-slate-800">
                        {act.profiles?.avatar_url ? (
                          <img src={act.profiles.avatar_url} className="w-full h-full object-cover" alt="User" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] font-black text-blue-400">
                            {act.profiles?.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-[12px] font-black text-white uppercase group-hover:text-blue-400 transition-colors">
                        {act.judul}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-300">
                          <User size={12} className="text-blue-500" /> <span>{act.profiles?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300">
                          <MapPin size={12} className="text-emerald-500" /> <span>{act.lokasi || 'KANTOR PUSAT'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-white bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/20 whitespace-nowrap">
                          <CalendarDays size={10} className="text-blue-400" /> {new Date(act.tanggal).toLocaleDateString('id-ID')}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300">
                          <Timer size={10} className="text-amber-500" /> {formatTime(act.jam)} WIB
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION GRID TUGAS & MATRIX */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* PANEL GRAFIK KINERJA */}
          {privilegedRoles.includes(userProfile?.role) && (
            <div className="lg:col-span-3 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2 px-1">
                <BarChart3 size={14}/> Personnel Performance Matrix
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {personnelStats.length > 0 ? personnelStats.map((person, idx) => (
                  <div key={idx} className="bg-white/[0.03] border border-white/10 p-4 rounded-xl flex items-center gap-4 hover:bg-white/[0.05] transition-all">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/20 overflow-hidden shrink-0">
                      {person.avatar ? <img src={person.avatar} className="w-full h-full object-cover" alt="Staff" /> : <div className="flex h-full items-center justify-center font-bold text-lg">{person.initial}</div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1.5 text-white">
                        <span className="text-xs font-black uppercase tracking-tight">{person.name}</span>
                        <span className="text-[9px] font-mono text-yellow-400 font-bold tracking-widest">{person.total} JOBS</span>
                      </div>
                      <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden flex border border-white/5">
                        <div style={{ width: `${(person.Assigned/person.total)*100}%` }} className="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                        <div style={{ width: `${(person.Submitted/person.total)*100}%` }} className="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]"></div>
                        <div style={{ width: `${(person.Completed/person.total)*100}%` }} className="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-slate-500 text-[9px] font-black uppercase">
                    Data Matrix Not Available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PANEL TUGAS SAYA */}
          <div className={privilegedRoles.includes(userProfile?.role) ? 'lg:col-span-1' : 'lg:col-span-4'}>
            <div className="bg-[#0c1225] border border-white/10 p-4 rounded-2xl shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-3 text-white">
                <Briefcase size={14} className="inline mr-2 text-blue-500" /> Tugas Saya
              </h3>
              <div className="space-y-3">
                {personalTasks.map((item, idx) => {
                  const style = getStatusStyle(item.status);
                  return (
                    <div key={idx} className={`bg-white/[0.03] border-l-4 ${style.border} p-3 rounded-r-lg`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`${style.bg} text-white text-[8px] font-black px-2 py-0.5 rounded shadow-sm`}>
                          {item.status}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-black">
                          {new Date(item.tasks?.due_date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-black text-white uppercase mb-1 leading-tight">{item.tasks?.title}</h4>
                      <div className="bg-black/50 p-2 rounded border border-white/5 mb-3">
                        <p className="text-[10px] text-white font-medium italic leading-relaxed">
                          "{item.tasks?.narasi}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center text-[7px] font-black">
                             {item.pemberi?.full_name?.charAt(0)}
                           </div>
                           <span className="text-[8px] font-black text-blue-300 uppercase italic">By: {item.pemberi?.full_name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tambahan Spacer di bawah agar scroll tidak mentok */}
        <div className="h-20 md:h-10"></div>
      </div>
    </div>
  );
}