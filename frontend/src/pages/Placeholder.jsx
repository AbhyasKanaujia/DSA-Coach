import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Placeholder({ title }) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-text-dim">Phase 0 scaffold — this page is filled in by a later phase.</p>
    </div>
  );
}
