import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import FormField, { inputClass } from '../components/FormField';
import { useAuth } from '../auth/AuthContext';
import { extractErrorMessage } from '../api/errors';

export default function Register() {
  const { token, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, name: name.trim() });
      navigate('/', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start practicing in under a minute.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" htmlFor="reg-name">
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            required
            minLength={1}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Email" htmlFor="reg-email">
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Password" htmlFor="reg-password" hint="At least 8 characters.">
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </FormField>
        {error && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-text-dim">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
