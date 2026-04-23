import { CheckCircle, Wifi, AlertTriangle, FileText } from 'lucide-react';

const icons = { check: CheckCircle, wifi: Wifi, alert: AlertTriangle, file: FileText };

export default function EmptyState({ icon = 'check', title = 'No data available', subtitle }) {
  const Icon = icons[icon] || CheckCircle;
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-page flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-muted" />
      </div>
      <p className="text-sm font-semibold text-text-secondary">{title}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}
