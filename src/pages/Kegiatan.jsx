import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Plus, Edit2, Trash2, Save, X, MapPin, Search, Check, Loader2, Clock
} from 'lucide-react';

export default function InputKegiatan() {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    judul: '',
    lokasi: '',
    jam: '',
    deskripsi: ''
  });

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const fetchKegiatan = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kegiatan')
      .select('*')
      .order('tanggal', { ascending: false });
    if (!error) setKegiatan(data);
    setLoading(false);
  };

  const handleSave = async (id = null) => {
    if (!formData.judul) return alert("Nama kegiatan wajib diisi!");
    setIsSaving(true);
    
    try {
      // 1. Ambil data user yang sedang login
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("Sesi berakhir, silakan login kembali.");
      }

      // 2. Siapkan payload data
      const payload = {
        tanggal: formData.tanggal,
        judul: formData.judul,
        lokasi: formData.lokasi,
        jam: formData.jam || null,
        deskripsi: formData.deskripsi,
        // created_by diisi dengan ID user (hanya saat insert baru atau opsional saat update)
        created_by: user.id 
      };

      let result;
      if (id) {
        // Jika update, kita biasanya tidak mengubah created_by, tapi tetap disertakan jika perlu
        result = await supabase.from('kegiatan').update(payload).eq('id', id);
      } else {
        // Jika data baru (Insert)
        result = await supabase.from('kegiatan').insert([payload]);
      }

      if (result.error) throw result.error;
      
      cancelEdit();
      fetchKegiatan();
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setFormData({ 
      tanggal: item.tanggal,
      judul: item.judul,
      lokasi: item.lokasi,
      jam: item.jam || '',
      deskripsi: item.deskripsi
    });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditId(null);
    setIsAdding(false);
    setFormData({ 
      tanggal: new Date().toISOString().split('T')[0], 
      judul: '', 
      lokasi: '', 
      jam: '', 
      deskripsi: '' 
    });
  };

  const filteredData = kegiatan.filter(item => 
    (item.judul?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-screen bg-[#020617] p-4 md:p-6 text-white overflow-hidden">
      
      {/* Search & Add Button */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text"
            className="w-full bg-[#0c1225] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs outline-none focus:border-blue-500 transition-all"
            placeholder="Cari kegiatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setIsAdding(true); setEditId(null); }}
          disabled={isAdding || isSaving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
          <span className="hidden md:inline uppercase tracking-widest">Tambah</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-[#0c1225] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-slate-400 uppercase tracking-tighter font-bold">
                <th className="p-3 w-32">Tanggal</th>
                <th className="p-3 w-48">Kegiatan</th>
                <th className="p-3 w-40">Lokasi</th>
                <th className="p-3 w-24 text-blue-400">Jam</th>
                <th className="p-3 min-w-[200px]">Deskripsi</th>
                <th className="p-3 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              
              {/* Form Input Baru */}
              {isAdding && (
                <tr className="bg-blue-600/10 border-l-2 border-blue-500 animate-in fade-in duration-300">
                  <td className="p-2"><input type="date" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] [color-scheme:dark]" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} /></td>
                  <td className="p-2"><input type="text" placeholder="Kegiatan..." className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] outline-none" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} /></td>
                  <td className="p-2"><input type="text" placeholder="Lokasi..." className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] outline-none" value={formData.lokasi} onChange={e => setFormData({...formData, lokasi: e.target.value})} /></td>
                  <td className="p-2"><input type="time" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] [color-scheme:dark]" value={formData.jam} onChange={e => setFormData({...formData, jam: e.target.value})} /></td>
                  <td className="p-2"><textarea rows="1" placeholder="Deskripsi..." className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] outline-none resize-none" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} /></td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleSave()} disabled={isSaving} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors">{isSaving ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>}</button>
                      <button onClick={cancelEdit} className="p-1.5 bg-red-600 hover:bg-red-500 rounded-md transition-colors"><X size={14}/></button>
                    </div>
                  </td>
                </tr>
              )}

              {loading ? (
                <tr><td colSpan="6" className="p-10 text-center text-slate-500 animate-pulse uppercase tracking-widest text-[10px]">Memproses Data...</td></tr>
              ) : filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] group transition-colors">
                  {editId === item.id ? (
                    <>
                      <td className="p-2"><input type="date" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] [color-scheme:dark]" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} /></td>
                      <td className="p-2"><input type="text" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px]" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} /></td>
                      <td className="p-2"><input type="text" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px]" value={formData.lokasi} onChange={e => setFormData({...formData, lokasi: e.target.value})} /></td>
                      <td className="p-2"><input type="time" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] [color-scheme:dark]" value={formData.jam} onChange={e => setFormData({...formData, jam: e.target.value})} /></td>
                      <td className="p-2"><textarea rows="2" className="w-full bg-black/40 border border-white/10 rounded p-1.5 text-[11px] resize-none" value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} /></td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleSave(item.id)} className="p-1.5 bg-blue-600 rounded-md"><Save size={14}/></button>
                          <button onClick={cancelEdit} className="p-1.5 bg-white/10 rounded-md"><X size={14}/></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 text-slate-500 font-mono">{item.tanggal}</td>
                      <td className="p-3 font-semibold text-slate-200 uppercase tracking-tight">{item.judul}</td>
                      <td className="p-3 text-slate-400">
                        <div className="flex items-center gap-1.5"><MapPin size={10} className="text-emerald-500"/> {item.lokasi || '-'}</div>
                      </td>
                      <td className="p-3 text-blue-400 font-mono">
                        <div className="flex items-center gap-1.5"><Clock size={10}/> {item.jam || '--:--'}</div>
                      </td>
                      <td className="p-3">
                        <p className="line-clamp-1 group-hover:line-clamp-none text-slate-400 transition-all duration-300">
                          {item.deskripsi || '-'}
                        </p>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item)} className="text-slate-500 hover:text-blue-400 transition-colors"><Edit2 size={14}/></button>
                          <button onClick={async () => { if(confirm('Hapus laporan ini?')) { await supabase.from('kegiatan').delete().eq('id', item.id); fetchKegiatan(); } }} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}