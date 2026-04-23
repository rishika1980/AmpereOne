import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Zap, User, Lock, Activity, BarChart3, Shield } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const ROLES = [
  { key: 'flat_owner', label: 'Resident' },
  { key: 'society_admin', label: 'Admin' },
  { key: 'builder_admin', label: 'Builder' }
];

const DEMO = {
  flat_owner:    { email: 'resident@ampereone.io', password: 'Resident@123' },
  society_admin: { email: 'admin@ampereone.io', password: 'Admin@123' },
  builder_admin: { email: 'builder@ampereone.io', password: 'Builder@123' }
};

const REDIRECTS = {
  flat_owner: '/flat',
  society_admin: '/admin',
  builder_admin: '/builder'
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [role, setRole] = useState('flat_owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 400); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { 
        setError('Credentials required'); 
        triggerShake(); 
        return; 
    }
    
    setLoading(true); 
    setError('');
    const t = toast.loading('Establishing secure session...');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      toast.success(`Access Granted: ${res.data.user.name.split(' ')[0]}`, { id: t });
      navigate(REDIRECTS[res.data.user.role] || '/login');
    } catch (e) {
      console.error(e);
      setError(e.message || 'Authentication failed. Check credentials.');
      toast.error(e.message || 'Access Denied', { id: t });
      triggerShake();
    } finally { 
      setLoading(false); 
    }
  };

  const fillDemo = (r) => { 
    setRole(r); 
    setEmail(DEMO[r].email); 
    setPassword(DEMO[r].password); 
    setError(''); 
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#020617] font-sans overflow-hidden">
      
      {/* Left Panel - Branding & Identity */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16 bg-[#020617] relative border-r border-white/5">
        {/* Decorative Mesh Gradient */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#6366F1] shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-transform hover:scale-110">
            <span className="text-white font-bold text-lg italic tracking-tighter">A1</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">AmpereOne</span>
        </div>

        <div className="max-w-md relative z-10">
          <h1 className="text-white text-[56px] font-bold leading-[1.05] tracking-tighter mb-8">
            Strategic energy <br />
            <span className="text-indigo-400">intelligence.</span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-500 font-medium mb-12">
            Next-generation IoT monitoring for modern housing infrastructure. Precision visibility at every node.
          </p>
          
          <div className="space-y-8 mt-12">
            {[
              { label: 'Real-time Telemetry', sub: 'Edge-based analytics with millisecond latency.', icon: Activity, color: 'text-indigo-400' },
              { label: 'Automated Billing', sub: 'Proprietary load forecasting & slab optimization.', icon: BarChart3, color: 'text-emerald-400' },
              { label: 'Enterprise Security', sub: 'AES-256 encrypted infrastructure protocols.', icon: Shield, color: 'text-indigo-400' },
            ].map(item => (
              <div key={item.label} className="flex gap-5">
                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0 ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-[16px] mb-1">{item.label}</h4>
                  <p className="text-slate-500 text-[13px] font-medium leading-normal">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-700 relative z-10">
          © 2026 AmpereOne • Strategic Intelligence Systems
        </div>
      </div>

      {/* Right Panel - Authentication Console */}
      <div className="flex-1 flex items-center justify-center bg-[#0B0F1A] p-6 lg:p-12 relative overflow-hidden">
        {/* Mobile-only background glow */}
        <div className="lg:hidden absolute inset-0 bg-[#020617] pointer-events-none" />
        <div className="lg:hidden absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className={`w-full max-w-[460px] relative z-10 ${shake ? 'animate-shake' : ''}`}>
          
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#6366F1] shadow-[0_0_20px_rgba(99,102,241,0.3)] mb-5">
              <span className="text-white font-bold text-base italic tracking-tighter">A1</span>
            </div>
            <h2 className="text-white font-bold text-2xl tracking-tight">AmpereOne</h2>
          </div>

          <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-1000">
            
            <div className="mb-10 text-left">
              <h2 className="text-[26px] font-bold text-white mb-2 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-[14px] font-medium leading-relaxed">Sign in to your AmpereOne account</p>
            </div>

            {/* Role Selector */}
            <div className="bg-slate-950/60 rounded-[18px] p-1.5 flex gap-1 mb-10 border border-white/5 relative">
              {ROLES.map(r => (
                <button 
                  key={r.key} 
                  onClick={() => { setRole(r.key); setError(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 relative z-10
                    ${role === r.key ? 'text-[#020617]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}
              <div 
                className="absolute top-1.5 left-1.5 bottom-1.5 bg-indigo-500 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                style={{ 
                  width: 'calc(33.33% - 4px)', 
                  transform: `translateX(${role === 'flat_owner' ? '0' : role === 'society_admin' ? '100%' : '200%'})` 
                }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@ampereone.io"
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl text-[14px] font-bold text-white outline-none transition-all border
                      focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5
                      ${error ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5 bg-slate-950/60'}`} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-14 pl-12 pr-12 rounded-2xl text-[14px] font-bold text-white outline-none transition-all border
                      focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5
                      ${error ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/5 bg-slate-950/60'}`} 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-[12px] text-rose-500 font-bold text-center animate-in slide-in-from-top-1">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full h-14 rounded-2xl text-[15px] font-bold text-[#020617] transition-all flex items-center justify-center gap-3 bg-indigo-500 hover:bg-indigo-400 shadow-[0_10px_30px_rgba(99,102,241,0.3)] mt-4 group disabled:opacity-50">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#020617]/20 border-t-[#020617] rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
               <p className="text-slate-500 text-[13px] font-medium">
                 Need an account? {' '}
                 <button onClick={() => navigate('/register')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign Up</button>
               </p>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
