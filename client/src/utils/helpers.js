export const fmt = (val, decimals = 1) => parseFloat(parseFloat(val || 0).toFixed(decimals));

export const currency = (val) => '₹' + Math.round(val || 0).toLocaleString('en-IN');

export const timeAgo = (ts) => {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
};

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export const fmtTime = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  : '—';
