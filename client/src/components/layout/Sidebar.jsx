import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Cpu, List, Building2, LogOut, Menu, X, 
  Activity, IndianRupee, Bell, Settings, BarChart3, Grid3X3, 
  Users, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navMap = {
  flat_owner: [
    { to: '/flat', label: 'My Dashboard', icon: LayoutDashboard, end: true },
    { to: '/flat/bills', label: 'My Bills', icon: IndianRupee },
    { to: '/flat/alerts', label: 'Alerts', icon: Bell },
    { to: '/flat/settings', label: 'Settings', icon: Settings }
  ],
  society_admin: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/heatmap', label: 'Heatmap', icon: Grid3X3 },
    { to: '/admin/alerts', label: 'Alerts', icon: Bell },
    { to: '/admin/devices', label: 'Devices', icon: Cpu },
    { to: '/admin/flats', label: 'Residents', icon: Users },
    { to: '/admin/billing', label: 'Billing', icon: IndianRupee },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ],
  builder_admin: [
    { to: '/builder', label: 'Portfolio Analytics', icon: Building2, end: true }
  ]
};

export default function Sidebar() {
  const { user, logout, switchRole } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const nav = navMap[user?.role] || [];
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A1';

  const displayUser = {
    name: user?.name,
    email: user?.email,
    initials: user?.role === 'society_admin' ? 'RK' : 
              user?.role === 'builder_admin' ? 'SM' : 
              initials
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const roleLabel = {
    flat_owner: 'Flat Owner',
    society_admin: 'Society Admin',
    builder_admin: 'Builder Admin'
  }[user?.role] || 'User';

  const renderContent = () => (
    <div className={`flex flex-col h-full bg-[#020617] border-r border-white/5 shadow-2xl font-sans transition-all duration-500 ${isCollapsed ? 'w-20' : 'w-full'}`}>
      {/* Brand Identity - AmpereOne */}
      <div className={`flex items-center gap-4 py-10 mb-2 transition-all duration-500 ${isCollapsed ? 'px-5 justify-center' : 'px-8'}`}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          <span className="text-white font-bold text-[15px] italic tracking-tighter">A1</span>
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in duration-500">
            <span className="font-bold text-[20px] text-white tracking-tight leading-none">AmpereOne</span>
            <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-1">IoT Intelligence System</span>
          </div>
        )}
      </div>

      {/* Role Indicator */}
      {!isCollapsed && (
        <div className="px-8 mb-8 animate-in fade-in duration-500">
          <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg inline-block">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
              {roleLabel} Console
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className={`flex-1 space-y-1.5 overflow-y-auto ${isCollapsed ? 'px-3' : 'px-5'}`}>
        {!isCollapsed && <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-4 animate-in fade-in duration-500">Core Infrastructure</p>}
        {nav.map((item) => {
          const IconComp = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 py-3 rounded-xl text-[14px] font-medium transition-all duration-300 group
                 ${isCollapsed ? 'px-0 justify-center' : 'px-4'}
                 ${isActive
                   ? 'text-indigo-400 bg-indigo-600/10 border border-indigo-600/10'
                   : 'text-slate-500 hover:text-white hover:bg-white/5'
                 }`
              }
              title={isCollapsed ? item.label : ''}
            >
              <IconComp size={18} className="shrink-0 transition-transform group-hover:scale-110" />
              {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Main Navigation */}

      {/* User Session */}
      <div className={`pb-10 pt-8 border-t border-white/5 bg-[#0F172A]/20 ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex items-center gap-3.5 mb-4 bg-white/5 border border-white/5 rounded-[22px] group transition-all duration-500 ${isCollapsed ? 'p-2 justify-center' : 'px-4 py-4'}`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-gradient-to-tr from-indigo-500 to-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-transform group-hover:scale-110">
            {displayUser.initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-in fade-in duration-500">
              <div className="text-[13px] font-bold text-white truncate">{displayUser.name}</div>
              <div className="text-[11px] text-slate-500 truncate font-medium">{displayUser.email}</div>
            </div>
          )}
        </div>
        <button onClick={handleLogout}
          title="Log Out"
          className={`flex items-center gap-3.5 w-full py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all text-slate-500 hover:text-rose-400 hover:bg-rose-400/5 text-left active:scale-95 ${isCollapsed ? 'justify-center' : 'px-5'}`}>
          <LogOut size={16} className="shrink-0" />
          {!isCollapsed && <span className="animate-in fade-in duration-300">Log Out</span>}
        </button>
      </div>

      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-[#020617] shadow-lg border border-white/10 hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );

  return (
    <>
      <div className={`hidden md:flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-500 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}>
        {renderContent()}
      </div>

      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-6 right-6 z-50 w-12 h-12 rounded-2xl flex items-center justify-center bg-[#020617] border border-white/10 shadow-2xl">
        <Menu size={20} className="text-white" />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-500">
          <div className="relative w-72 h-full shadow-2xl animate-in slide-in-from-left duration-700">
            <button onClick={() => setMobileOpen(false)} className="absolute top-6 -right-14 w-10 h-10 flex items-center justify-center text-white bg-black/20 backdrop-blur-md rounded-full">
              <X size={24} />
            </button>
            {renderContent()}
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
}
