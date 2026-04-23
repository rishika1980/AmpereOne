import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { 
  Zap, Activity, CalendarDays, TrendingUp, IndianRupee, Clock, 
  Leaf, Trophy, ArrowUpRight, ArrowDownRight, Info, CheckCircle2,
  RefreshCw, Smartphone, Gauge, LayoutDashboard
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  Cell, LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import useAuthStore from '../../store/authStore';
import { usePoll } from '../../hooks/usePoll';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';
import { Skeleton } from '../../components/ui/Skeleton';
import { fmt, currency, greeting } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';

const COLORS = {
  primary: '#6366F1', // Indigo
  emerald: '#10B981',
  amber: '#F59E0B',
  rose: '#F43F5E',
  slate: '#64748B',
  grid: 'rgba(255,255,255,0.05)'
};

const CustomTooltip = ({ active, payload, label, unit = 'kWh' }) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-[#0F172A] border border-white/10 p-4 rounded-2xl shadow-3xl backdrop-blur-md">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{label}</p>
        <p className="text-[18px] font-bold text-white tracking-tighter">
          {payload[0].value} <span className="text-[10px] text-slate-400 font-normal uppercase ml-1">{unit}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function FlatDashboard() {
  const { user } = useAuthStore();
  const [live, setLive] = useState(null);
  const [readings, setReadings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simValue, setSimValue] = useState(386.05);

  const flatId = user?.flatId?._id || user?.flatId;

  // Real-time Power Polling
  usePoll(async () => {
    if (!flatId) return;
    try {
      const res = await api.get(`/flats/${flatId}/live`);
      setLive(res.data || res);
    } catch (err) { console.error(err); }
  }, 5000, [flatId]);

  // Analytics Polling
  usePoll(async () => {
    if (!flatId) return;
    try {
      const [resReadings, resSummary, resProfile] = await Promise.all([
        api.get(`/flats/${flatId}/readings?granularity=day`),
        api.get(`/flats/${flatId}/summary`),
        api.get(`/flats/${flatId}/hourly-profile`)
      ]);
      setReadings(resReadings.data || resReadings || []);
      setSummary(resSummary.data || resSummary);
      setProfile(resProfile.data || resProfile);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, 30000, [flatId]);

  const stats = useMemo(() => ([
    {
      label: 'Live Power Draw',
      value: live ? `${fmt(live.kw)}` : '--',
      unit: 'kW',
      sub: live?.comparisonText || 'Telemetry Syncing...',
      subColor: live?.colorStatus === 'red' ? 'text-rose-400' : live?.colorStatus === 'amber' ? 'text-amber-400' : 'text-emerald-400',
      icon: Zap,
      indicator: live?.colorStatus || 'gray'
    },
    {
      label: 'MTD Consumption',
      value: summary ? `${summary.totalKwh}` : '--',
      unit: 'kWh',
      sub: summary ? `${currency(summary.estimatedCost)} total` : '...',
      icon: IndianRupee
    },
    {
      label: 'Projected End',
      value: summary ? `${summary.projectedKwh}` : '--',
      unit: 'kWh',
      sub: 'Based on current velocity',
      icon: TrendingUp
    },
    {
      label: 'Monthly Trend',
      value: summary ? `${Math.abs(summary.trendVsLastMonth)}%` : '--',
      unit: summary?.trendVsLastMonth > 0 ? 'Up' : 'Down',
      sub: summary?.trendText || 'Analytics pending',
      subColor: summary?.trendVsLastMonth > 0 ? 'text-rose-400' : 'text-emerald-400',
      icon: Activity
    }
  ]), [live, summary]);

  if (loading) return (
    <Layout>
      <div className="p-12 flex flex-col items-center justify-center min-h-[70vh]">
         <RefreshCw size={32} className="text-indigo-500 animate-spin mb-4" />
         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Calibrating Individual Node...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="bg-[#020617] min-h-screen text-slate-300 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
        
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto py-12 px-6 relative z-10">
          
          {/* Header */}
          <header className="mb-16 page-enter">
            <div className="flex items-center gap-3 mb-6">
               <Badge status="indigo">Resident Module</Badge>
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Grid Connected</span>
               </div>
            </div>
            <h1 className="text-[38px] font-semibold text-white tracking-tighter leading-tight">
               {greeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-500 text-[16px] font-medium mt-2 tracking-tight">
               Flat {user?.flatId?.flatNumber || 'B-204'} · {user?.societyId?.name || 'Sunrise Heights'} Management
            </p>
          </header>

          {/* Core Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 page-enter delay-100">
            {stats.map((stat, i) => (
              <div key={i} className="bg-[#0F172A]/40 border border-white/5 rounded-[32px] p-8 shadow-2xl backdrop-blur-md relative overflow-hidden group hover:border-white/10 transition-all">
                 <div className="flex justify-between items-start mb-8">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    {stat.indicator ? (
                      <div className={`w-3 h-3 rounded-full shadow-[0_0_12px_currentColor] transition-colors
                        ${stat.indicator === 'red' ? 'bg-rose-500 text-rose-500/40' : stat.indicator === 'amber' ? 'bg-amber-500 text-amber-500/40' : 'bg-emerald-500 text-emerald-500/40'}`} 
                      />
                    ) : (
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-500">
                        <stat.icon size={16} />
                      </div>
                    )}
                 </div>
                 <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[36px] font-bold text-white tracking-tighter tabular-nums leading-none">{stat.value}</span>
                    <span className="text-[12px] font-bold text-slate-600 uppercase tracking-widest">{stat.unit}</span>
                 </div>
                 <p className={`text-[11px] font-bold ${stat.subColor || 'text-slate-500'} tracking-tight leading-snug`}>
                    {stat.sub}
                 </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Monthly Consumption (Main Chart) */}
            <div className="lg:col-span-2 bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 backdrop-blur-md shadow-2xl page-enter delay-200">
               <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-[20px] font-semibold text-white tracking-tight">Consumption Engine</h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60 italic">Daily kWh metrics · {new Date().toLocaleString('default', { month: 'long' })}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-indigo-500" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded bg-slate-800/80" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Peak Load</span>
                    </div>
                  </div>
               </div>
               
               <div className="h-80 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={readings}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                      <XAxis 
                        dataKey="period" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#64748B", fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(v) => `${new Date(v).getDate()}`}
                        dy={15}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#64748B", fontSize: 10, fontWeight: 700 }}
                        dx={-15}
                      />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} content={<CustomTooltip />} />
                      <Bar dataKey="totalKwh" radius={[4, 4, 0, 0]} barSize={22}>
                        {(readings || []).map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`} 
                             fill={entry.isHighest ? COLORS.primary : entry.isWeekend ? COLORS.slate : COLORS.primary}
                             fillOpacity={entry.isHighest ? 1 : entry.isWeekend ? 0.2 : 0.6}
                           />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Info size={14} className="text-indigo-400" />
                     <p className="text-[12px] text-slate-500 font-medium">Weekends and public holidays are visually distinguished for pattern analysis.</p>
                  </div>
                  <div className="px-4 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                     Unit Rate: ₹{fmt(10, 0)}/unit
                  </div>
               </div>
            </div>

            {/* Time-of-Day Profile */}
            <div className="bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 backdrop-blur-md shadow-2xl page-enter delay-300">
               <div className="mb-12">
                  <h3 className="text-[18px] font-semibold text-white tracking-tight">Temporal Profile</h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">24-hour probable draw</p>
               </div>
               
               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profile?.hourly || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                      <XAxis 
                        dataKey="hour" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#64748B", fontSize: 9, fontWeight: 800 }} 
                        tickFormatter={h => `${h}h`} 
                        dy={15}
                      />
                      <Tooltip content={<CustomTooltip label="Hour" unit="kWh" />} />
                      <Bar dataKey="avgKwh" radius={[2, 2, 0, 0]} barSize={10}>
                        {(profile?.hourly || []).map((entry, index) => {
                           let fill = entry.level === 'high' ? COLORS.rose : entry.level === 'medium' ? COLORS.amber : COLORS.emerald;
                           return <Cell key={`cell-${index}`} fill={fill} fillOpacity={0.6} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               
               <div className="space-y-4 mt-12 pt-12 border-t border-white/5">
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Peak Activity</span>
                     <div className="flex gap-2">
                        {profile?.peakHours?.map(h => (
                           <span key={h} className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-400 tabular-nums">
                              {h}:00
                           </span>
                        ))}
                     </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-4">
                     Cluster analysis suggests your infrastructure enters high-load state during these windows.
                  </p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
             {/* 30D Trend Line */}
             <div className="bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 backdrop-blur-md shadow-2xl page-enter delay-400">
               <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-[18px] font-semibold text-white tracking-tight">30-Day Velocity</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">7-day rolling overlay</p>
                  </div>
                  <Activity size={20} className="text-slate-700" />
               </div>
               
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readings}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                      <XAxis dataKey="period" hide />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 10, fontWeight: 700 }} dx={-15} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="totalKwh" 
                        stroke={COLORS.primary} 
                        strokeWidth={4} 
                        dot={false} 
                        activeDot={{ r: 6, fill: COLORS.primary, stroke: '#020617', strokeWidth: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avg7day" 
                        stroke={COLORS.amber} 
                        strokeWidth={2} 
                        strokeDasharray="6 6" 
                        dot={false} 
                        opacity={0.4}
                      />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex gap-8 mt-12 justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Draw</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-0.5 border-t-2 border-dashed border-amber-500/50" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">7D Rolling Avg</span>
                  </div>
               </div>
            </div>

            {/* Benchmarking Gauges */}
            <div className="bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 backdrop-blur-md shadow-2xl page-enter delay-500">
               <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-[18px] font-semibold text-white tracking-tight">Segment Positioning</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">Efficiency Percentile</p>
                  </div>
                  <Trophy size={20} className="text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
               </div>
               
               <div className="space-y-12">
                  <div>
                    <div className="flex justify-between mb-4 px-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unit Benchmarking</span>
                      <span className="text-[12px] font-bold text-white tabular-nums tracking-wider">{simValue} kWh</span>
                    </div>
                    <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 via-amber-500/40 to-rose-500/40" />
                       <div 
                         className="absolute top-0 bottom-0 right-0 bg-slate-800 transition-all duration-1000" 
                         style={{ left: `${Math.min(100, (simValue / 800) * 100)}%` }} 
                       />
                    </div>
                  </div>

                  <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] flex items-start gap-6 group hover:bg-emerald-500/10 transition-all">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/10 group-hover:scale-110 transition-transform">
                        <CheckCircle2 size={24} />
                     </div>
                     <div>
                        <p className="text-[15px] font-bold text-white tracking-tight leading-none mb-2">Efficient Protocol Node</p>
                        <p className="text-[12px] text-slate-500 font-medium leading-relaxed italic">
                           Your infrastructure is currently consuming 12% less than the 2BHK segment average.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}


