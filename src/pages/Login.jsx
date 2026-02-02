import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import logo from '../assets/logokj2.png';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Bisa Full Name atau Email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      let finalEmail = identifier;

      // Logika: Jika input tidak mengandung '@', anggap itu Nama Lengkap
      if (!identifier.includes('@')) {
        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('email')
          .ilike('full_name', identifier)
          .single();
        
        if (pError || !profile) throw new Error('Nama tersebut tidak terdaftar.');
        finalEmail = profile.email;
      }

      // Login ke Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: password,
      });

      if (authError) throw authError;

    } catch (error) {
      setErrorMsg(error.message || 'Kredensial salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      {/* Card Kecil & Futuristik */}
      <div className="max-w-[340px] w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Dekorasi Cahaya di Background */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/20 blur-[50px] rounded-full"></div>
        
        <div className="text-center mb-6 relative">
          <img src={logo} alt="Logo" className="w-40 h-12 mx-auto mb-3 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <h2 className="text-lg font-bold text-white tracking-widest uppercase">Bidang Anggaran BKAD</h2>
          <p className="text-[9px] font-bold text-yellow-400 font-bold tracking-widest">Command Center Penugasan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative">
          {errorMsg && (
            <div className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-1">Nama / Email</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none transition-all text-xs text-white placeholder:text-slate-300"
              placeholder="Nama Lengkap / Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-300 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 outline-none transition-all text-xs text-white placeholder:text-slate-600"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400"
              >
                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50 text-[11px] uppercase tracking-widest mt-2"
          >
            {loading ? "Verifying..." : "L O G I N"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-4">
          <p className="text-[8px] text-slate-600 font-medium tracking-[0.3em] uppercase">
            Login Session
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
