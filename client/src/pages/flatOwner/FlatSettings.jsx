import { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Home, Bell, Zap, Receipt, FileText, Trash2, Save, Check, ShieldAlert, AlertTriangle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';

export default function FlatSettings() {
  const { user, updateUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [profile, setProfile] = useState({
    name: user?.name || 'Priya Sharma',
    email: user?.email || 'priya@voltwise.app',
    phone: user?.phone || '+91 98765 43210',
    flat: user?.flatId?.flatNumber ? `${user.flatId.flatNumber} · Sunrise Heights` : 'B-204 · Sunrise Heights'
  });

  const [spending, setSpending] = useState({
    limit: 900,
    earlyWarning: true
  });

  const [notifs, setNotifs] = useState({
    threshold: { inApp: true, email: true, sms: false },
    spike: { inApp: true, email: true, sms: false },
    bill: { inApp: true, email: true, sms: false },
    summary: { inApp: true, email: false, sms: false }
  });

  const handleSave = async () => {
    setIsSaving(true);
    const t = toast.loading('Syncing changes with grid...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update global store
    if (updateUser) {
      updateUser({ 
        name: profile.name, 
        email: profile.email,
        phone: profile.phone 
      });
    }

    toast.success('Preferences updated successfully', { id: t });
    setIsSaving(false);
  };

  const handleToggleEarlyWarning = () => {
    setSpending(prev => ({ ...prev, earlyWarning: !prev.earlyWarning }));
  };

  const toggleNotif = (category, channel) => {
    if (channel === 'sms') return; // SMS is "Coming soon"
    setNotifs(prev => ({
      ...prev,
      [category]: { ...prev[category], [channel]: !prev[category][channel] }
    }));
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 pb-32 animate-in fade-in duration-700 bg-[#020617] min-h-screen font-sans">
        
        {/* Header */}
        <header className="mb-8 sm:mb-12">
          <h1 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">Settings</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-3 tracking-tight">
            Manage your account and alert preferences
          </p>
        </header>

        <div className="space-y-10">
          
          {/* Profile Section */}
          <section className="bg-[#0F172A]/40 border border-white/5 p-5 sm:p-8 rounded-[24px]">
            <h2 className="text-[18px] font-bold text-white mb-8 tracking-tight">Profile</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-white/5 rounded-xl text-[14px] font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-white/5 rounded-xl text-[14px] font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  />
                </div>
                <p className="text-[11px] text-slate-600 font-medium ml-1">
                  We'll send a verification link to your new email before updating.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-white/5 rounded-xl text-[14px] font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest ml-1">Flat</label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                  <input 
                    type="text" 
                    value={profile.flat}
                    disabled
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-white/5 rounded-xl text-[14px] font-bold text-slate-600 cursor-not-allowed" 
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Monthly Limit Section */}
          <section className="bg-[#0F172A]/40 border border-white/5 p-5 sm:p-8 rounded-[24px]">
            <h2 className="text-[18px] font-bold text-white mb-6 tracking-tight">Alert me when I reach (units/month)</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
              <input 
                type="number" 
                value={spending.limit}
                onChange={(e) => setSpending(prev => ({ ...prev, limit: parseInt(e.target.value) || 0 }))}
                className="w-full sm:w-32 px-5 py-4 bg-slate-900 border border-white/5 rounded-xl text-[18px] font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all text-center" 
              />
              <p className="text-[14px] text-slate-500 font-medium">
                Typical 2BHK uses 600–900 units/month
              </p>
            </div>

            <div className={`p-4 sm:p-6 rounded-2xl border transition-all flex items-center justify-between
              ${spending.earlyWarning ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-900/40 border-white/5 opacity-60'}`}>
              <div className="pr-4">
                <h4 className="text-[16px] font-bold text-white mb-1">80% early warning</h4>
                <p className="text-[13px] text-slate-500 font-medium leading-tight">Get an alert at {Math.round(spending.limit * 0.8)} units</p>
              </div>
              <button 
                onClick={handleToggleEarlyWarning}
                className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 shrink-0
                  ${spending.earlyWarning ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${spending.earlyWarning ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            <p className="mt-8 text-[11px] text-slate-600 font-medium">
              Last updated 10 Apr · Previously 900 units
            </p>
          </section>

          {/* Notification Preferences */}
          <section className="bg-[#0F172A]/40 border border-white/5 p-5 sm:p-8 rounded-[24px]">
            <h2 className="text-[18px] font-bold text-white mb-8 tracking-tight">How you want to be notified</h2>
            
            <div className="space-y-4">
              {[
                { id: 'threshold', label: 'Threshold alerts' },
                { id: 'spike', label: 'Spike alerts' },
                { id: 'bill', label: 'Bill reminders' },
                { id: 'summary', label: 'Weekly summary' }
              ].map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-white/5 gap-6 group hover:border-white/10 transition-all">
                  <span className="text-[15px] font-bold text-white group-hover:text-indigo-200 transition-colors">{item.label}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-500/20">
                      In-app · Always on
                    </span>
                    <button 
                      onClick={() => toggleNotif(item.id, 'email')}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all
                        ${notifs[item.id].email 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-600 border-white/5'}`}
                    >
                      Email {notifs[item.id].email ? '✓' : '—'}
                    </button>
                    <span className="px-3 py-1 bg-slate-800 text-slate-700 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/5 cursor-not-allowed hidden sm:block">
                      SMS · Coming soon
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-[15px] font-bold text-white mb-1">Quiet hours</h4>
                <p className="text-[12px] text-slate-600 font-medium">Critical alerts like bill overruns will still come through.</p>
              </div>
              <span className="text-[14px] font-bold text-slate-400 tracking-tight">11 PM — 7 AM</span>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-rose-500/5 border border-rose-500/10 p-8 rounded-[24px]">
            <h2 className="text-[18px] font-bold text-rose-500 mb-6 tracking-tight">Danger zone</h2>
            <button className="px-6 py-3 bg-transparent border border-rose-500/20 text-rose-500 text-[14px] font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all mb-4">
              Delete my account
            </button>
            <p className="text-[12px] text-rose-500/60 font-medium tracking-tight">
              This will permanently remove your account and personal data within 30 days.
            </p>
          </section>

          {/* Save Button */}
          <div className="pt-10 flex justify-center sm:justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-10 py-5 bg-emerald-500 text-[#020617] text-[16px] font-bold rounded-[22px] shadow-[0_10px_30px_rgba(16,185,129,0.2)] hover:bg-emerald-400 hover:shadow-[0_15px_40px_rgba(16,185,129,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              <Save size={20} />
              {isSaving ? 'Syncing...' : 'Save changes'}
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
