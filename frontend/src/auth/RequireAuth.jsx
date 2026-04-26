import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { tokenStore } from '../api/client';

export default function RequireAuth({ children }) {
  const { token, hydrating, syncFromStorage } = useAuth();
  const location = useLocation();

  useEffect(() => {
    syncFromStorage();
  }, [location.pathname, syncFromStorage]);

  if (hydrating) {
    return (
      <div className="flex h-full items-center justify-center text-text-dim">
        Loading…
      </div>
    );
  }

  if (!token || !tokenStore.get()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
