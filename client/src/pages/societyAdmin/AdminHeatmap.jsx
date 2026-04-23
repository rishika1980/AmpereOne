import { useState, useEffect, useMemo } from 'react';
import { Activity, Grid3X3, Filter, Download, Info, Zap, Calendar, ChevronRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'Common Areas'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

export default function AdminHeatmap() {
  const { user } = useAuthStore();
  const [activeBlock, setActiveBlock] = useState('Block B');
  const [loading, setLoading] = useState(true);
  const [heatmap, setHeatmap] = useState([]);

  const socId = user?.societyId?._id || user?.societyId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/societies/${socId}/heatmap`);
        // The axios interceptor returns the body directly, which is { success: true, data: [...] }
        setHeatmap(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to sync heatmap signatures');
      } finally {
        setLoading(false);
      }
    };
    if (socId) fetchData();
  }, [socId]);

  // High-Fidelity Simulation for Heatmap Density
  const simulatedGrid = useMemo(() => {
    return Array.from({ length: 7 }, (_, dayIdx) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx],
      hours: Array.from({ length: 24 }, (_, hrIdx) => {
        // Create realistic patterns (higher in evening, lower in late night)
        let base = 20;
        if (hrIdx >= 18 && hrIdx <= 22) base = 85; // Evening peak
        if (hrIdx >= 7 && hrIdx <= 10) base = 60;  // Morning peak
        if (hrIdx >= 1 && hrIdx <= 5) base = 10;   // Late night base
        
        // Random variance based on block
        const blockEffect = activeBlock === 'Block B' ? 1.2 : 0.8;
        const value = Math.min(100, Math.max(0, base * blockEffect + Math.random() * 15));
        
        return { hour: hrIdx, value: Math.round(value) };
      })
    }));
  }, [activeBlock]);

  // Intensity Color Mapping
  const getIntensityColor = (val) => {
    if (val < 20) return 'bg-slate-900/40 border-white/5';
    if (val < 40) return 'bg-indigo-500/20 border-indigo-500/20';
    if (val < 60) return 'bg-indigo-500/40 border-indigo-500/40';
    if (val < 80) return 'bg-indigo-500/70 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]';
    return 'bg-indigo-500 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105 z-10';
  };

  if (loading) return (
    <Layout>
      <div className="p-8 sm:p-12 min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-[11px] uppercase tracking-[0.3em]">Synthesizing Load Matrix</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans overflow-hidden">
        
        {/* Header */}
        <header className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-indigo-500/20">
                Density Monitor
              </span>
              <span className="text-slate-700 text-[10px] font-bold uppercase tracking-[0.2em]">v1.0.4-HEURISTIC</span>
            </div>
            <h1 className="text-[32px] font-bold text-white tracking-tight leading-none">Intensity Heatmap</h1>
            <p className="text-slate-500 text-[14px] font-medium mt-3 tracking-tight">
               Geographic load distribution across society infrastructure
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <button 
               onClick={() => toast.success('Simulation: Exporting load matrix signature...')}
               className="flex items-center gap-3 px-6 py-3 bg-indigo-500 text-[#020617] rounded-2xl text-[12px] font-bold shadow-xl shadow-indigo-500/20 hover:bg-indigo-400 transition-all active:scale-95"
             >
                <Download size={16} /> Export Map
             </button>
          </div>
        </header>

        {/* Filters & legend Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-3 flex flex-wrap items-center gap-2">
            {BLOCKS.map(block => (
              <button 
                key={block} 
                onClick={() => setActiveBlock(block)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border transition-all
                  ${activeBlock === block 
                    ? 'bg-indigo-600/10 text-indigo-400 border-indigo-600/20 shadow-lg' 
                    : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-white'}`}
              >
                {block}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-3 bg-[#0F172A]/40 border border-white/5 rounded-2xl">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Intensity:</span>
            <div className="flex gap-1.5">
              {[0.1, 0.3, 0.5, 0.7, 1].map(o => (
                <div key={o} className="w-4 h-4 rounded-md border border-indigo-500/20" style={{ backgroundColor: `rgba(99, 102, 241, ${o})` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Main Heatmap Matrix */}
        <div className="bg-[#0F172A]/30 border border-white/5 rounded-[40px] p-8 lg:p-12 shadow-3xl relative overflow-hidden backdrop-blur-sm">
           <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
           
           <div className="overflow-x-auto pb-6">
              <div className="min-w-[1000px]">
                {/* Timeline Header */}
                <div className="grid grid-cols-[80px_1fr] gap-6 mb-8">
                  <div />
                  <div className="grid grid-cols-24 gap-3">
                    {HOURS.map((h, i) => (
                      <div key={i} className="text-[9px] font-black text-slate-600 text-center uppercase tracking-tighter truncate">
                        {i % 4 === 0 ? h : ''}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid Rows */}
                <div className="space-y-4">
                  {simulatedGrid.map((row) => (
                    <div key={row.day} className="grid grid-cols-[80px_1fr] gap-6 items-center">
                      <div className="text-[14px] font-bold text-slate-400 uppercase tracking-widest">{row.day}</div>
                      <div className="grid grid-cols-24 gap-3">
                        {row.hours.map((cell, i) => (
                          <div 
                            key={i} 
                            className={`aspect-square rounded-lg border transition-all duration-500 group relative cursor-pointer
                              ${getIntensityColor(cell.value)}`}
                          >
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                              {row.day} @ {cell.hour}:00
                              <div className="text-indigo-400 mt-0.5">{cell.value}% Intensity</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           {/* Insights Footer */}
           <div className="mt-16 pt-10 border-t border-white/5 flex flex-col md:flex-row gap-12 items-start">
              <div className="max-w-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <Activity size={18} className="text-indigo-400" />
                    <h4 className="text-[14px] font-bold text-white uppercase tracking-widest">Heuristic Insights</h4>
                 </div>
                 <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                   Detected a recurring 85%+ intensity window in <span className="text-indigo-400 font-bold">{activeBlock}</span> between 19:00 - 21:00. 
                   Predictive analysis suggests shifting non-critical infrastructure loads to 02:00 - 05:00.
                 </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1 w-full">
                {[
                  { label: 'Peak Hour', val: '20:00', sub: 'Critical Load' },
                  { label: 'Avg Density', val: '42%', sub: 'Healthy Range' },
                  { label: 'Max Spike', val: '+12%', sub: 'vs Last Mon' },
                  { label: 'Sustainability', val: '92%', sub: 'Optimal Eff.' },
                ].map((stat, i) => (
                  <div key={i}>
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-[20px] font-bold text-white">{stat.val}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{stat.sub}</p>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Global Alert Notification */}
        <div className="mt-12 p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                 <ShieldCheck size={20} />
              </div>
              <div>
                 <p className="text-[13px] font-bold text-white tracking-tight">Security Protocol Active</p>
                 <p className="text-[11px] text-slate-500 font-medium">Heuristic patterns are being analyzed for infrastructure signature drift.</p>
              </div>
           </div>
           <button className="flex items-center gap-2 text-[11px] font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors">
              Node Health <ChevronRight size={14} />
           </button>
        </div>

      </div>
    </Layout>
  );
}

const ShieldCheck = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
