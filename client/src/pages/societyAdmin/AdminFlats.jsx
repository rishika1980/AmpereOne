import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, User, Search, Filter, Plus, ChevronRight, Zap, TrendingUp, AlertTriangle, 
  ChevronDown, ChevronUp, MoreVertical, X, Mail, FileText, LayoutGrid, Check, Info,
  AlertCircle, Activity, Layout as LayoutIcon, Clock, CreditCard, Building, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { usePoll } from '../../hooks/usePoll';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';

export default function AdminFlats() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [flats, setFlats] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState(['Block A']); 

  const socId = user.societyId?._id || user.societyId;

  usePoll(async () => {
    try {
      const [flatsRes, alertsRes] = await Promise.all([
        api.get(`/societies/${socId}/flats`),
        api.get(`/societies/${socId}/alerts`)
      ]);
      setFlats(flatsRes.data.data || flatsRes.data);
      // Filter alerts for pending registrations
      setApprovals((alertsRes.data.data || alertsRes.data).filter(a => a.category === 'Approvals' && a.status === 'Pending'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, 30000, [socId]);

  const toggleBlock = (blockName) => {
    setExpandedBlocks(prev => 
      prev.includes(blockName) ? prev.filter(b => b !== blockName) : [...prev, blockName]
    );
  };

  const groupedData = useMemo(() => {
    const list = Array.isArray(flats) ? flats : [];
    const filtered = list.filter(f => 
      f.flatNumber.toLowerCase().includes(search.toLowerCase()) || 
      (f.occupantName || '').toLowerCase().includes(search.toLowerCase())
    );

    const blocks = {};
    filtered.forEach(flat => {
      const bName = flat.blockId?.name || flat.blockName || 'Main Block';
      const fNum = flat.floorId?.floorNumber || flat.floorNumber || 0;
      
      if (!blocks[bName]) {
        blocks[bName] = { name: bName, floors: {}, total: 0, active: 0, vacant: 0 };
      }
      
      if (!blocks[bName].floors[fNum]) {
        blocks[bName].floors[fNum] = [];
      }
      
      blocks[bName].floors[fNum].push(flat);
      blocks[bName].total++;
      if (flat.meterStatus === 'Live') blocks[bName].active++;
      else if (flat.meterStatus === 'No Device') blocks[bName].vacant++;
    });

    return Object.values(blocks).sort((a, b) => a.name.localeCompare(b.name));
  }, [flats, search]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await api.post(`/societies/alerts/${id}/approve`);
        toast.success('Resident approved ✓');
      } else {
        await api.post(`/societies/alerts/${id}/reject`);
        toast.error('Resident request rejected');
      }
      // Refresh
      const alertsRes = await api.get(`/societies/${socId}/alerts`);
      setApprovals((alertsRes.data.data || alertsRes.data).filter(a => a.category === 'Approvals' && a.status === 'Pending'));
    } catch (err) { toast.error(err.message); }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans page-enter relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-[1600px] mx-auto">
          {/* Header Section */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-16">
            <div>
              <h1 className="text-[36px] font-semibold text-white tracking-tighter leading-none">Resident directory</h1>
              <p className="text-slate-500 text-[15px] font-medium mt-4 tracking-tight">
                Sunrise Heights • {flats.length} total units configured across {groupedData.length} blocks
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
               <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input 
                    type="text" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or unit..." 
                    className="w-full pl-12 pr-4 py-3.5 bg-[#0F172A]/40 border border-white/5 rounded-2xl text-[14px] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-white font-medium placeholder:text-slate-600 shadow-2xl backdrop-blur-sm"
                  />
               </div>
                <button 
                  onClick={() => toast.success('Simulation: Unit registration protocol initiated')}
                  className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[12px] font-semibold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)] min-w-[180px]"
                >
                  <Plus size={18} /> Register unit
                </button>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { label: 'Total units', value: flats.length, icon: Home, color: 'text-indigo-400', glow: 'shadow-[0_0_20px_rgba(79,70,229,0.15)]' },
              { label: 'Active signal', value: flats.filter(f => f.meterStatus === 'Live' || f.meterStatus === 'green').length, icon: Zap, color: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
              { label: 'Pending approval', value: approvals.length, icon: User, color: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' },
              { label: 'Network health', value: '98.4%', icon: TrendingUp, color: 'text-indigo-400', glow: 'shadow-[0_0_20px_rgba(79,70,229,0.1)]' }
            ].map((stat, i) => (
              <div key={i} className={`bg-[#0F172A]/40 border border-white/5 p-8 rounded-[36px] backdrop-blur-md transition-all hover:border-white/10 group ${stat.glow}`}>
                <div className="flex items-center justify-between mb-6">
                   <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110 ${stat.color}`}>
                      <stat.icon size={20} />
                   </div>
                   <Badge status={stat.color.includes('emerald') ? 'green' : (stat.color.includes('amber') ? 'gray' : 'blue')}>Nominal</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                  <p className={`text-3xl font-semibold tracking-tighter tabular ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Critical Actions Hub */}

          {/* Infrastructure Grid */}
          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/2 animate-pulse rounded-[32px] border border-white/5" />
              ))
            ) : (
              groupedData.map(block => (
                <div key={block.name} className="overflow-hidden">
                   <button 
                     onClick={() => toggleBlock(block.name)}
                     className={`w-full bg-[#0F172A]/40 border border-white/5 p-8 rounded-[36px] flex items-center justify-between group transition-all backdrop-blur-sm shadow-xl hover:border-white/10 ${expandedBlocks.includes(block.name) ? 'rounded-b-none border-b-0' : ''}`}
                   >
                      <div className="flex items-center gap-6">
                         <div className={`w-14 h-14 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center transition-all ${expandedBlocks.includes(block.name) ? 'scale-110 border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.2)]' : ''}`}>
                            <Building size={24} className={expandedBlocks.includes(block.name) ? 'text-indigo-400' : 'text-slate-500'} />
                         </div>
                         <div className="text-left">
                            <h3 className="text-[20px] font-semibold text-white tracking-tight flex items-center gap-4">
                              {block.name} 
                              <Badge status="blue">{block.total} Registered nodes</Badge>
                            </h3>
                            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mt-1">Telemetry grid ready • Floor partitioning enabled</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-10">
                         <div className="hidden md:flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-[14px] font-bold text-emerald-400 leading-none">{block.active}</p>
                                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mt-1.5">Live Data</p>
                            </div>
                            <div className="w-px h-8 bg-white/5" />
                            <div className="text-center">
                                <p className="text-[14px] font-bold text-slate-400 leading-none">{block.vacant}</p>
                                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mt-1.5">Unbonded</p>
                            </div>
                         </div>
                         <div className={`p-3 rounded-full bg-white/5 text-slate-500 transition-all ${expandedBlocks.includes(block.name) ? 'rotate-180 text-white' : ''}`}>
                            <ChevronDown size={18} />
                         </div>
                      </div>
                   </button>

                   {expandedBlocks.includes(block.name) && (
                     <div className="bg-[#0F172A]/40 border border-white/5 border-t-0 rounded-[36px] rounded-t-none p-0 overflow-hidden backdrop-blur-sm">
                        {Object.keys(block.floors).sort().map(floor => (
                          <div key={floor} className="border-b border-white/5 last:border-0 overflow-hidden">
                             <div className="px-10 py-5 bg-white/[0.03] flex items-center justify-between">
                                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.25em]">Sub-grid Partition: Floor {floor}</h4>
                                <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">{block.floors[floor].length} Interface units</span>
                             </div>
                             <div className="divide-y divide-white/5">
                                {block.floors[floor].map(flat => (
                                   <div 
                                     key={flat._id} 
                                     onClick={() => navigate(`/admin/flats/${flat._id}/analytics`)}
                                     className="px-10 py-8 flex items-center justify-between hover:bg-white/[0.02] transition-all cursor-pointer group"
                                   >
                                      <div className="flex items-center gap-8">
                                         <div className="w-14 h-14 rounded-full border-2 border-white/5 flex items-center justify-center text-white text-sm font-semibold bg-slate-900 group-hover:border-indigo-500/30 shadow-2xl transition-all group-hover:scale-105">
                                            {flat.occupantName?.[0] || 'V'}
                                         </div>
                                         <div>
                                            <div className="flex items-center gap-4 mb-1">
                                               <h5 className="text-[17px] font-semibold text-white tracking-tight">{flat.occupantName || 'VACANT UNIT'}</h5>
                                               <Badge status={(flat.meterStatus === 'Live' || flat.meterStatus === 'green') ? 'green' : 'gray'}>
                                                 {(flat.meterStatus === 'Live' || flat.meterStatus === 'green') ? 'Active Node' : 'Bridge Lost'}
                                               </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                                              <span>UNIT {flat.flatNumber}</span>
                                              <div className="w-1 h-1 rounded-full bg-slate-800" />
                                              <span>{flat.occupantEmail || 'NO IDENTITY ASSIGNED'}</span>
                                            </div>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-16">
                                         <div className="text-right">
                                            <p className="text-[18px] font-bold text-white tabular leading-none">
                                                {flat.monthKwh || '0'} <span className="text-[11px] font-medium text-slate-500 uppercase tracking-tighter ml-1">kWh</span>
                                            </p>
                                            <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-widest mt-2">Aggregated usage</p>
                                         </div>
                                         <div className="p-3 bg-white/5 rounded-2xl text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-400/10 transition-all shadow-xl">
                                            <ChevronRight size={20} />
                                         </div>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
