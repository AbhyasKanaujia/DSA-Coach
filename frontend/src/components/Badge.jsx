const variants = {
  accent: 'border-accent/40 bg-accent/10 text-accent',
  warn: 'border-warn/40 bg-warn/10 text-warn',
  danger: 'border-danger/40 bg-danger/10 text-danger',
  neutral: 'border-border bg-bg-lift text-text-dim'
};

export default function Badge({ children, variant = 'neutral', icon, title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${variants[variant] ?? variants.neutral}`}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export function AdminBadge() {
  return (
    <Badge variant="warn" title="Administrator" icon={<ShieldIcon />}>
      Admin
    </Badge>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
