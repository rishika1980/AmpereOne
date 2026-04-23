export default function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1';
  const v = {
    primary:   'bg-accent text-white hover:bg-accent-hover focus:ring-accent',
    secondary: 'bg-white border border-border text-text-primary hover:bg-page focus:ring-accent',
    danger:    'bg-danger text-white hover:bg-red-700 focus:ring-danger',
    ghost:     'bg-transparent text-text-secondary hover:bg-page focus:ring-accent',
  };
  const s = { sm: 'text-xs px-3 py-1.5 gap-1.5', md: 'text-sm px-4 py-2 gap-2', lg: 'text-sm px-5 py-2.5 gap-2' };

  return (
    <button className={`${base} ${v[variant]} ${s[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? (
        <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>{children}</>
      ) : children}
    </button>
  );
}
