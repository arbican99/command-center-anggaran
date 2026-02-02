// src/constants/menu.js
import { 
  LayoutDashboard, 
  Users, 
  PencilLine, 
  Target, 
  FileBarChart 
} from 'lucide-react';

export const MENU_ITEMS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/dashboard', 
    roles: ['pimpinan', 'kabid', 'kasubid', 'team'] 
  },
  { 
    id: 'users', 
    label: 'Management User', 
    icon: Users, 
    path: '/users', 
    roles: ['pimpinan', 'kabid'] 
  },
  { 
    id: 'input', 
    label: 'Input Kegiatan', 
    icon: PencilLine, 
    path: '/input-kegiatan', 
    roles: ['kabid', 'kasubid'] 
  },
  { 
    id: 'penugasan', 
    label: 'Penugasan', 
    icon: Target, 
    path: '/penugasan', 
    roles: ['kabid', 'kasubid'] 
  },
  { 
    id: 'pelaporan', 
    label: 'Pelaporan', 
    icon: FileBarChart, 
    path: '/pelaporan', 
    roles: ['pimpinan', 'kabid', 'kasubid', 'team'] 
  },
];