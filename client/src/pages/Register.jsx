import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Building2, LayoutGrid, ArrowRight, CheckCircle2, ShieldCheck, ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ROLES = [
  { key: 'flat_owner', label: 'Resident' },
  { key: 'society_admin', label: 'Admin' },
  { key: 'builder_admin', label: 'Builder' }
];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState('flat_owner');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [flatId, setFlatId] = useState('');
  const [societyId, setSocietyId] = useState('');
  const [flats, setFlats] = useState([]);
  const [societyName, setSocietyName] = useState('');

  // Auto-fetch flats when code is entered
  useEffect(() => {
    const fetchSociety = async () => {
      if (code.length === 6 && role === 'flat_owner') {
        setVerifying(true);
        try {
          const res = await api.get(`/auth/verify-society/${code}`);
          // res is { success, data: { id, name, flats } }
          const societyData = res.data || res; // Fallback in case of interceptor differences
          
          if (societyData.flats) {
            setFlats(societyData.flats);
            setSocietyName(societyData.name);
            setSocietyId(societyData.id || societyData._id);
            toast.success(`Society Linked: ${societyData.name}`);
          } else {
            setFlats([]);
            toast.error('No flats found for this society');
          }
        } catch (err) {
          setFlats([]);
          setSocietyName('');
          setSocietyId('');
          toast.error('Invalid Society Code');
        } finally {
          setVerifying(false);
        }
      }
    };

    const timer = setTimeout(fetchSociety, 500);
    return () => clearTimeout(timer);
  }, [code, role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Basic details required');
    
    if (role === 'flat_owner') {
      if (!code) return toast.error('Society code required');
      if (!flatId) return toast.error('Please enter your flat number');
    }

    setLoading(true);
    try {
      // Find if flatId is a selected ID or just a typed number
      const selectedFlat = flats.find(f => f.number === flatId || f.id === flatId);
      
      await api.post('/auth/register', {
        name, email, password,
        societyId: selectedFlat?.societyId || societyId,
        flatId: selectedFlat?.id || null, // If null, backend uses flatNumber
        flatNumber: selectedFlat?.number || flatId,
        role,
        code: code.trim().toUpperCase()
      });
      setSuccess(true);
      toast.success('Registration successful');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-[480px] w-full bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-[40px] p-12 text-center animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 text-emerald-400">
             <CheckCircle2 size={48} />
           </div>
           <h2 className="text-[32px] font-bold text-white mb-4 tracking-tight">Success!</h2>
           <p className="text-slate-500 text-[16px] font-medium leading-relaxed mb-10">
             Your account request has been submitted. Please wait for the administrator to approve your access.
           </p>
           <button onClick={() => navigate('/login')} className="w-full h-14 bg-indigo-500 hover:bg-indigo-400 text-[#020617] font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
             Back to Sign In <ArrowRight size={18} />
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#020617] font-sans overflow-hidden">
      
      {/* Branding Side */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between p-16 bg-[#020617] relative border-r border-white/5">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#6366F1]">
            <span className="text-white font-bold text-base italic tracking-tighter">A1</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">AmpereOne</span>
        </div>

        <div className="relative z-10">
           <h1 className="text-white text-[48px] font-bold leading-[1.1] tracking-tighter mb-6">
             Create your <br />
             <span className="text-indigo-400">account.</span>
           </h1>
           <p className="text-slate-500 text-[16px] font-medium max-w-sm">
             Join the strategic energy intelligence network. Experience precision telemetry.
           </p>
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-700 relative z-10">
          © 2026 AmpereOne • Deployment Ready
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center bg-[#0B0F1A] p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[650px] py-4 relative z-10">
          
          <div className="bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-[32px] p-8 sm:p-10 shadow-2xl">
            
            <div className="mb-10">
               <h2 className="text-[28px] font-bold text-white mb-2 tracking-tight">Sign Up</h2>
               <p className="text-slate-500 text-[14px] font-medium">Create a new AmpereOne account to get started.</p>
            </div>

            {/* Role Selector */}
            <div className="bg-slate-950/60 rounded-[18px] p-1.5 flex gap-1 mb-10 border border-white/5 relative">
              {ROLES.map(r => (
                <button 
                  key={r.key} 
                  onClick={() => setRole(r.key)}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 relative z-10
                    ${role === r.key ? 'text-[#020617]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}
              <div 
                className="absolute top-1.5 left-1.5 bottom-1.5 bg-indigo-500 rounded-xl transition-all duration-300"
                style={{ 
                  width: 'calc(33.33% - 4px)', 
                  transform: `translateX(${role === 'flat_owner' ? '0' : role === 'society_admin' ? '100%' : '200%'})` 
                }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Basic Info */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" size={16} />
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-[13px] font-bold text-white outline-none border border-white/5 bg-slate-950/60 focus:border-indigo-500/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" size={16} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-[13px] font-bold text-white outline-none border border-white/5 bg-slate-950/60 focus:border-indigo-500/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" size={16} />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters"
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-[13px] font-bold text-white outline-none border border-white/5 bg-slate-950/60 focus:border-indigo-500/50" />
                  </div>
                </div>

                {/* Resident-only Fields */}
                {role === 'flat_owner' && (
                  <>
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Society Code</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400" size={16} />
                        <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="A1-XXXX"
                          className="w-full h-12 pl-11 pr-4 rounded-xl text-[13px] font-bold text-white outline-none border border-white/5 bg-slate-950/60 focus:border-indigo-500/50" />
                        {verifying && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" size={16} />}
                      </div>
                      {societyName && <p className="text-[9px] text-emerald-400 font-bold ml-1 uppercase truncate">Node: {societyName}</p>}
                    </div>

                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Flat / Unit</label>
                      <div className="relative group">
                        <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input 
                          type="text"
                          list="flats-data"
                          value={flatId}
                          onChange={e => setFlatId(e.target.value)}
                          placeholder="Type or select flat"
                          className="w-full h-12 pl-11 pr-4 rounded-xl text-[13px] font-bold text-white outline-none border border-white/5 bg-slate-950/60 focus:border-indigo-500/50"
                        />
                        <datalist id="flats-data">
                          {flats.map(f => (
                            <option key={f.id} value={f.number} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-14 rounded-2xl text-[15px] font-bold text-[#020617] transition-all flex items-center justify-center gap-3 bg-indigo-500 hover:bg-indigo-400 shadow-[0_10px_30px_rgba(99,102,241,0.3)] mt-6 disabled:opacity-50 group">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <UserPlus size={18} /></>}
              </button>
            </form>

            <div className="mt-10 text-center border-t border-white/5 pt-8">
               <p className="text-slate-500 text-[13px] font-medium">
                 Already have an account? {' '}
                 <button onClick={() => navigate('/login')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign In</button>
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
