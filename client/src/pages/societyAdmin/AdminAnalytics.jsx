import { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, AreaChart, Area, ComposedChart, Line
} from 'recharts';
import Layout from '../../components/layout/Layout';
import { 
  Activity, Calendar, Filter, Download, AlertCircle, 
  TrendingUp, Zap, Building, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

const COLORS = {
  primary: '#6366F1',   // Indigo
  secondary: '#FF9F0A', // Orange
  success: '#30D158',   // Emerald
  danger: '#FF453A',    // Rose
  grid: 'rgba(255,255,255,0.05)'
};

export default function AdminAnalytics() {
  const { user } = useAuthStore();
  const [activeRange, setActiveRange] = useState('Quarterly');
  const [loading, setLoading] = useState(true);
  
  const socId = user?.societyId?._id || user?.societyId;

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!socId) return;
      try {
        await api.get(`/societies/${socId}/overview`);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [socId]);

  const hourlyData = [
    { time: '0:00', residential: 12, common: 5, nodes: 3 },
    { time: '3:00', residential: 10, common: 4, nodes: 2 },
    { time: '6:00', residential: 45, common: 15, nodes: 8 },
    { time: '9:00', residential: 38, common: 12, nodes: 6 },
    { time: '12:00', residential: 35, common: 10, nodes: 5 },
    { time: '15:00', residential: 32, common: 11, nodes: 6 },
    { time: '18:00', residential: 65, common: 20, nodes: 12 },
    { time: '21:00', residential: 58, common: 18, nodes: 10 },
  ];

  const trendData = [
    { name: 'Jan', kwh: 4200, avg: 3800 },
    { name: 'Feb', kwh: 3800, avg: 3800 },
    { name: 'Mar', kwh: 5100, avg: 4000 },
    { name: 'Apr', kwh: 4800, avg: 4100 },
    { name: 'May', kwh: 5400, avg: 4200 },
    { name: 'Jun', kwh: 6100, avg: 4300 },
  ];

  const insights = [
    { id: 'AN-092', unit: 'Block B', type: 'Sustained Spike', deviation: '+240%', status: 'critical', desc: 'HVAC load in common areas exceeding threshold by 4.2 kW.' },
    { id: 'AN-088', unit: 'Block A', type: 'Unusual Idle', deviation: '-15%', status: 'optimal', desc: 'Efficiency optimization detected in resident telemetry.' },
    { id: 'AN-081', unit: 'Pump-2', type: 'Phase Drift', deviation: 'Voltage', status: 'warning', desc: 'Fluctuation recorded in secondary phase (212V).' },
  ];

  if (loading) return (
    <Layout>
      <div className="p-8 sm:p-12 min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em]">Calibrating Analytical Models</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans">
        
        {/* Header */}
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-indigo-500/20">
                Analytical Engine
              </span>
              <span className="text-slate-700 text-[10px] font-bold uppercase tracking-[0.2em]">High-Fidelity Telemetry</span>
            </div>
            <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">Global Analytics</h1>
            <p className="text-slate-500 text-[14px] font-medium mt-3 tracking-tight">
               Heuristic demand monitoring across society infrastructure
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex bg-[#0F172A] border border-white/5 rounded-2xl p-1 shadow-2xl">
                {['Monthly', 'Quarterly', 'Yearly'].map(range => (
                  <button 
                    key={range} 
                    onClick={() => setActiveRange(range)}
                    className={`px-5 py-2 text-[11px] font-bold rounded-xl transition-all ${range === activeRange ? 'bg-white/5 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                  >
                    {range}
                  </button>
                ))}
             </div>
             <button onClick={() => toast.success('Dataset exported to CSV')} className="flex items-center gap-3 px-6 py-3 bg-[#0F172A] border border-white/5 text-white rounded-2xl text-[12px] font-bold shadow-xl hover:border-white/10 transition-all active:scale-95">
                <Download size={16} /> Export CSV
             </button>
          </div>
        </header>

        {/* Top 3 Metric Overlays */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           {[
             { label: 'Cumulative Demand', val: '42.8 MWh', trend: '+12.4%', up: true, icon: Zap, color: 'text-indigo-400' },
             { label: 'Carbon Abatement', val: '1,240 kg', trend: '+8.1%', up: true, icon: TrendingUp, color: 'text-emerald-400' },
             { label: 'Operational Efficiency', val: '94.2%', trend: '-1.2%', up: false, icon: Building, color: 'text-indigo-400' },
           ].map((stat, i) => (
             <div key={i} className="bg-[#0F172A]/40 border border-white/5 rounded-[28px] p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-6">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                   <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                      <stat.icon size={16} />
                   </div>
                </div>
                <div className="flex items-end gap-3">
                   <h2 className="text-[34px] font-bold text-white tracking-tighter leading-none tabular-nums">{stat.val}</h2>
                   <div className={`flex items-center gap-1 mb-1 ${stat.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      <span className="text-[11px] font-bold">{stat.trend}</span>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
           
           {/* Detailed Stacked Breakdown */}
           <div className="lg:col-span-8 bg-[#0F172A]/40 border border-white/5 rounded-[32px] p-10 shadow-3xl">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-[20px] font-bold text-white tracking-tight">Temporal Consumption Profile</h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-widest">Load distribution across utility nodes</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mr-4">Resident</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(48,209,88,0.4)]" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Common</span>
                 </div>
              </div>

              <div className="h-96 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData} margin={{ left: -10, bottom: 20 }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                       <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 800 }} dy={15} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 800 }} tickFormatter={(v) => `${v}k`} dx={-15} />
                       <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                       <Bar dataKey="residential" stackId="l" fill={COLORS.primary} barSize={40} radius={[0, 0, 0, 0]} name="Residential Load" />
                       <Bar dataKey="common" stackId="l" fill={COLORS.success} barSize={40} radius={[0, 0, 0, 0]} name="Common Infrastructure" />
                       <Bar dataKey="nodes" stackId="l" fill={COLORS.secondary} barSize={40} radius={[6, 6, 0, 0]} name="Utility Nodes" />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Heuristic Insights & Alerts */}
           <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="flex-1 bg-[#0F172A]/40 border border-white/5 rounded-[32px] p-10 shadow-3xl">
                 <div className="flex items-center gap-3 mb-10">
                    <AlertCircle size={18} className="text-indigo-400" />
                    <h3 className="text-[14px] font-bold text-white uppercase tracking-widest">Heuristic Audit</h3>
                 </div>
                 <div className="space-y-8">
                    {insights.map((audit, i) => (
                      <div key={i} className="group relative">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">{audit.unit}</p>
                              <h4 className="text-[14px] font-bold text-white tracking-tight">{audit.type}</h4>
                           </div>
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest 
                             ${audit.status === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 
                               audit.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/10' : 
                               'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'}`}>
                             {audit.deviation}
                           </span>
                        </div>
                        <p className="text-[12px] text-slate-600 font-medium leading-relaxed mb-4">{audit.desc}</p>
                        <button 
                          onClick={() => toast.success('Simulation: Initiating deep-packet investigation for node...')}
                          className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors"
                        >
                           Investigate Node 
                        </button>
                        {i !== insights.length - 1 && <div className="absolute -bottom-4 left-0 right-0 h-px bg-white/5" />}
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Efficiency Trends */}
           <div className="lg:col-span-12 bg-[#0F172A]/40 border border-white/5 rounded-[40px] p-10 lg:p-14 shadow-3xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-14">
                 <div>
                    <h3 className="text-[22px] font-bold text-white tracking-tight">Efficiency Benchmarking</h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-widest">6-Month historical stability vs forecasted demand</p>
                 </div>
                 <div className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                    <Activity size={16} className="text-emerald-400" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-widest">Node Health: Optimal</span>
                 </div>
              </div>
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={trendData}>
                     <defs>
                       <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                         <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 800 }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 800 }} hide />
                     <Tooltip content={<CustomTooltip />} />
                     <Area dataKey="kwh" stroke={COLORS.primary} strokeWidth={3} fill="url(#trendGrad)" />
                     <Line dataKey="avg" stroke={COLORS.secondary} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                   </ComposedChart>
                 </ResponsiveContainer>
              </div>
           </div>

        </div>

      </div>
    </Layout>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-[#020617] border border-white/10 p-6 rounded-[24px] shadow-3xl backdrop-blur-2xl">
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">Dataset Segment: {label}</p>
        <div className="space-y-4">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{p.name}</p>
              <p className="text-[20px] font-bold text-white tracking-tighter leading-none tabular-nums">
                {p.value.toLocaleString()} <span className="text-[12px] text-slate-700 font-black uppercase tracking-normal">kWh</span>
              </p>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  }
  return null;
};
