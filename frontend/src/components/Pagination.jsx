function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…');
    out.push(sorted[i]);
  }
  return out;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);
  const go = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onChange(p);
  };
  const btn =
    'rounded-md border border-border px-2.5 py-1 text-xs text-text-dim hover:bg-bg-hover disabled:opacity-50';
  const activeBtn = 'rounded-md border border-accent bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent';

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button type="button" onClick={() => go(1)} disabled={page === 1} className={btn} title="First page">
        «
      </button>
      <button type="button" onClick={() => go(page - 1)} disabled={page === 1} className={btn}>
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-2 text-xs text-text-faint">…</span>
        ) : p === page ? (
          <span key={p} aria-current="page" className={activeBtn}>{p}</span>
        ) : (
          <button key={p} type="button" onClick={() => go(p)} className={btn}>
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => go(page + 1)} disabled={page === totalPages} className={btn}>
        Next →
      </button>
      <button
        type="button"
        onClick={() => go(totalPages)}
        disabled={page === totalPages}
        className={btn}
        title="Last page"
      >
        »
      </button>
    </nav>
  );
}
