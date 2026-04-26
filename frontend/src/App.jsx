import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Placeholder title="Login (Phase 1)" />} />
      <Route path="/register" element={<Placeholder title="Register (Phase 1)" />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Placeholder title="Dashboard (Phase 4)" />
          </RequireAuth>
        }
      />
      <Route
        path="/library"
        element={
          <RequireAuth>
            <Placeholder title="Library (Phase 2)" />
          </RequireAuth>
        }
      />
      <Route
        path="/collections"
        element={
          <RequireAuth>
            <Placeholder title="Browse Collections (Phase 2)" />
          </RequireAuth>
        }
      />
      <Route
        path="/session"
        element={
          <RequireAuth>
            <Placeholder title="Review Session (Phase 3)" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
