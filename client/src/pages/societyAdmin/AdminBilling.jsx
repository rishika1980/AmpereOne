import { useState, useEffect } from 'react';
import { 
  ReceiptText, Download, Edit3, Zap, 
  Wallet, Calendar, BarChart3, Building2, Info,
  ArrowRight, CheckCircle2, Loader2, ChevronRight,
  TrendingUp, Leaf, Globe, Search, Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Layout from '../../components/layout/Layout';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import { Skeleton } from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';

export default function AdminBilling() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Tariff');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState([]);
  const [commonAreas, setCommonAreas] = useState([]);
  const [billingStep, setBillingStep] = useState(0); // 0: Idle, 1: Scanning, 2: Calculating, 3: Finalizing
  const [isGenerating, setIsGenerating] = useState(false);

  const socId = user.societyId._id || user.societyId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resOverview, resHistory, resCommon] = await Promise.all([
          api.get(`/societies/${socId}/overview`),
          api.get(`/societies/${socId}/billing-history`),
          api.get(`/societies/${socId}/common-areas`)
        ]);
        setOverview(resOverview.data.data || resOverview.data);
        setHistory(resHistory.data.data || resHistory.data);
        setCommonAreas(resCommon.data.data?.list || resCommon.data.list || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load billing telemetry');
      } finally {
        setLoading(false);
      }
    };
    if (socId) fetchData();
  }, [socId]);

  const tabs = ['Tariff', 'Bills', 'Common areas'];

  const tariffRanges = [
    { range: '0-100', rate: 1.5, desc: 'Lifeline consumption tier' },
    { range: '101-300', rate: 3.0, desc: 'Standard residential load' },
    { range: '301-500', rate: 5.0, desc: 'Enhanced appliance usage' },
    { range: '501-800', rate: 7.0, desc: 'Heavy load / Multiple ACs' },
    { range: '801-above', rate: 9.5, desc: 'Industrial / Commercial grade' },
  ];

  const handleGenerateBills = async () => {
    setIsGenerating(true);
    setBillingStep(1);
    
    // Simulate orchestration
    await new Promise(r => setTimeout(r, 1500));
    setBillingStep(2);
    await new Promise(r => setTimeout(r, 2000));
    setBillingStep(3);
    await new Promise(r => setTimeout(r, 1500));
    
    toast.success('Billing ledger generated for 84 endpoints ✓');
    setIsGenerating(false);
    setBillingStep(0);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans page-enter relative overflow-hidden">
        
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Header Section */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-16">
            <div>
              <h1 className="text-[36px] font-semibold text-white tracking-tighter leading-none">Billing & Revenue</h1>
              <p className="text-slate-500 text-[15px] font-medium mt-4 tracking-tight">
                 Configure energy tariffs and orchestrate monthly billing cycles for the entire society grid.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
               {isGenerating ? (
                 <div className="px-8 py-3.5 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-4 min-w-[280px]">
                    <Loader2 size={18} className="animate-spin text-indigo-400" />
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                          {billingStep === 1 && 'Scanning M-Bus Grid...'}
                          {billingStep === 2 && 'Calculating Tariffs...'}
                          {billingStep === 3 && 'Finalizing Ledger...'}
                       </p>
                       <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all duration-500" 
                            style={{ width: `${(billingStep / 3) * 100}%` }} 
                          />
                       </div>
                    </div>
                 </div>
               ) : (
                <button 
                  onClick={handleGenerateBills}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[12px] font-semibold uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                >
                  <ReceiptText size={18} /> Run monthly cycle
                </button>
               )}
            </div>
          </div>

          {/* Navigation Hub */}
          <div className="flex bg-[#0F172A]/80 border border-white/5 p-1.5 rounded-2xl w-fit mb-16 shadow-2xl backdrop-blur-xl">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-10 py-3 rounded-xl text-[12px] font-semibold tracking-wide transition-all ${
                  activeTab === tab 
                    ? 'bg-slate-800 text-white shadow-xl ring-1 ring-white/10' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-12 page-enter">
            
            {/* TARIFF TAB SECTION */}
            {activeTab === 'Tariff' && (
              <div className="grid grid-cols-12 gap-10">
                <div className="col-span-12 lg:col-span-8 bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 md:p-12 relative overflow-hidden group backdrop-blur-md shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-12 relative z-10">
                    <div>
                      <h3 className="text-[22px] font-semibold text-white tracking-tight">Active electricity tariff</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-[0.2em]">TSSPDCL Domestic • Region A-12 • Cycle 2026</p>
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto relative z-10">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consumption range (kWh)</th>
                          <th className="text-left py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:table-cell">Tier Description</th>
                          <th className="text-right py-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rate / Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {tariffRanges.map((r, i) => (
                          <tr key={i} className="group/row hover:bg-white/[0.02] transition-all">
                            <td className="py-6 text-[15px] font-semibold text-white">{r.range}</td>
                            <td className="py-6 text-[13px] font-medium text-slate-500 hidden md:table-cell">{r.desc}</td>
                            <td className="py-6 text-right text-[16px] font-bold text-white tracking-tight tabular-nums group-hover/row:text-indigo-400 transition-colors">
                               ₹{r.rate.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                   {[
                     { label: 'Fixed charge', value: '₹25.00', icon: Zap, color: 'text-indigo-400', sub: 'Per connection' },
                     { label: 'Government Duty', value: '5.2%', icon: BarChart3, color: 'text-emerald-400', sub: 'Regulatory tax' },
                     { label: 'Aggregated Average', value: '₹6.40', icon: TrendingUp, color: 'text-indigo-400', sub: 'Society performance' }
                   ].map((m, i) => (
                     <div key={i} className="bg-[#0F172A]/40 border border-white/5 p-8 rounded-[36px] backdrop-blur-md transition-all hover:border-white/10 group shadow-xl">
                        <div className="flex items-center gap-4 mb-6">
                           <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${m.color}`}>
                              <m.icon size={18} />
                           </div>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</p>
                        </div>
                        <p className={`text-[32px] font-semibold tracking-tighter text-white mb-2`}>{m.value}</p>
                        <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">{m.sub}</p>
                     </div>
                   ))}
                   
                   <div className="p-8 bg-indigo-600/5 border border-indigo-500/10 rounded-[36px] shadow-2xl backdrop-blur-md">
                      <div className="flex gap-4">
                         <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                         <div>
                            <p className="text-[11px] font-semibold text-white tracking-tight leading-relaxed">
                               Billing Intelligence: Rates are synchronized with state electricity board (TSSPDCL) regulation 2026.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* BILLS TAB SECTION */}
            {activeTab === 'Bills' && (
              <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { label: 'Active society load', value: `${(overview?.monthKwh || 0).toLocaleString()} kWh`, sub: 'Current monthly throughput', icon: Zap, color: 'text-indigo-400' },
                    { label: 'Projected revenue', value: `₹${(overview?.estimatedCost || 0).toLocaleString()}`, sub: 'Estimated recovery this cycle', icon: Wallet, color: 'text-emerald-400' },
                    { label: 'Next Cycle Date', value: '01 May 2026', sub: 'Automatic trigger enabled', icon: Calendar, color: 'text-indigo-400' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#0F172A]/40 border border-white/5 p-10 rounded-[44px] group hover:border-indigo-500/20 transition-all flex flex-col justify-between h-56 backdrop-blur-md shadow-2xl">
                      <div className="flex items-center justify-between">
                         <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                            <stat.icon size={22} />
                         </div>
                         <Badge status="green">Nominal</Badge>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">{stat.label}</p>
                        {loading ? <Skeleton className="h-10 w-32" /> : <p className={`text-[36px] font-semibold tracking-tighter text-white tabular leading-none`}>{stat.value}</p>}
                        <p className="text-[11px] font-medium text-slate-600 mt-3 tracking-tight">{stat.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 md:p-12 backdrop-blur-md shadow-2xl relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                     <div>
                        <h3 className="text-[22px] font-semibold text-white tracking-tight">Financial Ledger</h3>
                        <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-[0.2em]">Historical society-level billing records</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="relative">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                           <input type="text" placeholder="Search months..." className="bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-[12px] outline-none focus:ring-1 ring-indigo-500/30 text-white w-full sm:w-48" />
                        </div>
                        <button className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
                           <Filter size={18} />
                        </button>
                     </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left pb-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Billing Period</th>
                          <th className="text-center pb-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Active Units</th>
                          <th className="text-center pb-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Total Consumption</th>
                          <th className="text-center pb-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Society Revenue</th>
                          <th className="text-right pb-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {loading ? Array.from({length: 3}).map((_, i) => (
                           <tr key={i}><td colSpan={5} className="py-4"><Skeleton className="h-10 w-full" /></td></tr>
                        )) : history.map((bill, i) => (
                          <tr key={i} className="group/row hover:bg-white/[0.01] transition-all">
                            <td className="py-8 text-[15px] font-semibold text-white flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 group-hover/row:text-indigo-400 transition-all">
                                  <BarChart3 size={18} />
                               </div>
                               {bill.month}
                            </td>
                            <td className="py-8 text-center text-[15px] font-semibold text-white">{bill.flats}</td>
                            <td className="py-8 text-center text-[15px] font-semibold text-indigo-400 tabular-nums">{bill.kwh} <span className="text-[10px] text-slate-600 font-bold ml-1">kWh</span></td>
                            <td className="py-8 text-center text-[15px] font-bold text-white tracking-tight tabular-nums">₹{bill.revenue}</td>
                            <td className="py-8 text-right">
                               <button className="px-5 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-500/20 transition-all shadow-lg">
                                  <Download className="inline mr-2" size={14} /> Export XLS
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* COMMON AREAS TAB SECTION */}
            {activeTab === 'Common areas' && (
              <div className="grid grid-cols-12 gap-10">
                 <div className="col-span-12 lg:col-span-7 bg-[#0F172A]/40 border border-white/5 rounded-[44px] p-10 md:p-12 relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="flex items-center justify-between mb-12">
                       <div>
                          <h3 className="text-[22px] font-semibold text-white tracking-tight">Common infrastructure partition</h3>
                          <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-[0.2em]">Shared load monitoring and cost distribution</p>
                       </div>
                       <Building2 size={32} className="text-slate-800" />
                    </div>
                    
                    <div className="space-y-6">
                      {loading ? Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-3xl" />) : commonAreas.map((area, i) => (
                        <div key={i} className="flex items-center justify-between p-7 bg-slate-900/50 border border-white/5 rounded-[32px] group hover:border-indigo-500/30 transition-all shadow-xl">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-all border border-white/5">
                                <Zap size={20} />
                             </div>
                             <div>
                                <p className="text-[17px] font-semibold text-white tracking-tight leading-none">{area.name}</p>
                                <p className="text-[10px] font-semibold text-slate-600 mt-2 tracking-widest uppercase">Grid Node: {area.deviceSerial || 'AE-8902'}</p>
                             </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[20px] font-bold text-white tracking-tighter tabular-nums">{area.currentKw || '0.00'} <span className="text-[10px] text-slate-600 font-bold uppercase ml-1">kW</span></p>
                            <Badge status="green">Live telemetry</Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 pt-10 border-t border-white/5 flex items-center justify-between relative z-10">
                       <div>
                         <p className="text-[14px] font-semibold text-slate-400">Total shared footprint</p>
                         <p className="text-[10px] font-bold text-slate-600 mt-1.5 tracking-widest uppercase">Partitioned across 84 units</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[28px] font-semibold text-emerald-400 tracking-tighter tabular-nums leading-none">
                             {(commonAreas.reduce((s, a) => s + (a.currentKw || 0), 0)).toFixed(2)} <span className="text-xs uppercase ml-1">kW</span>
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="p-10 bg-[#0F172A]/40 border border-white/5 rounded-[44px] shadow-2xl backdrop-blur-md">
                        <div className="flex items-center gap-4 mb-8">
                           <div className="p-3 bg-indigo-500/10 rounded-2xl">
                              <Info size={22} className="text-indigo-400" />
                           </div>
                           <h4 className="text-[18px] font-semibold text-white tracking-tight">Calculation Engine</h4>
                        </div>
                        <div className="space-y-6">
                           <div className="flex gap-5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                              <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                                 Common area units are metered separately at the society transformer gateway.
                              </p>
                           </div>
                           <div className="flex gap-5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                              <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                                 The total monthly cost is subdivided equally across all <span className="text-white font-semibold">active residents</span>.
                              </p>
                           </div>
                           <div className="flex gap-5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                              <p className="text-[13px] text-slate-400 leading-relaxed font-medium">
                                 Cost attribution happens during the monthly finalization cycle.
                              </p>
                           </div>
                        </div>
                    </div>

                    <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[44px] shadow-2xl backdrop-blur-md group hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-4 mb-6">
                           <Leaf size={24} className="text-emerald-400" />
                           <h4 className="text-[18px] font-semibold text-white tracking-tight">ESG Performance</h4>
                        </div>
                        <p className="text-[12px] text-slate-500 leading-relaxed font-medium mb-8">
                           Efficient distribution detected. Common area load is <span className="text-emerald-400">12.4% below</span> regional benchmark.
                        </p>
                        <button 
                          onClick={() => toast.success('Simulation: Initiating ESG deep-dive audit...')}
                          className="w-full py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-emerald-500/20 transition-all font-bold"
                        >
                           Sustainability Audit
                        </button>
                    </div>
                 </div>
              </div>
            )}

          </div>
          
          <div className="h-20" />
        </div>
      </div>
    </Layout>
  );
}
