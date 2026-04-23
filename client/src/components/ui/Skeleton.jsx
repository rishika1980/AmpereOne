export function Skeleton({ width = '100%', height = 16, className = '' }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <Skeleton width={32} height={32} className="rounded-full mb-4" />
      <Skeleton width="55%" height={26} className="mb-2" />
      <Skeleton width="40%" height={12} className="mb-1.5" />
      <Skeleton width="30%" height={11} />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height={14} width={i === 0 ? '75%' : '55%'} />
        </td>
      ))}
    </tr>
  );
}
