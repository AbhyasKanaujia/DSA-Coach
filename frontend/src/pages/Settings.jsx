import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const prefs = user?.preferences || {};

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Settings</h1>
      <p className="text-muted mb-6">Preferences are read-only for now.</p>

      <div className="card p-4 max-w-md">
        <h2 className="text-sm upper mb-3">Preferences</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-textDim">Daily goal</dt>
          <dd className="text-text">{prefs.dailyGoal ?? '—'}</dd>

          <dt className="text-textDim">Max session size</dt>
          <dd className="text-text">{prefs.maxSessionSize ?? '—'}</dd>

          <dt className="text-textDim">Preferred categories</dt>
          <dd className="text-text">
            {prefs.preferredCategories?.length ? prefs.preferredCategories.join(', ') : '—'}
          </dd>
        </dl>
      </div>
    </div>
  );
}
