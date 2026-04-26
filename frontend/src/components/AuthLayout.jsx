export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-bg px-6 py-12 text-text">
      <div className="w-full max-w-sm rounded-lg border border-border bg-bg-card p-6 shadow-lg">
        <p className="font-mono text-sm text-accent">~/dsa_coach</p>
        <h1 className="mt-2 text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-dim">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
