import { useEffect, useRef, useState } from 'react';

function useCountUp(target) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const n = parseFloat(target);
    if (isNaN(n)) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 1100, 1); // Slightly slower, more premium feel
      const eased = 1 - Math.pow(1 - p, 4); // Quartic ease out
      setVal(parseFloat((n * eased).toFixed(1)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return val;
}

export default function StatCard({ icon: Icon, iconColor = 'text-accent', value, label, sub, subColor, trend, trendDown, flash }) {
  const ref = useRef(null);
  
  // Extract currency symbol and numeric part
  const valStr = String(value || '');
  const prefix = valStr.match(/^[^\d]*/)?.[0] || '';
  const numericString = valStr.replace(/[^0-9.]/g, '');
  const numeric = parseFloat(numericString);
  
  const countUpValue = useCountUp(isNaN(numeric) ? 0 : numeric);
  
  // Format the displayed value
  const displayed = isNaN(numeric) 
    ? value 
    : prefix + Math.floor(countUpValue).toLocaleString('en-IN');

  useEffect(() => {
    if (flash && ref.current) {
      ref.current.classList.add('premium-flash');
      const t = setTimeout(() => ref.current?.classList.remove('premium-flash'), 1000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  return (
    <div ref={ref} className="premium-card p-6 flex flex-col justify-between min-h-35 group transition-all duration-500 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-text-muted truncate">{label}</p>
          <div className="tabular text-[26px] xl:text-[30px] font-medium text-text-primary tracking-tight leading-none pt-0.5 flex items-baseline gap-1.5 overflow-hidden">
            <span className="truncate">{displayed}</span>
            {!isNaN(numeric) && <span className="text-[14px] font-semibold opacity-20 shrink-0">→</span>}
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-page border border-border/40 group-hover:bg-accent/5 group-hover:border-accent/20 transition-all duration-500 shrink-0">
          {Icon && <Icon size={20} className={`${iconColor} transition-transform duration-500 group-hover:scale-110`} />}
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-5">
        {sub && (
          <div className="text-[12px] font-bold tracking-tight truncate mr-2" style={{ color: subColor || 'var(--color-text-secondary)' }}>
            {sub}
          </div>
        )}
        {trend !== undefined && (
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border shrink-0 ${trendDown ? 'text-success bg-success/5 border-success/20' : 'text-danger bg-danger/5 border-danger/20'}`}>
            {trendDown ? '↓' : '↑'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}
