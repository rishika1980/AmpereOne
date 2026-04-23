import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, FileText, Download, CheckCircle2, 
  AlertCircle, Building2, MapPin, Loader2, Table
} from 'lucide-react';
import Papa from 'papaparse';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AddSocietyModal({ isOpen, onClose, builderId, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Bio, 2: Upload, 3: Success
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', city: '', address: '' });
  const [flatsData, setFlatsData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Block,Floor,Flat No,Type\nA,1,A-101,2 BHK\nA,1,A-102,3 BHK\nB,1,B-101,2 BHK";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ampereone_society_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formatted = results.data.map(row => ({
          block: row['Block'],
          floor: row['Floor'],
          flatNo: row['Flat No'],
          type: row['Type']
        })).filter(r => r.block && r.flatNo);
        setFlatsData(formatted);
        toast.success(`${formatted.length} flats identified`);
      }
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.city) {
      toast.error('Society name and city are required');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/builders/${builderId}/societies`, {
        ...formData,
        flatsData
      });
      setStep(3);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create society');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-[560px] bg-[#0F172A] border border-white/10 rounded-[32px] shadow-3xl overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Add new society</h2>
              <p className="text-[13px] text-slate-500 font-medium">Provision new grid infrastructure nodes.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Society Name</label>
                    <div className="relative group">
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Sunrise Heights"
                        className="w-full h-14 bg-slate-950/60 border border-white/5 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">City</label>
                      <input 
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Hyderabad"
                        className="w-full h-14 bg-slate-950/60 border border-white/5 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Zip / Pincode</label>
                      <input 
                        type="text"
                        placeholder="500081"
                        className="w-full h-14 bg-slate-950/60 border border-white/5 rounded-2xl px-5 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Address</label>
                    <textarea 
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Road No 12, Banjara Hills..."
                      className="w-full h-32 bg-slate-950/60 border border-white/5 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all resize-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  className="w-full h-14 bg-indigo-500 hover:bg-indigo-400 text-[#020617] font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
                >
                  Continue to Infrastructure
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl mb-8">
                  <div className="flex items-start gap-3">
                    <FileText className="text-indigo-400 shrink-0" size={18} />
                    <div>
                      <p className="text-[13px] font-bold text-white mb-1 tracking-tight">Bulk Provisioning</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        Upload an Excel/CSV file with the society structure. The system will automatically create blocks, floors, and flat nodes.
                      </p>
                      <button 
                        onClick={handleDownloadTemplate}
                        className="mt-3 text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:text-white transition-colors"
                      >
                        <Download size={12} /> Download sample template
                      </button>
                    </div>
                  </div>
                </div>

                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) processFile(file); }}
                  onClick={() => fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all
                    ${isDragging ? 'border-indigo-400 bg-indigo-500/5 scale-[0.98]' : 'border-white/5 bg-slate-950/40 hover:border-white/20'}`}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${fileName ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-600'}`}>
                    {fileName ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-white mb-1">{fileName || 'Drag & drop your file here'}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Supports .csv files (max 10MB)</p>
                  </div>
                  {fileName && (
                    <button className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-400 transition-all uppercase tracking-widest mt-2">
                      Replace file
                    </button>
                  )}
                </div>

                {/* Expected Format Preview */}
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Table size={14} className="text-slate-600" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected Format</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pb-2 border-b border-white/5">
                    {['Block', 'Floor', 'Flat No', 'Type'].map(h => <span key={h} className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">{h}</span>)}
                  </div>
                  <div className="mt-2 space-y-2 opacity-50">
                    <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500 font-bold"><span>A</span><span>1</span><span>A-101</span><span>2 BHK</span></div>
                    <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-500 font-bold"><span>A</span><span>1</span><span>A-102</span><span>3 BHK</span></div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={loading}
                    onClick={() => setStep(1)}
                    className="flex-1 h-14 border border-white/10 text-slate-400 font-bold rounded-2xl hover:bg-white/5 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    disabled={loading}
                    onClick={handleSubmit}
                    className="flex-[2] h-14 bg-indigo-500 hover:bg-indigo-400 text-[#020617] font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Finalize Infrastructure'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-8">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Society Provisioned</h3>
                <p className="text-slate-500 text-[14px] font-medium max-w-[280px] mb-12">
                  <span className="text-indigo-400 font-bold">{formData.name}</span> has been added to your portfolio with {flatsData.length} active nodes.
                </p>
                <button 
                  onClick={onClose}
                  className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/5"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
