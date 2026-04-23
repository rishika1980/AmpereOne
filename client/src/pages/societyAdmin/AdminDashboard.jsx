import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { 
  LayoutDashboard, Users, Cpu, Activity, Zap, ArrowRight, Building, 
  ShieldAlert, TrendingUp, AlertCircle, Calendar, ChevronDown, 
  ExternalLink, Search, MoreHorizontal
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { usePoll } from '../../hooks/usePoll';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';
import { fmt } from '../../utils/helpers';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#6366F1',
  secondary: '#AF52DE',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  grid: 'rgba(255,255,255,0.05)'
};

const ROLES_BADGE = {
  society_admin: { label: 'Society Admin', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [commonAreas, setCommonAreas] = useState({ list: [], grouped: {} });
  const [consumptionTrend, setConsumptionTrend] = useState([]);
  const [topConsumers, setTopConsumers] = useState([]);
  
  // UI State
  const [dateRange, setDateRange] = useState('Last 7 days');
  const [showPresets, setShowPresets] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2024, 3, 10)); // 10 Apr
  const [endDate, setEndDate] = useState(new Date(2024, 3, 17));   // 17 Apr
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const presetsRef = useRef(null);

  const socId = user?.societyId?._id || user?.societyId;

  // Real-time Data Polling
  usePoll(async () => {
    if (!socId) return;
    try {
      const [resOverview, resTrend, resBlocks, resCommon, resTop] = await Promise.all([
        api.get(`/societies/${socId}/overview`),
        api.get(`/societies/${socId}/consumption-trend`),
        api.get(`/societies/${socId}/blocks`),
        api.get(`/societies/${socId}/common-areas`),
        api.get(`/societies/${socId}/top-consumers`)
      ]);
      setOverview(resOverview.data);
      setConsumptionTrend(resTrend.data);
      setBlocks(resBlocks.data);
      setCommonAreas(resCommon.data);
      setTopConsumers(resTop.data);
    } catch (err) { 
      console.error('Telemetry Sync Error:', err);
    } finally { 
      setLoading(false); 
    }
  }, 30000, [socId]);

  // Click outside to close presets
  useEffect(() => {
    const handleOutside = (e) => { if (presetsRef.current && !presetsRef.current.contains(e.target)) setShowPresets(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const formatDateLabel = (date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const distributionData = [
    { name: 'Morning', value: 25, color: '#F59E0B' },
    { name: 'Afternoon', value: 20, color: '#10B981' },
    { name: 'Evening', value: 38, color: '#EF4444' },
    { name: 'Night', value: 17, color: '#6366F1' }
  ];

  const anomalies = [
    { id: '402', message: 'Drawing 5.8 kWh at 2:00 AM — expected 1.8 kWh', status: 'critical', factor: '3.2x usual' },
    { id: '112', message: 'Drawing 4.2 kWh at 11:00 PM — expected 1.5 kWh', status: 'warning', factor: '2.8x usual' }
  ];

  const pilotAdoption = [
    { name: 'Total flats', value: 90, total: 90, percent: 100 },
    { name: 'Meters live', value: 86, total: 90, percent: 96 },
    { name: 'Residents registered', value: 78, total: 90, percent: 87 },
    { name: 'Active residents (7d)', value: 72, total: 90, percent: 80 }
  ];


  if (loading) return (
    <Layout>
      <div className="p-8 sm:p-12 min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em]">Synchronizing Grid View</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans">
        
        {/* Header Section */}
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">Society live view</h1>
            <p className="text-slate-500 text-[14px] font-medium mt-3 tracking-tight">
              Sunrise Heights · 90 flats · 4 blocks
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Heatmap Link */}
            <button 
              onClick={() => navigate('/admin/heatmap')}
              className="flex items-center gap-3 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[13px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-xl active:scale-95"
            >
              <Activity size={16} /> Consumption Heatmap
            </button>

            {/* Presets Dropdown */}
            <div className="relative" ref={presetsRef}>
              <button 
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center gap-3 px-5 py-3 bg-[#0F172A] border border-white/5 rounded-xl text-[13px] font-bold text-white hover:border-white/10 transition-all shadow-xl"
              >
                {dateRange} <ChevronDown size={14} className={`transition-transform duration-300 ${showPresets ? 'rotate-180' : ''}`} />
              </button>
              {showPresets && (
                <div className="absolute top-full mt-2 left-0 w-48 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  {['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days'].map(opt => (
                    <button key={opt} onClick={() => { 
                      setDateRange(opt); 
                      setShowPresets(false); 
                      toast.success(`Simulation: Filtering grid for ${opt}`);
                    }}
                      className="w-full px-5 py-2.5 text-left text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                      {opt === dateRange && <span className="mr-2 text-indigo-400">✓</span>}
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Date Pickers */}
            <div className="relative">
              <input 
                type="date" 
                ref={startInputRef}
                className="absolute inset-0 opacity-0 pointer-events-none"
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
              <button 
                onClick={() => startInputRef.current.showPicker()}
                className="flex items-center gap-3 px-5 py-3 bg-[#0F172A] border border-white/5 rounded-xl text-[13px] font-bold text-white hover:border-white/10 transition-all shadow-xl active:scale-95"
              >
                <Calendar size={14} className="text-indigo-400" /> {formatDateLabel(startDate)}
              </button>
            </div>

            <div className="relative">
              <input 
                type="date" 
                ref={endInputRef}
                className="absolute inset-0 opacity-0 pointer-events-none"
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
              <button 
                onClick={() => endInputRef.current.showPicker()}
                className="flex items-center gap-3 px-5 py-3 bg-[#0F172A] border border-white/5 rounded-xl text-[13px] font-bold text-white hover:border-white/10 transition-all shadow-xl active:scale-95"
              >
                <Calendar size={14} className="text-indigo-400" /> {formatDateLabel(endDate)}
              </button>
            </div>
          </div>
        </header>

        {/* Top 5 Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {[
            { label: 'Live load', val: '48.6 kW', icon: Activity, color: 'text-indigo-400 bg-indigo-500/10', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]' },
            { label: 'Total flats', val: '90', sub: '84 occupied', icon: Building, color: 'text-slate-400 bg-slate-800/50' },
            { label: 'Meters online', val: '86/90', sub: '95.6%', icon: Cpu, color: 'text-emerald-400 bg-emerald-500/10' },
            { label: 'Active alerts', val: '4', sub: '2 escalated', icon: AlertCircle, color: 'text-rose-400 bg-rose-500/10' },
            { label: 'Active residents', val: '72', sub: 'Last 7 days', icon: Users, color: 'text-indigo-400 bg-indigo-500/10' },
          ].map((m, i) => (
            <div key={i} className="bg-[#0F172A]/40 border border-white/5 rounded-[24px] p-6 shadow-2xl transition-all hover:scale-[1.02] hover:border-white/10 group">
              <div className="flex justify-between items-start mb-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</p>
                <div className={`p-2 rounded-lg ${m.color} ${m.glow}`}>
                  <m.icon size={16} />
                </div>
              </div>
              <p className="text-[32px] font-bold text-white tracking-tighter leading-none mb-2 tabular-nums">{m.val}</p>
              <p className="text-[11px] font-bold text-slate-500 tracking-tight leading-none">{m.sub || '\u00A0'}</p>
            </div>
          ))}
        </div>
        
        {/* Infrastructure Live Grid (Checklist: Common area cards) */}
        <div className="mb-12 page-enter delay-150">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Zap size={14} className="text-indigo-500" /> Infrastructure Live Grid
              </h2>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Vertical Transport', val: '4.2', status: 'Optimal' },
                { label: 'Common Lighting', val: '2.8', status: 'Peak' },
                { label: 'Water Systems', val: '3.1', status: 'Standby' },
                { label: 'Clubhouse/Gym', val: '2.3', status: 'Optimal' }
              ].map((asset, i) => (
                <div key={i} className="bg-[#0F172A]/20 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                   <div>
                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{asset.label}</p>
                      <p className="text-[18px] font-bold text-white mt-1">{asset.val} <span className="text-[9px] text-slate-700">kW</span></p>
                   </div>
                   <div className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${asset.status === 'Peak' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {asset.status}
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Main Consumption & Distribution Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-[#0F172A]/40 border border-white/5 rounded-[32px] p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
             <div className="mb-12">
                <h3 className="text-[20px] font-bold text-white tracking-tight">Daily consumption trend</h3>
                <p className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Society total · Common areas stacked</p>
             </div>
             <div className="h-[350px] w-full min-h-[350px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consumptionTrend?.length ? consumptionTrend : []}>
                    <defs>
                      <linearGradient id="mainTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4}/>
                        <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="commonTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.4}/>
                        <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 800 }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 800 }} tickFormatter={(v) => `${v}k`} dx={-15} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="society" stroke={COLORS.primary} strokeWidth={3} fill="url(#mainTrend)" />
                    <Area type="monotone" dataKey="common" stroke={COLORS.secondary} strokeWidth={3} fill="url(#commonTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#0F172A]/40 border border-white/5 rounded-[32px] p-10 shadow-2xl backdrop-blur-sm">
             <h3 className="text-[14px] font-bold text-slate-300 uppercase tracking-widest mb-10">Load distribution</h3>
             <div className="h-[250px] relative mb-12 min-h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={distributionData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                     {distributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Aggregate</span>
                  <span className="text-[28px] font-bold text-white tracking-tighter">100%</span>
               </div>
             </div>
             <div className="grid grid-cols-2 gap-y-6 pt-10 border-t border-white/5">
                {distributionData.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</span>
                      <span className="text-[14px] font-bold text-white mt-0.5">{item.value}%</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Block Comparison & Anomalies Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#020617] border border-white/5 rounded-[32px] p-10 shadow-2xl">
             <div className="mb-10">
                <h3 className="text-[16px] font-bold text-white tracking-tight">Block comparison</h3>
                <p className="text-[11px] text-slate-600 font-bold mt-2 uppercase tracking-widest">Per-flat average kWh this month</p>
             </div>
             <div className="h-[280px] mt-4 min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={blocks} margin={{ left: 0, right: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 13, fontWeight: 700 }} width={80} />
                    <Bar dataKey="monthKwh" radius={[0, 6, 6, 0]} barSize={28}>
                       {blocks.map((e, i) => (
                         <Cell key={i} fill={
                           e.name === 'Block B' ? '#B22222' : 
                           e.name === 'Block C' ? '#10B981' : 
                           '#334155'
                         } />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-[#020617] border border-white/5 rounded-[32px] p-10 shadow-2xl">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-[16px] font-bold text-white tracking-tight">Anomalies detected</h3>
                <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold rounded-lg uppercase tracking-widest border border-rose-500/20">2 NEW</span>
             </div>
             <div className="space-y-4">
                {anomalies.map((anom, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:bg-white/[0.03] transition-all">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-[15px] font-bold text-white">Flat {anom.id}</h4>
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-400/5 px-2 py-0.5 rounded-md border border-rose-400/10">{anom.factor}</span>
                      </div>
                      <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{anom.message}</p>
                    </div>
                    <div className="flex gap-6 shrink-0 pt-2 sm:pt-0">
                      <button className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors">Investigate</button>
                      <button className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors">Dismiss</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Infrastructure & Funnel Row - Full Width Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16 w-full">
          {/* Common Areas (Match Screenshot Style) */}
          <div className="bg-[#020617] border border-white/5 rounded-[32px] p-10 shadow-2xl flex flex-col h-full">
             <div className="mb-10">
                <h3 className="text-[18px] font-bold text-white tracking-tight">Common areas</h3>
                <p className="text-[12px] text-slate-600 font-bold mt-2 uppercase tracking-widest">Live status of shared assets</p>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
                {[
                  { name: 'Lift 1', kw: '3.2', peak: '4.1', status: 'live' },
                  { name: 'Lift 2', kw: '2.8', peak: '4.1', status: 'live' },
                  { name: 'Pump 1', kw: '1.5', peak: '2.2', status: 'live' },
                  { name: 'Pump 2', kw: '0', peak: '2.2', status: 'standby', warning: 'Potential leak' },
                  { name: 'Lights', kw: '0.8', peak: '1.2', status: 'live' },
                  { name: 'Gym', kw: '2.1', peak: '3.5', status: 'live' }
                ].map((area, i) => (
                  <div key={i} className={`p-8 rounded-[24px] border transition-all relative group flex flex-col justify-between
                    ${area.status === 'standby' 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-[#0F172A]/40 border-white/5 hover:border-white/10'}`}>
                    
                    <div className={`absolute top-6 right-6 w-2 h-2 rounded-full 
                      ${area.status === 'live' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />

                    <div>
                      <h4 className="text-[14px] font-bold text-white mb-6 opacity-90">{area.name}</h4>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[32px] font-bold text-white tabular-nums tracking-tighter">{area.kw}</span>
                        <span className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">kW</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Peak: {area.peak} kW</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Pilot Adoption Section */}
          <div className="bg-[#020617] border border-white/5 rounded-[32px] p-10 shadow-2xl flex flex-col h-full">
             <div className="flex items-center justify-between mb-10">
               <h3 className="text-[18px] font-bold text-white tracking-tight">Pilot adoption</h3>
               <TrendingUp className="text-emerald-500" size={24} />
             </div>
             <div className="space-y-12 flex-grow flex flex-col justify-around">
                {pilotAdoption.map((tier, i) => (
                  <div key={i} className="space-y-5">
                    <div className="flex justify-between items-center text-[13px] font-bold tracking-tight">
                      <span className="text-slate-500 uppercase tracking-widest">{tier.name}</span>
                      <span className="text-white tabular-nums">{tier.value}/90 ({tier.percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                        style={{ width: `${tier.percent}%` }} 
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Top Consuming Table Row */}
        <div className="bg-[#0F172A]/40 border border-white/5 rounded-[32px] p-10 shadow-2xl backdrop-blur-sm mb-20 overflow-x-auto">
          <h3 className="text-[14px] font-bold text-slate-300 uppercase tracking-widest mb-10 ml-2">Top consuming flats</h3>
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-6 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Flat</th>
                <th className="text-left py-6 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Block</th>
                <th className="text-left py-6 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">kWh</th>
                <th className="text-left py-6 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">vs Avg</th>
                <th className="text-left py-6 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Status</th>
                <th className="text-right py-6 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {topConsumers.map((row, i) => (
                <tr 
                  key={i} 
                  onClick={() => navigate(`/admin/flats/${row.id}/analytics`)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="py-7 px-4">
                    <span className="text-[18px] font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight">{row.flat}</span>
                  </td>
                  <td className="py-7 px-4">
                    <span className="text-[14px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest">{row.block}</span>
                  </td>
                  <td className="py-7 px-4">
                    <span className="text-[20px] font-bold text-white tabular-nums">{row.kwh}</span>
                  </td>
                  <td className="py-7 px-4">
                    <span className={`text-[14px] font-bold ${row.trend.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'}`}>{row.trend}</span>
                  </td>
                  <td className="py-7 px-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${row.color}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-7 px-4 text-right">
                    <button className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all">
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      <style>{`
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>
    </Layout>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-[#0F172A] border border-white/10 p-6 rounded-[24px] shadow-3xl backdrop-blur-2xl">
        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-4">{label}</p>
        <div className="space-y-4">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
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
