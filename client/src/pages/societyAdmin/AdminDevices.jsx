import { useState, useEffect } from 'react';
import { Cpu, Plus, Trash2, Wifi, WifiOff, X, Search, Activity, AlertTriangle, CloudOff, CheckCircle2, MapPin } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { usePoll } from '../../hooks/usePoll';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminDevices() {
  const { user } = useAuthStore();
  const [devices, setDevices] = useState([]);
  const [allFlats, setAllFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    deviceSerial: '',
    deviceType: 'Flat Meter',
    mappedFlatId: '',
    mappedCommonAreaId: ''
  });

  const socId = user.societyId?._id || user.societyId;

  // Fetch all flats once for the registration dropdown
  useEffect(() => {
    const fetchFlats = async () => {
      try {
        const res = await api.get(`/societies/${socId}/flats`);
        setAllFlats(res.data.data || res.data);
      } catch (err) {
        console.error('Failed to fetch flats:', err);
      }
    };
    if (socId) fetchFlats();
  }, [socId]);

  usePoll(async () => {
    try {
      const res = await api.get(`/societies/${socId}/devices`);
      setDevices(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, 30000, [socId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This meter will stop reporting. Historical data will be preserved.')) return;
    try {
      await api.delete(`/devices/${id}`);
      toast.success('Meter deregistered successfully');
      setDevices(prev => prev.filter(d => d._id !== id));
    } catch (err) { toast.error(err.message); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.deviceSerial || !formData.mappedFlatId) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/devices', formData);
      toast.success('Meter registered! ✓');
      const res = await api.get(`/societies/${socId}/devices`);
      setDevices(res.data);
      setShowForm(false);
      setFormData({ deviceSerial: '', deviceType: 'Flat Meter', mappedFlatId: '', mappedCommonAreaId: '' });
    } catch (err) { 
        toast.error(err.message || 'Registration failed'); 
    } finally { 
        setSubmitting(false); 
    }
  };

  const deviceStats = [
    { label: 'Online', value: devices.filter(d => d.status === 'Live').length, color: 'text-emerald-400', icon: Wifi, glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]' },
    { label: 'Offline', value: devices.filter(d => d.status === 'Offline' || d.status === 'Registered').length, color: 'text-slate-500', icon: CloudOff, glow: '' },
    { label: 'Intermittent', value: devices.filter(d => d.status === 'Intermittent').length, color: 'text-amber-400', icon: AlertTriangle, glow: 'shadow-[0_0_20px_rgba(251,191,36,0.1)]' }
  ];

  const filteredDevices = devices.filter(d => 
    d.deviceSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.mappedFlatId?.flatNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans page-enter relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">Telemetry infrastructure</h1>
              <p className="text-slate-500 text-[14px] font-medium mt-3 tracking-tight">
                {devices.length} active nodes · All systems operating within normal parameters
              </p>
            </div>
            <button 
              onClick={() => setShowForm(true)} 
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center gap-3"
            >
              <Plus size={18} strokeWidth={3} /> Register meter
            </button>
          </header>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {deviceStats.map((stat, i) => (
              <div key={i} className={`bg-[#0F172A]/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-sm shadow-2xl transition-all hover:border-white/10 group ${stat.glow}`}>
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">{stat.label} Nodes</p>
                        <h3 className={`text-4xl font-bold tracking-tighter ${stat.color}`}>{stat.value}</h3>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110 ${stat.color}`}>
                        <stat.icon size={20} />
                    </div>
                 </div>
              </div>
            ))}
          </div>

          {/* List Section */}
          <div className="bg-[#0F172A]/40 border border-white/5 rounded-[32px] shadow-2xl backdrop-blur-sm overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
               <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Device ID or Flat..." 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-900/50 border border-white/5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-white font-medium placeholder:text-slate-600"
                  />
               </div>
               <div className="flex items-center gap-4 text-slate-500 text-[12px] font-bold">
                  <Activity size={14} className="text-emerald-400" /> SYSTEM STATUS: NOMINAL
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Device Identity</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Unit Mapping</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Telemetry Status</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Current Load</th>
                    <th className="px-8 py-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-8 h-16 bg-white/2" />
                      </tr>
                    ))
                  ) : filteredDevices.length === 0 ? (
                    <tr>
                       <td colSpan={5} className="py-24 text-center">
                          <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-6 text-slate-700">
                             <CloudOff size={24} />
                          </div>
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching nodes found</p>
                       </td>
                    </tr>
                  ) : (
                    filteredDevices.map(device => (
                      <tr key={device._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-7">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 text-slate-500">
                                <Cpu size={16} />
                            </div>
                            <span className="text-[14px] font-bold text-white tracking-tight tabular uppercase">{device.deviceSerial}</span>
                          </div>
                        </td>
                        <td className="px-8 py-7">
                            <div className="flex items-center gap-3">
                                <MapPin size={14} className="text-indigo-400" />
                                <span className="text-[14px] font-bold text-slate-400">
                                    {device.mappedFlatId?.flatNumber || device.mappedCommonAreaId?.name || 'UNMAPPED'}
                                </span>
                            </div>
                        </td>
                        <td className="px-8 py-7">
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${device.status === 'Live' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse' : 'bg-slate-600'}`} />
                              <span className={`text-[11px] font-bold uppercase tracking-widest ${device.status === 'Live' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {device.status === 'Live' ? 'Active Signal' : 'Connection Lost'}
                              </span>
                           </div>
                        </td>
                        <td className="px-8 py-7">
                          <span className="text-[15px] font-bold text-white tabular">
                            {device.currentLoad || '0.00'} <span className="text-[10px] text-slate-500 ml-1 font-bold">kW</span>
                          </span>
                        </td>
                        <td className="px-8 py-7 text-right">
                           <button 
                             onClick={() => handleDelete(device._id)} 
                             className="p-3 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all active:scale-90"
                             title="Deregister Meter"
                           >
                             <Trash2 size={18} />
                           </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal-style Form */}
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" onClick={() => !submitting && setShowForm(false)} />
            
            <div className="relative w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-[40px] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-[24px] font-bold text-white tracking-tight">Interface Node</h3>
                  <p className="text-slate-500 text-[13px] font-medium mt-1">Bind new physical hardware to the logic grid</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleRegister} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hardware Serial Signature</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.deviceSerial} 
                    onChange={e => setFormData({ ...formData, deviceSerial: e.target.value.toUpperCase() })}
                    placeholder="E.G. MTR-A1-F4-402"
                    className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-[15px] text-white font-bold placeholder:text-slate-700 transition-all" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Grid Mapping (Unit)</label>
                  <select 
                    required
                    value={formData.mappedFlatId}
                    onChange={e => setFormData({ ...formData, mappedFlatId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-900/50 border border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-[15px] text-white font-bold transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#0F172A]">SELECT FLAT UNIT</option>
                    {allFlats.map(flat => (
                        <option key={flat._id} value={flat._id} className="bg-[#0F172A]">
                            FLAT {flat.flatNumber} • {flat.occupantName}
                        </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-white uppercase tracking-wider">Telemetry Pre-check</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Automated signal diagnostic will initiate after bind</p>
                    </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    'Initializing System...'
                  ) : (
                    <>
                      Confirm & Initialize <CheckCircle2 size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
