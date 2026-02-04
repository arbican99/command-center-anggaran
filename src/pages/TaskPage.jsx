import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
// Import EmailJS
import emailjs from '@emailjs/browser';
import { 
  Plus, Calendar, Edit3, X, Trash2, 
  Send, Loader2, Upload, ChevronDown, ChevronRight, 
  FileText, Briefcase, Activity, Shield, Hash
} from 'lucide-react';

export default function TaskPage({ isExpanded }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [selectedFileName, setSelectedFileName] = useState("");

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzpvi4TcaZN3ySwtoyns5sh0RfKzvqrqmGXGMIEu1XkIdUaB9AJZzBt2B7oWTN7YPP-Gg/exec";

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser(profile);

      const { data: t, error: tErr } = await supabase
        .from('tasks')
        .select(`*, task_assignments (*, profiles (*))`)
        .eq('created_by', user.id) 
        .order('created_at', { ascending: false });
      
      if (tErr) throw tErr;
      setTasks(t || []);

      let userQuery = supabase.from('profiles').select('*').order('full_name', { ascending: true });
      if (profile.role === 'Kasubid') {
        userQuery = userQuery.eq('role', 'Staff').eq('atasan', profile.full_name);
      } else {
        userQuery = userQuery.in('role', ['Staff', 'Kasubid']);
      }

      const { data: u } = await userQuery;
      setUsers(u || []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  // Fungsi Baru: Kirim Notifikasi Email
  const sendEmailNotifications = async (taskTitle, taskNarasi, taskDueDate) => {
    // Filter user yang dipilih untuk mendapatkan email mereka
    const selectedUsersData = users.filter(u => selectedAgents.includes(u.id));

    // Kirim email ke setiap personil yang dipilih
    const emailPromises = selectedUsersData.map(user => {
      const templateParams = {
        penerima: user.full_name,
        target_email: user.email, // Pastikan kolom email ada di tabel profiles
        nama_tugas: taskTitle,
        deskripsi: taskNarasi,
        deadline: taskDueDate,
        pengirim: currentUser?.full_name || "Admin"
      };

      return emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
    });

    try {
      await Promise.all(emailPromises);
      console.log("Semua notifikasi email terkirim!");
    } catch (error) {
      console.error("Gagal mengirim beberapa email:", error);
    }
  };

  const buildTree = (list) => {
    const tree = [];
    const mapped = {};
    list.forEach(u => { mapped[u.full_name] = { ...u, children: [] }; });
    list.forEach(u => {
      if (u.atasan && mapped[u.atasan]) mapped[u.atasan].children.push(mapped[u.full_name]);
      else tree.push(mapped[u.full_name]);
    });
    return tree;
  };

  const RenderTree = ({ nodes }) => (
    <div className="ml-2 space-y-1">
      {nodes.map(node => (
        <div key={node.id} className="text-left">
          <div className="flex items-center gap-2 p-1 hover:bg-white/5 rounded transition-colors">
            {node.children?.length > 0 ? (
              <button type="button" onClick={() => setExpandedNodes(p => ({...p, [node.id]: !p[node.id]}))}>
                {expandedNodes[node.id] ? <ChevronDown size={12} className="text-blue-400"/> : <ChevronRight size={12}/>}
              </button>
            ) : <div className="w-3"/>}
            <input 
              type="checkbox" 
              checked={selectedAgents.includes(node.id)} 
              onChange={() => setSelectedAgents(p => p.includes(node.id) ? p.filter(id => id !== node.id) : [...p, node.id])} 
              className="w-3 h-3 accent-blue-600 rounded border-white/10"
            />
            <img src={node.avatar_url || `https://ui-avatars.com/api/?name=${node.full_name}&background=0D8ABC&color=fff`} className="w-5 h-5 rounded-full" alt=""/>
            <span className="text-[10px] font-bold text-slate-200 uppercase">{node.full_name}</span>
          </div>
          {expandedNodes[node.id] && node.children?.length > 0 && (
            <div className="ml-3 border-l border-white/10 pl-2 mt-1"><RenderTree nodes={node.children} /></div>
          )}
        </div>
      ))}
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedAgents.length === 0) return alert("Pilih personel pelaksana!");
    if (!currentUser) return alert("Sesi user tidak ditemukan.");
    
    setSubmitting(true);
    const formData = new FormData(e.target);
    const taskTitle = formData.get('title');
    const taskNarasi = formData.get('narasi');
    const taskDueDate = formData.get('dueDate');
    const taskNomor = editingTask?.nomor || `MSN-${Date.now()}`;
    
    try {
      let finalDriveUrl = editingTask?.link_drive || null;
      let finalFileId = editingTask?.file_id_drive || null;
      const fileInput = e.target.taskFile;

      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "upload", base64: base64Data, name: file.name, type: file.type,
            folderType: "TUGAS", nomor: taskNomor, userName: currentUser.full_name, oldFileId: editingTask?.file_id_drive
          }),
        });
        const resJson = await response.json();
        if (resJson.status === "success") {
          finalDriveUrl = resJson.url;
          finalFileId = resJson.id;
        }
      }

      const payload = {
        title: taskTitle,
        narasi: taskNarasi,
        due_date: taskDueDate,
        link_drive: finalDriveUrl,
        file_id_drive: finalFileId,
        created_by: currentUser.id,
        status: editingTask?.status || "Assigned"
      };

      let currentTaskId = editingTask?.id;

      if (editingTask) {
        const { error: upErr } = await supabase.from('tasks').update(payload).eq('id', editingTask.id);
        if (upErr) throw upErr;
        await supabase.from('task_assignments').delete().eq('task_id', editingTask.id);
      } else {
        const { data: newData, error: insErr } = await supabase
          .from('tasks')
          .insert([{ ...payload, nomor: taskNomor }])
          .select();
        
        if (insErr) throw insErr;
        
        if (newData && newData.length > 0) {
          currentTaskId = newData[0].id;
        } else {
          throw new Error("Gagal mendapatkan ID tugas baru. Periksa RLS di Supabase.");
        }
      }

      const assignments = selectedAgents.map(uid => ({
        task_id: currentTaskId,
        user_id: uid,
        status: "Assigned"
      }));

      const { error: asgErr } = await supabase.from('task_assignments').insert(assignments);
      if (asgErr) throw asgErr;

      // PROSES KIRIM EMAIL SETELAH BERHASIL SIMPAN KE DATABASE
      await sendEmailNotifications(taskTitle, taskNarasi, taskDueDate);

      setIsModalOpen(false);
      fetchData();
      alert("Data berhasil disimpan & Notifikasi email terkirim!");
    } catch (err) { 
      console.error("Submit Error:", err);
      alert("Terjadi kesalahan: " + err.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm("Hapus misi ini secara permanen?")) return;
    setLoading(true);
    try {
      if (task.file_id_drive) {
        await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: 'no-cors', body: JSON.stringify({ action: "delete", fileId: task.file_id_drive }) });
      }
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
      fetchData();
    } catch (err) { alert(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="w-full text-left p-2">
      <div className="flex justify-between items-center mb-6 bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg">
        <div>
          <h1 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
            <Shield size={20} className="text-blue-500" /> COMMAND CENTER
          </h1>
          <p className="text-[8px] text-blue-400 font-bold tracking-[0.2em] uppercase opacity-60 italic">System Administrasi Penugasan Bidang Anggaran</p>
        </div>
        <button 
          onClick={() => { setEditingTask(null); setSelectedAgents([]); setIsModalOpen(true); setSelectedFileName(""); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <Plus size={14} strokeWidth={3}/> INPUT PENUGASAN BARU
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-blue-500" size={24} />
          <p className="text-[8px] font-black uppercase text-slate-500 italic">Syncing Systems...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tasks.map(task => (
            <div key={task.id} className="relative bg-[#0c1225] border border-white/5 rounded-xl p-4 hover:border-blue-500/50 transition-all flex flex-col h-[280px] shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[8px] font-mono font-bold text-blue-400 uppercase tracking-tighter">
                  {task.nomor}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { 
                    setEditingTask(task); 
                    setSelectedAgents(task.task_assignments.map(a => a.user_id)); 
                    setIsModalOpen(true); 
                  }} className="p-1 text-slate-400 hover:text-blue-400 transition-colors">
                    <Edit3 size={14}/>
                  </button>
                  <button onClick={() => handleDelete(task)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>

              <h3 className="text-[12px] font-black text-white uppercase italic leading-tight mb-2 line-clamp-2">{task.title}</h3>
              <div className="bg-black/40 border border-white/5 p-3 rounded-lg mb-3 flex-grow overflow-hidden">
                <p className="text-[9px] text-slate-400 italic leading-relaxed line-clamp-4">"{task.narasi}"</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {task.task_assignments?.slice(0, 3).map((asg, idx) => (
                    <img key={idx} title={asg.profiles?.full_name} className="h-6 w-6 rounded-full border-2 border-[#0c1225] bg-slate-800 object-cover" src={asg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${asg.profiles?.full_name}&background=random`} alt=""/>
                  ))}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-cyan-400 text-[8px] font-bold uppercase">
                    <Calendar size={10}/> {task.due_date}
                  </div>
                  <div className="px-2 py-0.5 bg-green-500/10 rounded-full text-[7px] font-black text-green-500 uppercase tracking-widest">{task.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-500 ${isExpanded ? 'ml-64' : 'ml-24'}`}>
          <div className="bg-[#0b1224] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-sm font-black text-white uppercase italic tracking-widest">
                {editingTask ? 'Perbaikan Penugasan' : 'Informasi Penugasan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-all"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Judul Penugasan</label>
                  <input name="title" defaultValue={editingTask?.title} required className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Narasi Penugasan</label>
                  <textarea name="narasi" defaultValue={editingTask?.narasi} rows={5} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs italic resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Target Waktu</label>
                    <input name="dueDate" type="date" defaultValue={editingTask?.due_date} required className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white [color-scheme:dark] outline-none text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-1 tracking-widest">Lampiran Tugas</label>
                    <label className="flex items-center justify-center gap-2 bg-blue-600/10 border border-blue-600/30 p-3 rounded-xl cursor-pointer text-[9px] font-black text-blue-400 hover:bg-blue-600/20 transition-all truncate">
                      <Upload size={14}/> {selectedFileName || "Kirim Lampiran"}
                      <input type="file" name="taskFile" className="hidden" onChange={(e) => setSelectedFileName(e.target.files[0]?.name)} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 tracking-widest italic">Pelaksana Tugas</label>
                <div className="flex-grow bg-black/40 border border-white/10 rounded-xl p-3 overflow-y-auto max-h-[280px]">
                  <RenderTree nodes={buildTree(users)} />
                </div>
                <button disabled={submitting} className="mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                  {submitting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                  {editingTask ? 'Kirim Perbaikan Tugas' : 'Kirim Penugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}