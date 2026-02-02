import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  CheckCircle, Send, User, Eye, Loader2, AlertCircle, 
  Clock, CheckSquare, FileText, ExternalLink, MessageSquare, Archive, Layers
} from 'lucide-react';

export default function TaskApprovalPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showKoreksiModal, setShowKoreksiModal] = useState(false);
  const [pesanKoreksi, setPesanKoreksi] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, id')
        .eq('id', user.id)
        .single();
      
      setCurrentUser(profile);
      await fetchAssignments(profile);
    } catch (err) {
      console.error("Init Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (profile) => {
    try {
      let query = supabase
        .from('task_assignments')
        .select(`
          id, status, ctt_koreksi, narasi, link_drive, user_id,
          profiles:user_id (full_name, role, avatar_url),
          tasks:task_id (id, title, description, link_drive, created_by)
        `);

      if (profile.role === 'Kasubid') {
        query = query.eq('tasks.created_by', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const filteredData = profile.role === 'Kasubid' 
        ? data.filter(item => item.tasks?.created_by === profile.id)
        : data;

      setAssignments(filteredData || []);
    } catch (err) {
      console.error("Fetch Error:", err.message);
    }
  };

  const groupedByStaff = assignments.reduce((acc, item) => {
    const userName = item.profiles?.full_name || 'Tanpa Nama';
    if (!acc[userName]) {
      acc[userName] = {
        tasks: [],
        role: item.profiles?.role || 'Staff',
        avatar: item.profiles?.avatar_url
      };
    }
    acc[userName].tasks.push(item);
    return acc;
  }, {});

  const staffList = Object.keys(groupedByStaff).sort((a, b) => {
    const roleA = groupedByStaff[a].role;
    const roleB = groupedByStaff[b].role;
    if (roleA === 'Kasubid' && roleB !== 'Kasubid') return -1;
    if (roleA !== 'Kasubid' && roleB === 'Kasubid') return 1;
    return a.localeCompare(b);
  });

  useEffect(() => {
    if (staffList.length > 0 && !selectedUser) {
      setSelectedUser(staffList[0]);
    }
  }, [staffList]);

  const currentStaffData = selectedUser ? groupedByStaff[selectedUser].tasks : [];
  const completedTasks = currentStaffData.filter(t => t.status === 'Completed');
  const submittedTasks = currentStaffData.filter(t => t.status === 'Submitted');
  const assignedTasks = currentStaffData.filter(t => t.status === 'Assigned');

  const handleKoreksi = async () => {
    if (!pesanKoreksi.trim()) return alert("Wajib isi catatan koreksi!");
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({ ctt_koreksi: pesanKoreksi })
        .eq('id', selectedTask.id);

      if (error) throw error;
      setShowKoreksiModal(false);
      setPesanKoreksi("");
      fetchAssignments(currentUser);
    } catch (err) { alert(err.message); } finally { setActionLoading(false); }
  };

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({ status: 'Completed', ctt_koreksi: null })
        .eq('id', id);
      if (error) throw error;
      fetchAssignments(currentUser);
    } catch (err) { alert(err.message); } finally { setActionLoading(false); }
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-400 font-black animate-pulse text-[11px] tracking-[0.5em]">SYNCHRONIZING DATA...</div>;

  return (
    <div className="h-screen bg-[#020617] text-zinc-100 flex overflow-hidden font-sans">
      
      {/* SIDEBAR - Dengan Foto User */}
      <div className="w-56 bg-[#0c1225] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-5 border-b border-white/5 bg-[#0e152b]">
          <div className="flex items-center gap-2 mb-1">
            <Layers size={14} className="text-blue-500" />
            <h1 className="text-[10px] font-black text-white uppercase tracking-wider">Control Panel</h1>
          </div>
          <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Mode: {currentUser?.role}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {staffList.map(name => (
            <button
              key={name}
              onClick={() => setSelectedUser(name)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all ${
                selectedUser === name ? 'bg-blue-600 shadow-xl' : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* AVATAR DARI avatar_url */}
              <div className={`shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center ${
                selectedUser === name ? 'border-white bg-white/20' : 'border-blue-500/20 bg-zinc-900'
              }`}>
                {groupedByStaff[name].avatar ? (
                  <img 
                    src={groupedByStaff[name].avatar} 
                    alt={name} 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=" + name; }}
                  />
                ) : (
                  <User size={18} className={selectedUser === name ? 'text-white' : 'text-blue-500'} />
                )}
              </div>
              
              <div className="flex-1 text-left overflow-hidden">
                <p className={`text-[10px] font-black uppercase truncate ${selectedUser === name ? 'text-white' : 'text-zinc-100'}`}>
                  {name}
                </p>
                <p className={`text-[7px] font-black uppercase tracking-tighter ${selectedUser === name ? 'text-blue-100' : 'text-blue-500'}`}>
                  {groupedByStaff[name].role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 overflow-y-auto bg-[#020617] custom-scrollbar">
        {selectedUser ? (
          <div className="p-8 max-w-5xl mx-auto w-full space-y-12">
            
            {/* 1. TOP PANEL: COMPLETED (HORIZONTAL) */}
            <section>
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                <Archive size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Arsip Selesai ({completedTasks.length})</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {completedTasks.length > 0 ? completedTasks.map(item => (
                  <div key={item.id} className="min-w-[240px] bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase truncate mb-1">{item.tasks?.title}</h4>
                      <p className="text-[9px] text-zinc-300 italic truncate italic font-medium">"{item.narasi || 'Selesai'}"</p>
                    </div>
                    <button 
                      onClick={() => window.open(item.link_drive, '_blank')}
                      className="mt-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-100 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-blue-500/20"
                    >
                      <Eye size={12} /> Buka Dokumen
                    </button>
                  </div>
                )) : (
                  <div className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl text-center text-[9px] text-zinc-700 font-bold uppercase italic tracking-widest">Kosong</div>
                )}
              </div>
            </section>

            {/* 2. CENTER PANEL: SUBMITTED (DETAILED) */}
            <section>
              <div className="flex items-center gap-2 mb-6 text-emerald-400">
                <CheckSquare size={16} />
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Butuh Persetujuan ({submittedTasks.length})</h3>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {submittedTasks.map((item) => (
                  <div key={item.id} className="bg-[#0c1225] border border-white/15 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row shadow-2xl hover:border-emerald-500/40 transition-all">
                    {/* Preview Section */}
                    <div className="w-full md:w-56 h-48 md:h-auto bg-black/60 border-r border-white/10 overflow-hidden">
                      {item.link_drive ? (
                        <iframe src={item.link_drive.replace('/view', '/preview')} className="w-full h-full border-none opacity-50" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-zinc-800 font-black">NO PREVIEW</div>
                      )}
                    </div>
                    
                    {/* Content Section */}
                    <div className="flex-1 p-8 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <h4 className="text-[16px] font-black text-white uppercase italic tracking-tight leading-tight">{item.tasks?.title}</h4>
                        <div className="flex gap-2">
                           <button onClick={() => window.open(item.tasks?.link_drive, '_blank')} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-blue-600 transition-all"><FileText size={16}/></button>
                           <button onClick={() => window.open(item.link_drive, '_blank')} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-blue-600 transition-all"><ExternalLink size={16}/></button>
                        </div>
                      </div>

                      {/* BOX NARASI: TERANG & TAJAM */}
                      <div className="bg-white/[0.08] border border-white/10 rounded-3xl p-5 mb-6">
                        <div className="flex items-center gap-2 mb-3 text-blue-400">
                          <MessageSquare size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Laporan Narasi:</span>
                        </div>
                        <p className="text-[14px] text-white font-black italic leading-relaxed">
                          {item.narasi || "Tidak ada narasi pengerjaan."}
                        </p>
                      </div>

                      {item.ctt_koreksi && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 mb-6">
                           <p className="text-[11px] text-orange-200 font-semibold italic">Catatan Koreksi: {item.ctt_koreksi}</p>
                        </div>
                      )}

                      <div className="mt-auto flex gap-4">
                        <button 
                          onClick={() => { setSelectedTask(item); setPesanKoreksi(item.ctt_koreksi || ""); setShowKoreksiModal(true); }}
                          className="flex-1 py-4 bg-white/5 text-orange-400 border border-orange-500/20 hover:bg-orange-600 hover:text-white rounded-2xl text-[10px] font-black uppercase transition-all tracking-widest"
                        >
                          Koreksi
                        </button>
                        <button 
                          onClick={() => handleApprove(item.id)}
                          disabled={actionLoading}
                          className="flex-[1.5] py-4 bg-emerald-600 text-white hover:bg-emerald-500 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all tracking-widest"
                        >
                          Approve Tugas
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. BOTTOM PANEL: IN PROGRESS (WARNA TERANG) */}
            <section className="pt-6">
              <div className="flex items-center gap-2 mb-4 text-zinc-500">
                <Clock size={14} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Sedang Dikerjakan ({assignedTasks.length})</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {assignedTasks.map((item) => (
                  <div key={item.id} className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center">
                    <p className="text-[10px] font-black text-white uppercase truncate">{item.tasks?.title}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <User size={80} className="text-zinc-600 mb-6" />
            <p className="text-[12px] font-black uppercase tracking-[1.5em]">Pilih Profile Sidebar</p>
          </div>
        )}
      </div>

      {/* MODAL KOREKSI */}
      {showKoreksiModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-[100]">
          <div className="bg-[#0c1225] border border-white/15 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
            <h2 className="text-[12px] font-black text-white uppercase italic mb-6 tracking-widest flex items-center gap-3">
              <AlertCircle size={16} className="text-orange-500" /> Masukkan Koreksi
            </h2>
            <textarea 
              className="w-full bg-[#020617] border border-white/20 rounded-2xl p-6 text-[13px] text-white min-h-[180px] mb-6 focus:border-orange-500 outline-none transition-all placeholder:text-zinc-800"
              placeholder="Apa yang harus diperbaiki?"
              value={pesanKoreksi}
              onChange={(e) => setPesanKoreksi(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowKoreksiModal(false)} className="flex-1 py-4 text-[11px] font-black uppercase text-zinc-500 hover:text-white">Batal</button>
              <button 
                onClick={handleKoreksi}
                disabled={actionLoading}
                className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-orange-900/40"
              >
                Simpan Koreksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}