export default function FormField({ label, htmlFor, children, hint }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-sm text-text-dim">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-text-faint">{hint}</p>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-md border border-border bg-bg-lift px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
