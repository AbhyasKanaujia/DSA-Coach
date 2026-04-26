import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAuth({ children }) {
  const { token, hydrating } = useAuth();
  const location = useLocation();

  if (hydrating) {
    return (
      <div className="flex h-full items-center justify-center text-text-dim">
        Loading…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
