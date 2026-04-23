import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { IndianRupee, Download, Info, CheckCircle2, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import Layout from '../../components/layout/Layout';
import { Skeleton } from '../../components/ui/Skeleton';
import { currency, greeting } from '../../utils/helpers';

const COLORS = {
  primary: '#6366F1', // Electric Indigo
  secondary: '#F43F5E', // Rose
  tertiary: '#F59E0B', // Amber
  quaternary: '#10B981', // Emerald
  info: '#0EA5E9', // Sky
  gray: '#64748B',
  bg: '#020617', // Slate 950
  card: '#0F172A', // Slate 900
  border: 'rgba(255,255,255,0.03)',
};

export default function FlatBills() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Slab Logic Calculation (matching Slide 2)
  const calculateSlabs = (units) => {
    let breakdown = [];
    let remaining = units;
    
    // Slab 1: 0-100 @ 1.5
    const s1 = Math.min(100, remaining);
    breakdown.push({ range: '0–100', used: s1, rate: 1.5, amount: s1 * 1.5 });
    remaining -= s1;

    // Slab 2: 101-300 @ 3.0
    if (remaining > 0) {
      const s2 = Math.min(200, remaining);
      breakdown.push({ range: '101–300', used: s2, rate: 3.0, amount: s2 * 3.0 });
      remaining -= s2;
    }

    // Slab 3: 301+ @ 5.0
    if (remaining > 0) {
      breakdown.push({ range: `301–${units}`, used: remaining, rate: 5.0, amount: remaining * 5.0 });
    }

    const energyCharges = breakdown.reduce((acc, s) => acc + s.amount, 0);
    const fixedCharge = 25;
    const commonArea = 109;
    const duty = Math.round(energyCharges * 0.05);
    const total = energyCharges + fixedCharge + commonArea + duty;

    return { breakdown, energyCharges, fixedCharge, commonArea, duty, total };
  };

      const billDetails = useMemo(() => {
    if (!summary) return { breakdown: [], energyCharges: 0, fixedCharge: 0, commonArea: 0, duty: 0, total: 0 };
    return calculateSlabs(summary.totalKwh || 0);
  }, [summary]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const flatId = user?.flatId?._id || user?.flatId;
        if (!flatId) return;
        const res = await api.get(`/flats/${flatId}/summary`);
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to fetch bill summary:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [user?.flatId]);

  const handleDownload = (month) => {
    const t = toast.loading(`Generating invoice for ${month}...`);
    setTimeout(() => {
      toast.success(`Invoice for ${month} downloaded successfully.`, { id: t });
    }, 2000);
  };
  if (loading) {
    return (
      <Layout>
        <div className="p-8 space-y-8 bg-[#020617] min-h-screen">
          <Skeleton width={300} height={40} className="bg-slate-800" />
          <Skeleton height={200} className="rounded-[32px] bg-slate-800" />
          <Skeleton height={400} className="rounded-[32px] bg-slate-800" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-8 pb-32 animate-in fade-in duration-700 bg-[#020617] min-h-screen font-sans">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">My Bills</h1>
            <p className="text-slate-500 text-[14px] font-medium mt-3">
               Flat {user?.flatId?.flatNumber || 'B-204'} · {user?.societyId?.name || 'Green Valley Apartments'}
            </p>
          </div>
        </header>

        {/* Section 1: Bill Preview */}
        <div className="bg-[#0F172A] border border-white/5 rounded-[32px] p-6 sm:p-10 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-6">
               Estimated — not your final bill
            </div>
            <h2 className="text-[24px] font-bold text-white tracking-tight">Your {new Date().toLocaleString('default', { month: 'long' })} bill preview</h2>
            <p className="text-[13px] text-slate-500 font-medium mt-1 uppercase tracking-wider">Bill generates on 1 {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:border-white/10 group">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Units used</span>
              <span className="text-[42px] font-bold text-white tabular-nums tracking-tighter group-hover:scale-110 transition-transform">{summary?.totalKwh || 0}</span>
            </div>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:border-white/10 group">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Days remaining</span>
              <span className="text-[42px] font-bold text-white tabular-nums tracking-tighter group-hover:scale-110 transition-transform">{summary ? (summary.daysInMonth - summary.daysElapsed) : '--'}</span>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center transition-all hover:border-emerald-500/20 group shadow-[0_0_30px_rgba(16,185,129,0.05)]">
              <span className="text-[11px] font-semibold text-emerald-500/60 uppercase tracking-widest mb-4">Est. total</span>
              <span className="text-[42px] font-bold text-emerald-400 tabular-nums tracking-tighter group-hover:scale-110 transition-transform">₹{billDetails?.total?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: How your bill is calculated */}
        <div className="bg-[#0F172A] border border-white/5 rounded-[32px] p-6 sm:p-10 mb-10 shadow-2xl">
          <div className="mb-10">
            <h3 className="text-[20px] font-bold text-white tracking-tight">How your bill is calculated</h3>
            <p className="text-[11px] text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-60">Based on domestic tariff structure</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-6 w-1/3">Units range</th>
                  <th className="pb-6 text-right">Units used</th>
                  <th className="pb-6 text-right">Rate</th>
                  <th className="pb-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {billDetails?.breakdown.length > 0 ? (
                  billDetails.breakdown.map((s, i) => (
                    <tr key={i} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="py-6 text-[14px] font-medium text-slate-400">{s.range}</td>
                      <td className="py-6 text-right text-[14px] font-bold text-slate-300 tabular-nums">{s.used}</td>
                      <td className="py-6 text-right text-[14px] font-medium text-slate-400">₹{s.rate.toFixed(1)}</td>
                      <td className="py-6 text-right text-[14px] font-bold text-white tabular-nums">₹{s.amount.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-600 text-[13px] italic">No active consumption detected yet.</td>
                  </tr>
                )}
                {billDetails?.total > 0 && (
                  <>
                    <tr>
                      <td className="py-6 text-[14px] font-medium text-slate-500">Fixed monthly charge</td>
                      <td colSpan={2}></td>
                      <td className="py-6 text-right text-[14px] font-bold text-white">₹{billDetails?.fixedCharge}</td>
                    </tr>
                    <tr>
                      <td className="py-6 text-[14px] font-medium text-slate-500">Common area charge</td>
                      <td colSpan={2}></td>
                      <td className="py-6 text-right text-[14px] font-bold text-white">₹{billDetails?.commonArea}</td>
                    </tr>
                    <tr>
                      <td className="py-6 text-[14px] font-medium text-slate-500">Electricity duty (5%)</td>
                      <td colSpan={2}></td>
                      <td className="py-6 text-right text-[14px] font-bold text-white">₹{billDetails?.duty}</td>
                    </tr>
                  </>
                )}
                <tr className="border-t border-white/10">
                  <td className="pt-8 text-[18px] font-bold text-white uppercase tracking-widest">Total</td>
                  <td colSpan={2}></td>
                  <td className="pt-8 text-right text-[24px] font-bold text-emerald-400 tabular-nums">₹{billDetails?.total?.toLocaleString() || '0'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Previous Bills */}
        <div className="bg-[#0F172A] border border-white/5 rounded-[32px] p-10 shadow-2xl mt-12">
          <div className="mb-10">
            <h3 className="text-[20px] font-bold text-white tracking-tight">Previous bills</h3>
          </div>

          <div className="space-y-4">
             {/* Dynamic Billing List will be implemented when backend API for archived bills is ready */}
             <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl">
                <FileText size={40} className="mx-auto text-slate-800 mb-4" />
                <p className="text-slate-600 text-[13px] font-medium italic">No historical invoices found for this meter node.</p>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
