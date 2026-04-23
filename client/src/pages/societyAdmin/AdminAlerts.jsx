import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';
import { Bell, ShieldAlert, Cpu, CheckCircle2, Search, Filter, MoreVertical, Activity, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { usePoll } from '../../hooks/usePoll';
import api from '../../api/axios';
import { Skeleton } from '../../components/ui/Skeleton';

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now - date;
  const diffInHrs = Math.floor(diffInMs / (1000 * 60 * 60));
  
  if (diffInHrs < 1) return 'Just now';
  if (diffInHrs < 24) return `${diffInHrs} hrs ago`;
  return `${Math.floor(diffInHrs / 24)} days ago`;
};

export default function AdminAlerts() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const socId = user.societyId?._id || user.societyId;

  usePoll(async () => {
    try {
      const res = await api.get(`/societies/${socId}/alerts`);
      setAlerts(res.data.data || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, 10000, [socId]);

  const filteredAlerts = activeTab === 'All' ? alerts : alerts.filter(a => a.category === activeTab);
  
  const escalationCount = alerts.filter(a => a.category === 'Escalations').length;
  const needsAttentionCount = alerts.filter(a => a.needsAttention).length;

  const tabs = [
    { name: 'All', count: null },
    { name: 'Escalations', count: escalationCount > 0 ? escalationCount : null },
    { name: 'Device health', count: null },
    { name: 'Approvals', count: alerts.filter(a => a.category === 'Approvals').length || null }
  ];

  const handleResolve = async (id) => {
    try {
      setAlerts(prev => prev.filter(a => a.id !== id));
      await api.patch(`/societies/alerts/${id}/resolve`);
      toast.success('Alert resolved');
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  const handleApprove = async (id) => {
    const loadingToast = toast.loading('Processing approval...');
    try {
      setAlerts(prev => prev.filter(a => a.id !== id));
      await api.post(`/societies/alerts/${id}/approve`);
      toast.dismiss(loadingToast);
      toast.success('Resident approved ✓');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id) => {
    const loadingToast = toast.loading('Rejecting application...');
    try {
      setAlerts(prev => prev.filter(a => a.id !== id));
      await api.post(`/societies/alerts/${id}/reject`);
      toast.dismiss(loadingToast);
      toast.success('Application rejected');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Rejection failed');
    }
  };

  const handleRecheck = async (id) => {
    const loadingToast = toast.loading('Initiating system diagnostic...');
    try {
      await api.post(`/societies/alerts/${id}/recheck`);
      setAlerts(prev => prev.filter(a => a.id !== id));
      toast.dismiss(loadingToast);
      toast.success('System diagnostic complete. Device nominal.');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Diagnostic failed');
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-8 lg:p-12 bg-[#020617] min-h-screen font-sans page-enter relative overflow-hidden">
        {/* Background Gradients from Dashboard */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-[32px] font-semibold text-white tracking-tight leading-tight">Alerts</h1>
              <p className="text-slate-500 text-[15px] font-medium mt-1">
                {alerts.length} total • {needsAttentionCount} {needsAttentionCount === 1 ? 'need' : 'need'} attention
              </p>
            </div>
            <button 
              className="text-xs font-semibold text-emerald-400 hover:underline underline-offset-4 transition-all" 
              onClick={() => toast.success('All marked as read')}
            >
              Mark all as read
            </button>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex bg-[#0F172A] border border-white/5 rounded-2xl p-1.5 w-fit shadow-2xl">
              {tabs.map(tab => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-6 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === tab.name ? 'bg-slate-800 text-white shadow-xl ring-1 ring-white/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {tab.name}
                  {tab.count && (
                    <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-md text-[10px] font-bold border border-rose-500/10">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {loading && alerts.length === 0 ? Array.from({length: 3}).map((_, i) => (
                <div key={i} className="h-28 bg-[#0F172A]/40 animate-pulse rounded-[32px] border border-white/5 shadow-2xl" />
              )) : filteredAlerts.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
                  <div className="h-16 w-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-text-muted" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">System status nominal</h3>
                  <p className="text-text-muted text-sm px-4 mt-2">All filtered alerts have been resolved.</p>
                </div>
              ) : filteredAlerts.map(alert => (
                <div key={alert.id} className="bg-[#0F172A]/40 border border-white/5 p-8 rounded-[32px] flex flex-col sm:flex-row sm:items-center justify-between group hover:border-white/10 transition-all gap-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                  <div className="flex items-start gap-6 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-4 mb-2">
                            <h4 className="text-[18px] font-bold text-white tracking-tight">{alert.title}</h4>
                            {alert.needsAttention && (
                              <span className="bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase px-3 py-1 rounded-lg border border-rose-500/10 tracking-widest leading-none">
                                Needs attention
                              </span>
                            )}
                        </div>
                        <p className="text-[14px] text-slate-400/80 font-medium leading-relaxed max-w-xl">{alert.desc}</p>
                        <div className="flex items-center gap-2 mt-4 text-slate-600">
                          <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{formatTime(alert.time)}</span>
                        </div>
                      </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 relative z-10">
                      {alert.category === 'Approvals' ? (
                        <>
                          <button 
                            onClick={() => handleApprove(alert.id)} 
                            className="px-6 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleReject(alert.id)} 
                            className="px-6 py-2.5 bg-slate-800/40 text-slate-400 border border-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl"
                          >
                            Reject
                          </button>
                        </>
                      ) : alert.category === 'Device health' ? (
                        <button 
                          onClick={() => handleRecheck(alert.id)} 
                          className="px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl"
                        >
                          Re-check
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          {alert.flatId && (
                            <button 
                              onClick={() => navigate(`/admin/flats/${alert.flatId}/analytics`)}
                              className="px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl"
                            >
                              View
                            </button>
                          )}
                          <button 
                            onClick={() => handleResolve(alert.id)} 
                            className="px-6 py-3 border border-white/5 bg-slate-800/20 text-slate-500 hover:text-white hover:border-white/20 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-xl"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
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

