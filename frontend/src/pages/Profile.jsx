import { useEffect, useState } from 'react';
import FormField, { inputClass } from '../components/FormField';
import { AdminBadge } from '../components/Badge';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../api/errors';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Profile() {
  useDocumentTitle('Profile');
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [maxSessionSize, setMaxSessionSize] = useState('');
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setDailyGoal(String(user.preferences?.dailyGoal ?? 20));
    setMaxSessionSize(String(user.preferences?.maxSessionSize ?? 10));
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        preferences: {
          dailyGoal: Number(dailyGoal),
          maxSessionSize: Number(maxSessionSize)
        }
      });
      setSaved(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update profile'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Profile</h1>
      <p className="mt-1 text-sm text-text-dim">Manage your account and review preferences.</p>

      <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 rounded-md border border-border bg-bg-card p-4 text-sm">
        <dt className="text-text-faint">Email</dt>
        <dd className="flex items-center gap-2">
          {user.email}
          {user.role === 'admin' && <AdminBadge />}
        </dd>
        <dt className="text-text-faint">Total reviews</dt>
        <dd>{user.stats?.totalReviews ?? 0}</dd>
        <dt className="text-text-faint">Streak</dt>
        <dd>{user.stats?.streak ?? 0} days</dd>
      </dl>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField label="Display name" htmlFor="profile-name">
          <input
            id="profile-name"
            type="text"
            required
            minLength={1}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Daily goal" htmlFor="profile-daily-goal" hint="Reviews per day target.">
            <input
              id="profile-daily-goal"
              type="number"
              min={1}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Max session size"
            htmlFor="profile-max-session"
            hint="Cap on cards per session."
          >
            <input
              id="profile-max-session"
              type="number"
              min={1}
              value={maxSessionSize}
              onChange={(e) => setMaxSessionSize(e.target.value)}
              className={inputClass}
            />
          </FormField>
        </div>
        {error && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        {saved && !error && (
          <p role="status" className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
            Saved.
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
