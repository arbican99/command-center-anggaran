import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Layout & Pages
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login'; 
import Dashboard from './pages/Dashboard';
import RegisterPage from './pages/RegisterPage'; 
import TaskPage from './pages/TaskPage';
import TaskExecution from './pages/TaskExecution';
import TaskApprovalPage from './pages/TaskApprovalPage'; 
import Kegiatan from './pages/Kegiatan'; // Pastikan file ini ada di folder pages

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState({ role: null, name: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) getProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        getProfile(session.user.id);
      } else {
        setUserProfile({ role: null, name: null });
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', userId) // PERBAIKAN: Tambahkan tanda kutip pada 'id'
        .single();
      
      if (error) throw error;
      if (data) setUserProfile({ role: data.role, name: data.full_name });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="tracking-[0.3em] font-black text-xs uppercase animate-pulse">Menghubungkan ke Sistem...</p>
      </div>
    );
  }

  // Logika Hak Akses
  const isAtasan = ['superadmin', 'Admin', 'Pimpinan', 'Kabid', 'Kasubid'].includes(userProfile.role);
  const isSuper = ['superadmin', 'Admin'].includes(userProfile.role);

  return (
    <Router>
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/*" element={
            <MainLayout userRole={userProfile.role} onLogout={() => supabase.auth.signOut()}>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* MENU MANAJEMEN USER */}
                <Route 
                  path="/users" 
                  element={isSuper ? <RegisterPage /> : <Navigate to="/dashboard" replace />} 
                />

                {/* PEMBUATAN TUGAS */}
                <Route 
                  path="/tasks" 
                  element={isAtasan ? <TaskPage userRole={userProfile.role} userName={userProfile.name} /> : <Navigate to="/dashboard" replace />} 
                />
                
                {/* PEMERIKSAAN TUGAS */}
                <Route 
                  path="/approval" 
                  element={isAtasan ? <TaskApprovalPage /> : <Navigate to="/dashboard" replace />} 
                />

                {/* PENGERJAAN TUGAS */}
                <Route path="/dojob" element={<TaskExecution userRole={userProfile.role} userName={userProfile.name} />} />
                
                {/* DAFTAR KEGIATAN (Halaman Baru) */}
                <Route path="/giat" element={<Kegiatan />} />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          } />
        )}
      </Routes>
    </Router>
  );
}

export default App;