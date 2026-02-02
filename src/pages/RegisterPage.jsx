import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  UserCog, Search, RefreshCw, Camera, 
  Upload, Eye, EyeOff, ChevronDown, 
  Edit3, Trash2, User, ShieldCheck, Lock, KeyRound,
  Users, Loader2
} from 'lucide-react';

export default function RegisterPage({ userRole: propRole }) {
  const [profiles, setProfiles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeRole, setActiveRole] = useState(propRole);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    id: null, nama: "", nip: "", email: "", password: "", 
    role: "Staff", skpd: "", atasan: "", avatarUrl: ""
  });

  // PROTEKSI: Cek apakah user adalah superadmin
  const isSuperAdmin = activeRole?.toLowerCase() === 'superadmin';

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // Sync role jika propRole belum masuk
        if (!activeRole) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile) setActiveRole(profile.role);
        }
      }
      const { data, error } = await supabase.from("profiles").select("*").order("full_name", { ascending: true });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) { console.error(err.message); }
    finally { setFetching(false); }
  }, [activeRole]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUploadAvatar = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('task-files').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, avatarUrl: data.publicUrl }));
    } catch (error) {
      alert("Gagal upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        full_name: formData.nama,
        nip: formData.nip,
        email: formData.email,
        avatar_url: formData.avatarUrl,
        updated_at: new Date().toISOString()
      };

      // Hanya Superadmin yang boleh merubah kolom-kolom ini
      if (isSuperAdmin) {
        payload.role = formData.role;
        payload.skpd = formData.skpd;
        payload.atasan = formData.atasan;
      }

      if (formData.id) {
        // UPDATE PROFILE
        const { error: upError } = await supabase.from("profiles").update(payload).eq("id", formData.id);
        if (upError) throw upError;

        // UPDATE PASSWORD (Jika diisi)
        if (formData.password && formData.id === currentUserId) {
          const { error: pwError } = await supabase.auth.updateUser({ password: formData.password });
          if (pwError) throw pwError;
        }
        alert("Pembaruan Berhasil!");
      } else {
        // REGISTER BARU
        const { data, error } = await supabase.auth.signUp({ 
          email: formData.email, 
          password: formData.password,
          options: { data: { full_name: formData.nama } }
        });
        if (error) throw error;
        
        // Simpan ke tabel profiles
        const { error: profileError } = await supabase.from("profiles").upsert({ 
          id: data.user.id, 
          ...payload,
          role: formData.role || 'Staff' // Default role
        });
        if (profileError) throw profileError;

        alert("Pendaftaran Berhasil!");
      }
      
      setFormData({ id: null, nama: "", nip: "", email: "", password: "", role: "Staff", skpd: "", atasan: "", avatarUrl: "" });
      fetchData();
    } catch (err) { alert("Error: " + err.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 animate-in fade-in duration-700 min-h-screen bg-[#020617]">
      {/* HEADER TETAP SAMA */}
      <header className="flex justify-between items-center mb-6 bg-[#0c1225] p-4 rounded-[1.5rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
            <UserCog size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest text-white">Manajemen Akun</h1>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">
              Otoritas: <span className="text-blue-500">{activeRole || 'Checking...'}</span>
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 bg-slate-800/50 hover:bg-blue-600/20 rounded-lg border border-white/5 transition-all">
          <RefreshCw size={16} className={fetching ? 'animate-spin text-blue-500' : 'text-slate-400'} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM REGISTER */}
        <section className="lg:col-span-4 bg-[#0c1225] border border-white/5 rounded-[2.5rem] p-7 shadow-2xl h-fit">
          <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
            <ShieldCheck size={14} />
            {formData.id ? "Edit Profil Pegawai" : "Registrasi Pegawai Baru"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* AVATAR UPLOAD */}
            <div className="flex justify-center mb-6">
              <div onClick={() => fileInputRef.current.click()} className="relative group w-20 h-20 cursor-pointer active:scale-90 transition-transform">
                <div className={`w-full h-full rounded-3xl bg-slate-900 border-2 flex items-center justify-center overflow-hidden transition-all ${formData.avatarUrl ? 'border-emerald-500/50' : 'border-white/10 group-hover:border-blue-500'}`}>
                  {uploading ? <Loader2 size={24} className="text-blue-500 animate-spin" /> : 
                   formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : 
                   <Camera size={24} className="text-slate-700 group-hover:text-blue-400" />}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-xl border-4 border-[#0c1225]">
                  <Upload size={12} className="text-white" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} accept="image/*" className="hidden" />
              </div>
            </div>

            {/* INPUT FIELD UMUM */}
            <div className="space-y-3">
              <input type="text" placeholder="Nama Lengkap" value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-[11px] font-bold text-white outline-none focus:border-blue-500 transition-all" required />
              <input type="text" placeholder="NIP Pegawai" value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-[11px] font-bold text-white outline-none focus:border-blue-500 transition-all" required />
              <input type="email" placeholder="Alamat Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-[11px] font-bold text-white outline-none focus:border-blue-500 transition-all" required />

              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder={formData.id ? "Password (Biarkan kosong jika tidak ganti)" : "Password Baru"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-xl pl-5 pr-12 py-3 text-[11px] font-bold text-white outline-none focus:border-blue-500 transition-all" required={!formData.id} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-600 hover:text-white transition-colors">
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>

              {/* KHUSUS SUPERADMIN: ROLE & SKPD */}
              <div className={`space-y-3 pt-4 border-t border-white/5 ${!isSuperAdmin ? "opacity-40 pointer-events-none" : ""}`}>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                   {isSuperAdmin ? <ShieldCheck size={10} className="text-emerald-500" /> : <Lock size={10} />} Penugasan Jabatan
                </p>
                <input type="text" placeholder="Unit SKPD" value={formData.skpd} onChange={(e) => setFormData({...formData, skpd: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-[11px] font-bold text-white outline-none focus:border-blue-500" />
                
                <div className="relative">
                  <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-[#020617] border border-white/10 rounded-xl px-5 py-3 text-[11px] font-bold text-white appearance-none outline-none focus:border-blue-500">
                    <option value="superadmin">Superadmin</option>
                    <option value="Kabid">Kabid</option>
                    <option value="Kasubid">Kasubid</option>
                    <option value="Staff">Staff</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-3.5 text-slate-600 pointer-events-none" />
                </div>
              </div>
            </div>

            <button disabled={loading || uploading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white mt-4 shadow-xl active:scale-95 transition-all disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : formData.id ? "PERBARUI PEGAWAI" : "DAFTARKAN PEGAWAI"}
            </button>
          </form>
        </section>

        {/* DATABASE TABLE (TIDAK BERUBAH) */}
        <section className="lg:col-span-8 bg-[#0c1225] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em] flex items-center gap-2">
               <Users size={16} /> Direktori Pegawai
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-4 top-3 text-slate-600" />
              <input type="text" placeholder="Cari nama atau NIP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#020617] border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-[10px] font-bold text-white w-56 focus:w-72 transition-all outline-none" />
            </div>
          </div>

          <div className="p-6 overflow-x-auto">
             {/* Tabel tetap seperti sebelumnya karena sudah sangat futuristik */}
             <table className="w-full text-left border-separate border-spacing-y-3">
               {/* ... (isi tabel sama dengan kode asli Anda) ... */}
               {/* Saya telah memvalidasi isMine, canEdit, dan canDelete di dalam map Anda */}
               <tbody>
                {profiles.filter(p => p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.nip?.includes(searchQuery)).map((p) => {
                  const isMine = p.id === currentUserId;
                  const canEdit = isSuperAdmin || isMine;
                  const canDelete = isSuperAdmin && !isMine;
                  return (
                    <tr key={p.id} className="group">
                      <td className={`px-5 py-4 bg-[#020617]/50 rounded-l-2xl border-y border-l border-white/5 transition-all ${isMine ? 'border-l-blue-500' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 overflow-hidden shadow-lg">
                            {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="text-slate-700 m-auto mt-2" />}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-tight">{p.full_name}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">{p.nip}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 bg-[#020617]/50 border-y border-white/5 text-center">
                        <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase border ${p.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 bg-[#020617]/50 rounded-r-2xl border-y border-r border-white/5 text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && <button onClick={() => { setFormData({ ...p, id: p.id, nama: p.full_name, avatarUrl: p.avatar_url, password: "" }); window.scrollTo({top:0, behavior:'smooth'})}} className="p-2 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"><Edit3 size={14}/></button>}
                          {canDelete && <button onClick={async () => { if(confirm("Hapus akun?")) { await supabase.from("profiles").delete().eq("id", p.id); fetchData(); } }} className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={14}/></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
               </tbody>
             </table>
          </div>
        </section>
      </div>
    </div>
  );
}