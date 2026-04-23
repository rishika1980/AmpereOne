import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Zap, IndianRupee, Lightbulb, Settings, CheckCircle2, Info, X } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, LineChart, Line, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import Layout from '../../components/layout/Layout';
import Badge from '../../components/ui/Badge';

const COLORS = {
  primary: '#6366F1', // Electric Indigo
  secondary: '#F43F5E', // Rose
  tertiary: '#F59E0B', // Amber
  quaternary: '#10B981', // Emerald
  info: '#0EA5E9', // Sky
  gray: '#64748B',
  bg: '#020617', // Slate 950
  card: '#0F172A', // Slate 900
};

export default function FlatAlerts() {
  const [filter, setFilter] = useState('All');
  const [notifications, setNotifications] = useState([
    { 
      id: 1, 
      category: 'Alerts', 
      type: 'warning',
      title: 'Unusual activity in your flat', 
      desc: 'Your flat drew 4.8 kWh between 2–3 AM — about 4× your usual overnight load. Everything okay?', 
      time: '2 hrs ago',
      unread: true,
      icon: Zap,
      actions: ['View usage', 'This seems fine']
    },
    { 
      id: 2, 
      category: 'Bills', 
      type: 'info',
      title: 'Your bill generates tomorrow', 
      desc: 'Estimated total: ₹1,340. Review your usage today.', 
      time: 'Yesterday',
      unread: true,
      icon: IndianRupee 
    },
    { 
      id: 3, 
      category: 'Insights', 
      type: 'highlight',
      title: 'Weekly highlight', 
      desc: 'Your quietest day was Sunday — just 2.1 kWh.', 
      time: '3 days ago',
      unread: false,
      icon: Lightbulb
    },
    { 
      id: 4, 
      category: 'Alerts', 
      type: 'warning',
      title: '80% of monthly limit reached', 
      desc: 'You\'ve used 720 of 900 units. 20 days remaining in this billing cycle.', 
      time: '5 days ago',
      unread: false,
      icon: Zap 
    },
    { 
      id: 5, 
      category: 'Alerts', 
      type: 'system',
      title: 'Meter reconnected', 
      desc: 'Meter reconnected — live readings resumed.', 
      time: '1 week ago',
      unread: false,
      icon: Settings 
    }
  ]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('All notifications marked as read', {
       style: { background: '#0F172A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }
    });
  };

  const handleAction = (id, action) => {
    if (action === 'This seems fine') {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Activity cleared');
    } else {
      toast(`Action "${action}" triggered for item #${id}`);
    }
  };

  const filtered = notifications.filter(n => filter === 'All' || n.category === filter);
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <Layout>
      <div className="p-4 sm:p-8 pb-32 max-w-5xl mx-auto animate-in fade-in duration-1000 bg-[#020617] min-h-screen">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold text-white tracking-tight leading-none">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-slate-500 text-[14px] font-medium mt-3 tracking-tight">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-[13px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors py-1"
            >
              Mark all as read
            </button>
          )}
        </header>

        {/* Tab System */}
        <div className="flex flex-wrap items-center p-1.5 bg-[#0F172A] border border-white/5 rounded-2xl w-fit mb-12 gap-1 shadow-2xl">
          {['All', 'Alerts', 'Bills', 'Insights'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all
                ${filter === t 
                  ? 'bg-slate-800 text-white shadow-xl ring-1 ring-white/10' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filtered.length > 0 ? filtered.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.id} 
                className={`bg-[#0F172A]/40 border border-white/5 p-4 sm:p-8 rounded-[24px] flex flex-col sm:flex-row items-start gap-4 sm:gap-8 transition-all hover:bg-[#0F172A]/70 group relative overflow-hidden
                  ${item.unread ? 'border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.03)]' : ''}`}
              >
                {/* Unread Indicator Dot */}
                {item.unread && (
                  <div className="absolute top-8 left-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 bg-slate-900 shadow-xl
                  ${item.type === 'warning' ? 'text-rose-400' : ''}
                  ${item.type === 'info' ? 'text-emerald-400' : ''}
                  ${item.type === 'highlight' ? 'text-amber-400' : ''}
                  ${item.type === 'system' ? 'text-slate-400' : ''}
                `}>
                  <Icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-[18px] font-bold text-white tracking-tight leading-tight group-hover:text-indigo-200 transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-[12px] font-medium text-slate-500 tracking-tight shrink-0 mt-1">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-400/80 leading-relaxed font-medium tracking-tight mb-6">
                    {item.desc}
                  </p>

                  {/* Actions Area */}
                  {item.actions && (
                    <div className="flex items-center gap-3">
                      {item.actions.map((act) => (
                        <button
                          key={act}
                          onClick={() => handleAction(item.id, act)}
                          className={`px-5 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95
                            ${act === 'View usage' || act === 'Pay now'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' 
                              : 'bg-slate-800/40 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'}`}
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto mb-6 text-slate-600">
                <Bell size={24} />
              </div>
              <p className="text-slate-500 font-medium">No {filter.toLowerCase()} yet.</p>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
