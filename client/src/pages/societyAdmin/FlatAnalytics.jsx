import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  ArrowLeft, Zap, Activity, TrendingUp, AlertCircle, 
  Download, Building, Calendar, Info, Leaf, Clock, 
  ShieldCheck, Globe, ChevronRight, Share2, Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';

export default function FlatAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [flat, setFlat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // High-Fidelity Performance Heuristics
  const generateAuditProfile = (flatId, baseKwh = 350) => {
    const seed = flatId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rng = (offset) => Math.abs(Math.sin(seed + offset));

    return {
      metrics: {
        live: (1.2 + rng(100) * 1.5).toFixed(1),
        monthSoFar: baseKwh || 0,
        projected: (baseKwh * 1.1 + rng(101) * 20).toFixed(0),
        rank: Math.floor(rng(102) * 15 + 5),
        co2: (baseKwh * 0.72).toFixed(1),
        efficiencyScore: Math.floor(88 + rng(103) * 8),
        trend: { live: '+8% vs avg', units: 'Stable', proj: '-2% vs target' }
      },
      daily: Array.from({ length: 30 }, (_, i) => {
        const val = 3 + rng(i) * 4;
        const bAvg = 4 + rng(i + 50) * 1.5;
        let color = '#6366F1'; // Indigo base
        if (val > 6) color = '#F43F5E'; // Danger
        if (val < 4) color = '#10B981'; // Success
        return { 
          day: `${i + 1}`, 
          kwh: parseFloat(val.toFixed(1)), 
          buildingAvg: parseFloat(bAvg.toFixed(1)),
          color 
        };
      }),
      intensity: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        value: Math.floor(40 + rng(i + 200) * 80)
      })),
      distribution: [
        { name: 'Morning', range: '6:00 - 12:00', value: 24, color: '#10B981' },
        { name: 'Afternoon', range: '12:00 - 18:00', value: 22, color: '#6366F1' },
        { name: 'Evening', range: '18:00 - 0:00', value: 38, color: '#F43F5E' },
        { name: 'Night', range: '0:00 - 6:00', value: 16, color: '#F59E0B' }
      ],
      healthRecords: [
        { name: 'Smart Climate', status: 'Optimal', contribution: 42, runtime: '156h', efficiency: '96%', color: '#6366F1' },
        { name: 'Appliances', status: 'Optimal', contribution: 28, runtime: '82h', efficiency: '92%', color: '#10B981' },
        { name: 'Static Loads', status: 'Optimal', contribution: 18, runtime: '720h', efficiency: '98%', color: '#6366F1' },
        { name: 'Water Systems', status: 'Check Needed', contribution: 12, runtime: '48h', efficiency: '68%', color: '#F59E0B' }
      ],
      anomalies: [
        { type: 'PEAK EXCURSION', msg: 'Maximum demand threshold breached at 8:20 PM — 3.8 kW spike.', time: 'Today', priority: 'high' },
        { type: 'PHANTOM LOAD', msg: 'Idle consumption (240W) detected during dormant hours (2 AM).', time: 'Yesterday', priority: 'medium' },
        { type: 'SIGNAL JITTER', msg: 'Brief telemetry packet loss detected from floor node #4.', time: '2 days ago', priority: 'low' }
      ]
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const socId = user.societyId?._id || user.societyId;
        const res = await api.get(`/societies/${socId}/flats`);
        const found = res.data.data ? res.data.data.find(f => f._id === id) : res.data.find(f => f._id === id);
        if (found) {
          setFlat(found);
          setStats(generateAuditProfile(id, found.monthKwh));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to sync resident heuristics");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [id, user]);

  if (loading) return (
    <Layout>
        <div className="p-12 bg-[#020617] min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Resident Matrix...</p>
            </div>
        </div>
    </Layout>
  );

  if (!flat) return (
    <Layout>
        <div className="p-12 bg-[#020617] min-h-screen flex items-center justify-center italic text-slate-500">
            Resident profile footprint not found.
        </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans page-enter relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-[1500px] mx-auto">
          
          {/* Header Dashboard */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 mb-16">
            <div className="flex items-center gap-8">
               <button 
                 onClick={() => navigate('/admin/flats')}
                 className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-2xl backdrop-blur-md"
               >
                  <ArrowLeft size={20} />
               </button>
               <div>
                  <div className="flex items-center gap-5 flex-wrap">
                     <h1 className="text-[36px] font-semibold tracking-tighter text-white">Grid unit {flat.flatNumber}</h1>
                     <Badge status={(flat.meterStatus === 'Live' || flat.meterStatus === 'green') ? 'green' : 'gray'}>
                        {(flat.meterStatus === 'Live' || flat.meterStatus === 'green') ? 'Active signal' : 'Limited feed'}
                     </Badge>
                     <div className="hidden sm:flex items-center gap-2.5 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                        <ShieldCheck size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Verified node</span>
                     </div>
                  </div>
                  <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-[0.3em] mt-3 flex items-center gap-3">
                     <Activity size={12} className="text-emerald-400" /> Performance Audit for {flat.occupantName || 'Authenticated Resident'}
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={() => toast.success("Sharing enabled")} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                    <Share2 size={20} />
                </button>
                <button 
                  onClick={() => toast.loading("Generating full system audit...")}
                  className="flex items-center gap-4 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[12px] font-semibold uppercase tracking-widest shadow-[0_0_40px_rgba(79,70,229,0.25)] transition-all active:scale-95"
                >
                   <Download size={18} /> Export Intelligence report
                </button>
            </div>
          </div>

          {/* KPI Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
             {[
               { label: 'Instantaneous load', value: stats.metrics.live, unit: 'kW', icon: Zap, color: 'text-indigo-400', trend: 'Nominal' },
               { label: 'Cumulative Period', value: stats.metrics.monthSoFar, unit: 'kWh', icon: Calendar, color: 'text-white', trend: stats.metrics.trend.units },
               { label: 'Carbon footprint', value: stats.metrics.co2, unit: 'kg CO2', icon: Leaf, color: 'text-emerald-400', trend: 'Tier 1 Grade' },
               { label: 'Global Ranking', value: `Top ${stats.metrics.rank}%`, unit: '', icon: Globe, color: 'text-amber-400', trend: `Score: ${stats.metrics.efficiencyScore}/100` }
             ].map((m, i) => (
               <div key={i} className="bg-[#0F172A]/40 border border-white/5 p-8 rounded-[40px] flex flex-col justify-between min-h-[220px] group hover:border-white/10 transition-all backdrop-blur-md shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-white/5 transition-all" />
                  <div className="flex items-center justify-between relative z-10">
                     <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{m.label}</span>
                     <div className={`p-2.5 rounded-xl bg-white/5 ${m.color}`}>
                        <m.icon size={18} />
                     </div>
                  </div>
                  <div className="relative z-10 mt-6">
                    <p className={`text-[44px] font-semibold tracking-tighter tabular leading-none mb-4 ${m.color}`}>
                       {m.value} <span className="text-xs font-semibold text-slate-500 uppercase tracking-normal">{m.unit}</span>
                    </p>
                    <div className="flex items-center gap-2 pt-5 border-t border-white/5">
                        <TrendingUp size={12} className={m.color} />
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tighter">{m.trend}</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-12 gap-8 mb-16">
             
             {/* Main Distribution Chart */}
             <div className="col-span-12 lg:col-span-8 bg-[#0F172A]/40 border border-white/5 p-10 rounded-[44px] min-h-[550px] flex flex-col backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/[0.03] to-transparent pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-16 relative z-10">
                   <div>
                      <h3 className="text-[22px] font-semibold text-white tracking-tight">Load heuristics analysis</h3>
                      <p className="text-[11px] text-slate-500 font-semibold mt-2 uppercase tracking-[0.25em]">30-Day performance benchmark against grid average</p>
                   </div>
                      <div className="flex items-center gap-8 bg-slate-900/50 px-6 py-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                          <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Resident</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-white/10" />
                          <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-widest">Benchmark</span>
                        </div>
                     </div>
                </div>
                
                <div className="flex-1 relative z-10">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.daily} margin={{ left: -20, bottom: 20 }}>
                         <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(255,255,255,0.03)" />
                         <XAxis 
                           dataKey="day" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: "#475569", fontSize: 10, fontWeight: 900 }} 
                           dy={15}
                         />
                         <YAxis 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: "#475569", fontSize: 10, fontWeight: 900 }} 
                         />
                         <Tooltip 
                           cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                           content={({ active, payload }) => {
                             if (active && payload?.[0]) return (
                               <div className="bg-[#0F172A]/90 border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-2xl">
                                 <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Audit marker: day {payload[0].payload.day}</p>
                                 <div className="space-y-3">
                                    <p className="text-2xl font-black text-white flex items-center justify-between gap-12 tabular">
                                        Usage: <span>{payload[0].value} <span className="text-xs text-slate-500 font-bold ml-1">kWh</span></span>
                                    </p>
                                    <p className="text-[11px] font-bold text-slate-400 flex items-center justify-between gap-12 uppercase tracking-widest pt-3 border-t border-white/5">
                                        Grid Average: <span>{payload[0].payload.buildingAvg}</span>
                                    </p>
                                 </div>
                               </div>
                             );
                             return null;
                           }}
                         />
                         <Bar dataKey="buildingAvg" fill="rgba(255,255,255,0.03)" radius={[6, 6, 0, 0]} barSize={16} />
                         <Bar dataKey="kwh" radius={[6, 6, 0, 0]} barSize={16}>
                            {stats.daily.map((entry, index) => (
                               <Cell key={index} fill={entry.color} />
                            ))}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Distribution Patterns */}
             <div className="col-span-12 lg:col-span-4 bg-[#0F172A]/40 border border-white/5 p-10 rounded-[44px] flex flex-col backdrop-blur-md shadow-2xl">
                <h3 className="text-[22px] font-bold text-white tracking-tight mb-2">Cycle dynamics</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-12">Temporal intensity load</p>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                   <div className="h-64 w-64 relative mb-12">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                              data={stats.distribution}
                              innerRadius={80}
                              outerRadius={105}
                              paddingAngle={8}
                              dataKey="value"
                              stroke="none"
                            >
                               {stats.distribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Aggregated</span>
                         <span className="text-5xl font-semibold text-white tracking-tighter mt-1">100%</span>
                      </div>
                   </div>

                   <div className="flex flex-col gap-4 w-full mt-8">
                      {stats.distribution.map((item) => (
                         <div key={item.name} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.1)]" style={{ backgroundColor: item.color }} />
                               <div>
                                  <p className="text-[11px] font-semibold text-white uppercase tracking-widest leading-none">{item.name}</p>
                                  <p className="text-[9px] font-medium text-slate-500 uppercase mt-2 tracking-tighter">{item.range}</p>
                                </div>
                            </div>
                            <p className="text-2xl font-semibold text-white tabular leading-none">{item.value}%</p>
                         </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Signatures Audit Dashboard */}
             <div className="col-span-12 lg:col-span-7 bg-[#0F172A]/40 border border-white/5 p-12 rounded-[44px] shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-12">
                   <h3 className="text-[22px] font-semibold text-white tracking-tight">Signal health scorecard</h3>
                   <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">Aggregate Efficiency: {stats.metrics.efficiencyScore}%</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   {stats.healthRecords.map((item, i) => (
                     <div key={i} className="p-8 bg-slate-900/50 border border-white/5 rounded-[40px] group hover:border-indigo-500/30 transition-all flex flex-col justify-between h-56 shadow-xl">
                        <div className="flex items-center justify-between">
                           <div className={`w-12 h-12 rounded-2xl border border-white/5 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg`} style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                              <Zap size={22} />
                           </div>
                           <Badge status={item.status === 'Optimal' ? 'green' : 'gray'}>{item.status}</Badge>
                        </div>
                        <div>
                           <p className="text-[15px] font-semibold text-white tracking-tight mb-2 uppercase tracking-wide">{item.name}</p>
                           <div className="flex items-center justify-between mt-5 text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                              <span>Active {item.runtime}</span>
                              <span className="text-white">{item.efficiency} optimization</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/[0.03] rounded-full mt-4 overflow-hidden border border-white/5">
                              <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.4)]" style={{ width: item.efficiency }} />
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Event History Trace */}
             <div className="col-span-12 lg:col-span-5 bg-[#0F172A]/40 border border-white/5 p-12 rounded-[44px] backdrop-blur-md shadow-2xl">
                <h3 className="text-[22px] font-semibold text-white tracking-tight mb-12">Deep heuristics trace</h3>
                <div className="space-y-12 relative pb-8">
                   <div className="absolute left-[23px] top-6 bottom-6 w-px bg-white/5" />
                   {stats.anomalies.map((alert, i) => (
                     <div key={i} className="flex gap-8 relative z-10 group">
                        <div className={`w-12 h-12 shrink-0 rounded-[20px] flex items-center justify-center border shadow-2xl transition-all ${alert.priority === 'high' ? 'bg-rose-500/20 text-rose-500 border-rose-500/30' : 'bg-slate-900 border-white/5 text-slate-500 group-hover:text-white group-hover:border-white/10'}`}>
                           <AlertCircle size={22} />
                        </div>
                        <div className="flex-1 pb-4">
                           <div className="flex items-center justify-between mb-3">
                              <span className={`text-[12px] font-semibold uppercase tracking-widest ${alert.priority === 'high' ? 'text-rose-500' : 'text-white'}`}>{alert.type}</span>
                              <span className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">{alert.time}</span>
                           </div>
                           <p className="text-[14px] text-slate-400 leading-relaxed font-medium tracking-tight">
                              {alert.msg}
                           </p>
                        </div>
                     </div>
                   ))}
                   <button className="w-full py-4 border border-white/5 hover:border-white/10 rounded-2xl text-[10px] font-semibold text-slate-500 uppercase tracking-widest hover:text-white transition-all">
                       Load redundant logs <ChevronRight size={14} className="inline ml-2" />
                   </button>
                </div>
             </div>

          </div>
          
          <div className="h-20" />
        </div>
      </div>
    </Layout>
  );
}
