import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl mb-2">Welcome Back</h1>
        <p className="text-muted mb-8">Sign in to continue your DSA journey</p>

        {error && (
          <div className="mb-4 p-3 bg-[oklch(0.72_0.15_25)] bg-opacity-20 border border-[oklch(0.72_0.15_25)] rounded text-[oklch(0.94_0.005_85)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block upper muted mb-2">email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block upper muted mb-2">password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[oklch(0.78_0.13_145)] text-[oklch(0.14_0.01_240)] font-semibold rounded hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[oklch(0.78_0.13_145)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}