import { useState, useEffect, useCallback } from 'react';
import { 
  Building2, MapPin, Hash, QrCode, Copy, RefreshCw, 
  ShieldCheck, AlertTriangle, KeyRound, Save, X,
  Globe, LayoutDashboard, Smartphone, Bell, HeartPulse
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

export default function AdminSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    city: '',
    address: '',
    pincode: '',
    societyCode: '',
    inviteOnlyMode: false,
    alertThresholds: {
      monthlyLimitUnits: 900,
      escalationHours: 24
    }
  });

  const socId = user?.societyId?._id || user?.societyId;

  const fetchSettings = useCallback(async () => {
    if (!socId) return;
    try {
      const res = await api.get(`/societies/${socId}/settings`);
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('[SETTINGS_FETCH_ERROR]', err);
      toast.error('Failed to synchronize grid configuration');
    } finally {
      setLoading(false);
    }
  }, [socId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!socId) return;
    setSaving(true);
    try {
      const res = await api.put(`/societies/${socId}/settings`, settings);
      if (res.data.success) {
        toast.success('Grid parameters synchronized ✓');
      }
    } catch (err) {
      console.error('[SETTINGS_SAVE_ERROR]', err);
      toast.error('Sync failed: Check network connectivity');
    } finally {
      setSaving(false);
    }
  };

  const handleRotate = async () => {
     if (!window.confirm('CRITICAL ACTION: Rotating the society code will invalidate the previous access token immediately. Proceed?')) return;
     
     const tid = toast.loading('Regenerating security nodes...');
     try {
       const res = await api.patch(`/societies/${socId}/rotate-code`);
       if (res.data.success) {
         setSettings(prev => ({ ...prev, societyCode: res.data.code }));
         toast.success('Security protocol rotated successfully', { id: tid });
       }
     } catch (err) {
       console.error('[ROTATE_ERROR]', err);
       toast.error('Rotation sequence failed', { id: tid });
     }
  };

  const copyToClipboard = () => {
    if (!settings.societyCode) return;
    navigator.clipboard.writeText(settings.societyCode);
    toast.success('Security code cached to clipboard');
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${settings.societyCode || 'AMPEREONE'}`;

  if (loading) return (
    <Layout>
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-12">
         <RefreshCw size={40} className="text-indigo-500 animate-spin mb-4" />
         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Calibrating Management Node...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="bg-[#020617] min-h-screen text-slate-300 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto py-12 px-6 relative z-10">
          
          {/* Header */}
          <div className="mb-16 page-enter">
            <Badge status="green">Infrastructure Phase 1</Badge>
            <h1 className="text-[42px] font-semibold text-white tracking-tighter leading-tight mt-6">Society Control Center</h1>
            <p className="text-slate-500 text-[16px] font-medium mt-3 tracking-tight max-w-xl">
               Configure core identity parameters, security access signaling, and operational anomaly thresholds for the society's smart grid.
            </p>
          </div>

          <div className="space-y-12 pb-32">
            
            {/* Identity Group */}
            <section className="bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 md:p-12 backdrop-blur-md shadow-2xl relative overflow-hidden page-enter delay-100">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                     <Building2 size={20} />
                  </div>
                  <h2 className="text-[18px] font-semibold text-white tracking-tight">Core Infrastructure Identity</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Society Designation</label>
                    <input 
                      type="text" 
                      value={settings.name} 
                      onChange={e => setSettings({...settings, name: e.target.value})}
                      placeholder="e.g. Green Valley Premiere"
                      className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-[14px] font-medium text-white outline-none focus:border-indigo-500/30 focus:bg-slate-900 transition-all placeholder:text-slate-700" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Jurisdiction City</label>
                    <input 
                      type="text" 
                      value={settings.city} 
                      onChange={e => setSettings({...settings, city: e.target.value})}
                      placeholder="City Name"
                      className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-[14px] font-medium text-white outline-none focus:border-indigo-500/30 focus:bg-slate-900 transition-all placeholder:text-slate-700" 
                    />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Operational Physical Address</label>
                    <input 
                      type="text" 
                      value={settings.address} 
                      onChange={e => setSettings({...settings, address: e.target.value})}
                      placeholder="Full society address"
                      className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl text-[14px] font-medium text-white outline-none focus:border-indigo-500/30 focus:bg-slate-900 transition-all placeholder:text-slate-700" 
                    />
                  </div>
               </div>
            </section>

            {/* Security Group */}
            <section className="bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 md:p-12 backdrop-blur-md shadow-2xl relative overflow-hidden page-enter delay-200">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none -mr-32 -mt-32" />
               
               <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                     <KeyRound size={20} />
                  </div>
                  <h2 className="text-[18px] font-semibold text-white tracking-tight">Access Signaling & Security</h2>
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
                  <div className="p-8 bg-slate-900/60 border border-white/5 rounded-[32px] flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">Current Access Symbol</p>
                      <h3 className="text-[42px] font-black tracking-[0.3em] text-white leading-none mb-6 tabular-nums">{settings.societyCode || '------'}</h3>
                      <div className="flex items-center gap-3 w-full">
                         <button onClick={copyToClipboard} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[11px] font-semibold uppercase tracking-widest text-white transition-all transition-all">
                            Copy Code
                         </button>
                         <button onClick={() => setShowQR(true)} className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white transition-all">
                            <QrCode size={18} />
                         </button>
                      </div>
                  </div>

                  <div className="flex flex-col gap-4">
                      <button onClick={handleRotate} className="group p-8 bg-amber-500/5 border border-amber-500/10 hover:border-amber-500/30 rounded-[32px] text-left transition-all">
                         <div className="flex items-center justify-between mb-3">
                            <RefreshCw size={22} className="text-amber-500 group-hover:rotate-180 transition-transform duration-700" />
                            <Badge status="amber">Rotational</Badge>
                         </div>
                         <h4 className="text-[16px] font-semibold text-white tracking-tight">Rotate Security Node</h4>
                         <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">Instantly invalidate current code. Recommended every billing cycle for maximum security.</p>
                      </button>

                      <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[32px] flex items-center justify-between">
                         <div>
                            <p className="text-[15px] font-semibold text-white tracking-tight">Invite-Only Shield</p>
                            <p className="text-[11px] text-slate-500 mt-1 font-medium">Auto-reject new onboarding requests</p>
                         </div>
                         <button 
                           onClick={() => setSettings({...settings, inviteOnlyMode: !settings.inviteOnlyMode})}
                           className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${settings.inviteOnlyMode ? 'bg-indigo-500' : 'bg-white/10'}`}
                         >
                           <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${settings.inviteOnlyMode ? 'translate-x-6' : 'translate-x-0'}`} />
                         </button>
                      </div>
                  </div>
               </div>
            </section>

            {/* Thresholds Group */}
            <section className="bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 md:p-12 backdrop-blur-md shadow-2xl relative overflow-hidden page-enter delay-300">
               <div className="flex items-center gap-4 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                     <AlertTriangle size={20} />
                  </div>
                  <h2 className="text-[18px] font-semibold text-white tracking-tight">Autonomous Anomaly Thresholds</h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Consumption Ceiling (Limit / Month)</label>
                    <div className="relative">
                       <input 
                         type="number" 
                         value={settings.alertThresholds.monthlyLimitUnits} 
                         onChange={e => setSettings({...settings, alertThresholds: {...settings.alertThresholds, monthlyLimitUnits: parseInt(e.target.value)}})}
                         className="w-full px-6 py-5 bg-slate-900/50 border border-white/5 rounded-2xl text-[18px] font-bold text-white outline-none focus:border-emerald-500/30 transition-all" 
                       />
                       <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-600 uppercase tracking-widest">kWh Units</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Infrastructure Response Latency</label>
                    <div className="flex gap-3 h-[68px]">
                      {[6, 12, 24, 48].map(h => (
                        <button 
                          key={h} 
                          onClick={() => setSettings({...settings, alertThresholds: {...settings.alertThresholds, escalationHours: h}})}
                          className={`flex-1 flex flex-col items-center justify-center rounded-2xl text-[12px] font-bold transition-all border ${settings.alertThresholds.escalationHours === h ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/20'}`}>
                           <span>{h}h</span>
                           <span className="text-[8px] uppercase tracking-tighter opacity-50">Delay</span>
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
            </section>
          </div>

          {/* Persistent Action Bar */}
          <div className="fixed bottom-10 right-10 z-[60] flex items-center gap-4">
             <button 
               onClick={handleSave} 
               disabled={saving}
               className="flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] text-[13px] font-bold uppercase tracking-[0.1em] shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all active:scale-95 disabled:opacity-50"
             >
                {saving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                {saving ? 'Synchronizing...' : 'Apply Grid Parameters'}
             </button>
          </div>

          {/* QR Modal Overhaul */}
          {showQR && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowQR(false)} />
               <div className="relative w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-[44px] p-10 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500" />
                  
                  <button onClick={() => setShowQR(false)} className="absolute top-8 right-8 p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all">
                    <X size={18} />
                  </button>

                  <div className="mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mx-auto mb-6">
                       <Smartphone size={32} />
                    </div>
                    <h3 className="text-[22px] font-semibold text-white tracking-tight">Resident Gate</h3>
                    <p className="text-[12px] text-slate-500 font-medium mt-2 leading-relaxed">Awaiting scanning for society: <span className="text-white font-bold">{settings.name}</span></p>
                  </div>

                  <div className="p-8 bg-white rounded-[32px] mb-8 shadow-[0_0_60px_rgba(255,255,255,0.05)]">
                     <img src={qrUrl} alt="Society QR Access Node" className="w-full aspect-square" />
                  </div>

                  <div className="bg-slate-900/60 border border-white/5 px-8 py-5 rounded-2xl w-full">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] block mb-2">Manual Access Code</span>
                    <span className="text-[28px] font-black tracking-[0.4em] text-white tabular-nums">{settings.societyCode}</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
