import { useState, useMemo } from 'react';
import { 
  Building2, Plus, ArrowRight, IndianRupee, MapPin, 
  LayoutDashboard, Zap, ShieldCheck, Globe, Activity,
  TrendingUp, BarChart3, Search, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { usePoll } from '../../hooks/usePoll';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';
import { Skeleton } from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import { currency, fmt } from '../../utils/helpers';
import AddSocietyModal from '../../components/builder/AddSocietyModal';

export default function BuilderDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('monthKwh');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const bId = user?.builderId?._id || user?.builderId;

  const fetchData = async () => {
    try {
      if (!bId) return;
      const [resOver, resSoc] = await Promise.all([
        api.get(`/builders/${bId}/overview`),
        api.get(`/builders/${bId}/societies?sortBy=monthKwh&order=desc`)
      ]);
      setOverview(resOver.data);
      setSocieties(resSoc.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  usePoll(fetchData, 30000);

  const sortedSocieties = useMemo(() => {
    return [...societies].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b[sortBy] - a[sortBy];
    });
  }, [societies, sortBy]);

  if (loading) return (
    <Layout>
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
         <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Synchronizing Portfolio Nodes...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <AddSocietyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        builderId={bId}
        onSuccess={fetchData}
      />

      <div className="bg-[#020617] min-h-screen text-slate-300 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
        
        {/* Ambient Background Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto py-12 px-6 relative z-10">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 page-enter">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge status="indigo">Enterprise Portfolio</Badge>
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                   <ShieldCheck size={12} className="text-amber-500" />
                   <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Builder Admin — Read Only</span>
                </div>
              </div>
              <h1 className="text-[42px] font-semibold text-white tracking-tighter leading-tight mt-6">
                Portfolio Command Center
              </h1>
              <p className="text-slate-500 text-[16px] font-medium tracking-tight">
                {user?.builderId?.name || 'AmpereOne Infrastructure'} • Managing {overview?.totalSocieties} smart grid nodes globally.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <button 
                 onClick={() => setIsModalOpen(true)}
                 className="flex items-center gap-3 px-8 py-4 bg-indigo-500 text-[#020617] font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-400 transition-all active:scale-95 group"
               >
                 <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
                 Add society
               </button>

               <div className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                     <Globe size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Region</p>
                    <p className="text-[14px] font-bold text-white tracking-tight leading-none mt-1">Global/India</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Portfolio Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 page-enter delay-100">
             {[
               { label: 'Total Societies', val: overview?.totalSocieties, icon: Building2, color: 'text-indigo-400 bg-indigo-500/10' },
               { label: 'Total Units', val: overview?.totalFlats, icon: LayoutDashboard, color: 'text-slate-400 bg-slate-800/10' },
               { label: 'Total Devices', val: overview?.totalDevicesOnline, icon: Zap, color: 'text-emerald-400 bg-emerald-500/10', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]' },
               { label: 'Portfolio Load', val: `${fmt(overview?.portfolioMonthKwh)}`, unit: 'kWh', icon: BarChart3, color: 'text-indigo-400 bg-indigo-500/10' },
             ].map((m, i) => (
               <div key={i} className="bg-[#0F172A]/40 border border-white/5 rounded-[32px] p-8 backdrop-blur-md shadow-2xl group hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-8">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">{m.label}</p>
                    <div className={`p-2.5 rounded-xl ${m.color} ${m.glow} group-hover:scale-110 transition-transform`}>
                      <m.icon size={18} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[36px] font-bold text-white tracking-tighter tabular-nums leading-none">{m.val}</span>
                    {m.unit && <span className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">{m.unit}</span>}
                  </div>
               </div>
             ))}
          </div>

          {/* Society List Grid */}
          <div className="space-y-8 page-enter delay-200">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-[18px] font-semibold text-white tracking-tight flex items-center gap-3">
                  Infrastructure Nodes
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 tracking-widest uppercase font-bold">Live Monitoring</span>
               </h2>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sort Parameters</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-[12px] font-bold text-slate-300 outline-none focus:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    <option value="monthKwh">Peak Consumption</option>
                    <option value="totalFlats">Scale (Units)</option>
                    <option value="avgKwhPerFlat">Grid Efficiency</option>
                    <option value="name">Alphabetical</option>
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {sortedSocieties.map((soc, i) => (
                 <div 
                   key={soc._id} 
                   onClick={() => navigate('/admin', { state: { societyId: soc._id, readOnly: true } })}
                   className="group bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 backdrop-blur-md shadow-2xl transition-all hover:scale-[1.01] hover:border-indigo-500/20 cursor-pointer relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none -mr-16 -mt-16" />
                    
                    <div className="flex items-start justify-between mb-10 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[22px] bg-slate-900 flex items-center justify-center text-slate-500 border border-white/5 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 group-hover:border-indigo-500/20 transition-all duration-500">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <h3 className="text-[22px] font-semibold text-white tracking-tight mb-1">{soc.name}</h3>
                          <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                            <MapPin size={12} className="text-indigo-400" />
                            {soc.city}
                          </div>
                        </div>
                      </div>
                      <Badge status="green">Operational</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-10 relative z-10">
                       <div className="p-5 bg-slate-950/40 border border-white/5 rounded-[24px]">
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Total Scale</p>
                          <p className="text-[18px] font-bold text-white tracking-tight">{soc.totalFlats} <span className="text-[10px] opacity-20 uppercase ml-1">Units</span></p>
                       </div>
                       <div className="p-5 bg-slate-950/40 border border-white/5 rounded-[24px]">
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Node Efficiency</p>
                          <p className="text-[18px] font-bold text-emerald-400 tracking-tight">{fmt(soc.avgKwhPerFlat)} <span className="text-[10px] opacity-20 uppercase ml-1">avg</span></p>
                       </div>
                       <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-[24px]">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Grid Load</p>
                          <p className="text-[18px] font-bold text-white tracking-tight">{fmt(soc.monthKwh)} <span className="text-[10px] opacity-20 uppercase ml-1">kWh</span></p>
                       </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Simulating Live Telemetry</span>
                       </div>
                       <div className="flex items-center gap-3 text-[11px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          Drill Down Node <ChevronRight size={16} className="text-indigo-400" />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
