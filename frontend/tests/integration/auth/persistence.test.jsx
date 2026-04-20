import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../../src/App';

describe('Auth Persistence Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores session from valid token on mount', async () => {
    localStorage.setItem('token', 't-fake');

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard coming soon...')).toBeInTheDocument();
    });
  });

  it('redirects to login when no token on mount', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  it('allows access to protected routes with valid token', async () => {
    localStorage.setItem('token', 't-fake');

    render(
      <MemoryRouter initialEntries={['/review']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Review Session')).toBeInTheDocument();
    });
  });
});