import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Loader2, Upload, Eye, FileText, AlertCircle, Edit3, Trash2, Send
} from 'lucide-react';

export default function TaskExecutionPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [myAssignments, setMyAssignments] = useState([]);
  const [userData, setUserData] = useState(null);
  const [inputs, setInputs] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [editingId, setEditingId] = useState(null);

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzpvi4TcaZN3ySwtoyns5sh0RfKzvqrqmGXGMIEu1XkIdUaB9AJZzBt2B7oWTN7YPP-Gg/exec";

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setFetching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      setUserData(profile);

      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          id, status, ctt_koreksi, link_drive, file_id_drive, narasi,
          tasks ( id, title, description, due_date, link_drive, nomor, narasi )
        `)
        .eq('user_id', session.user.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setMyAssignments(data || []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setFetching(false); 
    }
  };

  // FUNGSI HAPUS: Sekarang mengosongkan narasi, link drive, dan status
  const handleDeleteSubmission = async (assignment) => {
    if (!window.confirm("Batalkan pengiriman? File dan Narasi Laporan Anda akan dihapus total.")) return;
    
    setLoading(true);
    try {
      // 1. Hapus File di Google Drive jika ada
      if (assignment.file_id_drive) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({ action: "delete", fileId: assignment.file_id_drive })
        });
      }

      // 2. Reset Status dan Kosongkan Kolom Narasi di task_assignments
      const { error } = await supabase
        .from('task_assignments')
        .update({ 
          status: 'Assigned', 
          link_drive: null, 
          file_id_drive: null,
          ctt_koreksi: null,
          narasi: null // <-- SEKARANG DIKOSONGKAN SESUAI PERMINTAAN
        })
        .eq('id', assignment.id);

      if (error) throw error;

      // 3. Bersihkan input state lokal agar tampilan textarea kembali kosong
      setInputs(prev => {
        const newState = { ...prev };
        delete newState[assignment.id];
        return newState;
      });

      alert("Laporan dan file berhasil dihapus.");
      fetchAssignments();
    } catch (err) { 
      alert("Gagal menghapus: " + err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleUpdateExecution = async (assignment) => {
    const narasiUser = inputs[assignment.id] !== undefined ? inputs[assignment.id] : assignment.narasi;
    if (!narasiUser || narasiUser.trim() === "") return alert("Narasi pengerjaan wajib diisi!");
    
    setLoading(true);
    try {
      let finalLink = assignment.link_drive;
      let newFileId = assignment.file_id_drive;

      if (selectedFiles[assignment.id]) {
        const file = selectedFiles[assignment.id];
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });

        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify({
            base64: base64Data, type: file.type, name: file.name,
            nomor: assignment.tasks.nomor || "TASK", 
            userName: userData?.full_name?.toUpperCase() || 'USER',
            folderType: "HASIL"
          })
        });
        const result = await response.json();
        if (result.status === "success") {
          finalLink = `https://drive.google.com/file/d/${result.id}/view`;
          newFileId = result.id;
        } else throw new Error(result.message);
      }

      const { error } = await supabase
        .from('task_assignments')
        .update({ 
          narasi: narasiUser, status: 'Submitted', 
          ctt_koreksi: null, link_drive: finalLink, file_id_drive: newFileId
        })
        .eq('id', assignment.id);

      if (error) throw error;
      alert("Laporan berhasil dikirim!");
      setEditingId(null); setSelectedFiles({}); fetchAssignments();
    } catch (err) { alert("Error: " + err.message); } finally { setLoading(false); }
  };

  if (fetching) return <div className="p-10 text-center text-[10px] font-black text-blue-500 animate-pulse uppercase">Memuat Tugas...</div>;

  const sections = [
    { title: "Tugas Baru", status: "Assigned", color: "text-blue-400", border: "border-blue-500" },
    { title: "Review", status: "Submitted", color: "text-yellow-500", border: "border-yellow-500" },
    { title: "Selesai", status: "Completed", color: "text-emerald-500", border: "border-emerald-500" }
  ];

  return (
    <div className="p-3 bg-[#020617] min-h-screen text-slate-300 font-sans tracking-tight">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[1600px] mx-auto">
        {sections.map(sec => (
          <div key={sec.status} className="space-y-3">
            <h2 className={`text-[9px] font-bold uppercase tracking-[0.15em] p-2 bg-white/5 rounded-xl border-l-2 ${sec.color} ${sec.border} flex justify-between items-center`}>
              {sec.title}
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[8px]">
                {myAssignments.filter(a => a.status === sec.status).length}
              </span>
            </h2>

            {myAssignments.filter(a => a.status === sec.status).map(item => (
              <div key={item.id} className="bg-[#0c1225] border border-white/5 rounded-2xl p-4 shadow-lg hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="text-[9px] font-black text-white uppercase italic leading-tight flex-1">{item.tasks?.title}</h3>
                  <span className="text-[8px] font-mono text-slate-500 whitespace-nowrap">{item.tasks?.due_date}</span>
                </div>
                
                <p className="text-[8px] text-slate-500 mb-3 line-clamp-1 italic">{item.tasks?.description}</p>
                
                {/* AREA INSTRUKSI ADMIN */}
                <div className="space-y-1.5 mb-3">
                  {item.tasks?.link_drive && (
                    <button onClick={() => window.open(item.tasks.link_drive, '_blank')} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-[8px] font-bold text-cyan-500 hover:bg-cyan-500/10 transition-all">
                      <FileText size={12}/> LAMPIRAN INSTRUKSI
                    </button>
                  )}
                  
                  {item.tasks?.narasi && (
                    <div className="p-2 bg-white/5 rounded-lg border-l border-slate-600">
                      <span className="text-[7px] font-bold text-slate-500 uppercase block mb-0.5">Pesan Admin:</span>
                      <p className="text-[8px] text-slate-300 leading-normal italic">"{item.tasks.narasi}"</p>
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-white/5 w-full mb-3" />

                {/* AREA PENGERJAAN USER */}
                {editingId === item.id || item.status === 'Assigned' ? (
                  <div className="space-y-2.5">
                    <div className="relative">
                      <span className="text-[7px] font-bold text-blue-500 uppercase block mb-1">Laporan Kerja:</span>
                      <textarea 
                        className="w-full bg-[#020617] border border-white/10 rounded-xl p-3 text-[10px] text-white min-h-[80px] outline-none focus:border-blue-500/40"
                        placeholder="Ketik laporan Anda..."
                        value={inputs[item.id] ?? item.narasi ?? ""}
                        onChange={(e) => setInputs({...inputs, [item.id]: e.target.value})}
                      />
                    </div>
                    
                    <input type="file" id={`file-${item.id}`} className="hidden" onChange={(e) => setSelectedFiles({...selectedFiles, [item.id]: e.target.files[0]})} />
                    <label htmlFor={`file-${item.id}`} className="flex items-center justify-between p-2.5 bg-white/5 border border-dashed border-white/10 rounded-xl cursor-pointer text-[8px] hover:bg-white/10">
                      <span className="truncate max-w-[120px] text-slate-400">{selectedFiles[item.id]?.name || "Upload File Hasil"}</span>
                      <Upload size={12} className="text-blue-500"/>
                    </label>

                    <div className="flex gap-1.5 pt-1">
                      {editingId === item.id && (
                        <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-white/5 rounded-lg text-[8px] font-bold uppercase">Batal</button>
                      )}
                      <button onClick={() => handleUpdateExecution(item)} disabled={loading} className="flex-[2] py-2 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-blue-500 transition-all">
                        {loading ? <Loader2 className="animate-spin" size={12}/> : <Send size={12}/>} KIRIM
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#020617] rounded-xl border border-white/5">
                      <span className="text-[7px] font-bold text-blue-500 uppercase block mb-0.5">Laporan Anda:</span>
                      <p className="text-[9px] text-slate-300 italic leading-snug">"{item.narasi || '...'}"</p>
                    </div>

                    {item.ctt_koreksi && (
                      <div className="p-2 bg-orange-500/5 border border-orange-500/10 rounded-lg text-[8px] text-orange-400 flex items-center gap-1.5">
                        <AlertCircle size={10}/> {item.ctt_koreksi}
                      </div>
                    )}
                    
                    <div className="flex gap-1.5">
                      {item.link_drive && (
                        <button onClick={() => window.open(item.link_drive, '_blank')} className="flex-1 py-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-[8px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-600 hover:text-white transition-all">
                          <Eye size={12}/> PREVIEW
                        </button>
                      )}
                      
                      {item.status === 'Submitted' && (
                        <>
                          <button onClick={() => setEditingId(item.id)} className="px-3 py-2 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"><Edit3 size={12}/></button>
                          <button onClick={() => handleDeleteSubmission(item)} disabled={loading} className="px-3 py-2 bg-red-500/5 border border-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all">
                            {loading ? <Loader2 size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}