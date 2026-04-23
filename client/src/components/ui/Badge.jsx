export default function Badge({ status, children, size = 'sm' }) {
  const styles = {
    live:        'bg-success-light text-success border-success/20',
    offline:     'bg-warning-light text-warning border-warning/20',
    registered:  'bg-blue-50 text-blue-700 border-blue-200',
    deregistered:'bg-gray-100 text-gray-500 border-gray-200',
    low:         'bg-success-light text-success border-success/20',
    medium:      'bg-warning-light text-warning border-warning/20',
    high:        'bg-danger-light text-danger border-danger/20 critical-pulse',
    occupied:    'bg-success-light text-success border-success/20',
    vacant:      'bg-gray-100 text-gray-500 border-gray-200',
    green:       'bg-success-light text-success border-success/20',
    amber:       'bg-warning-light text-warning border-warning/20',
    red:         'bg-danger-light text-danger border-danger/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {children || status}
    </span>
  );
}
