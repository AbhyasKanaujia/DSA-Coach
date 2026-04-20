import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';

export function renderWithProviders(ui, { initialEntries = ['/'], initialToken = null } = {}) {
  if (initialToken) {
    localStorage.setItem('token', initialToken);
  }

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
}

export function renderWithRoute(route, component) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={route} element={component} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}