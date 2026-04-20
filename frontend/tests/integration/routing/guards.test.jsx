import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../../src/App';

describe('Route Guards Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const protectedRoutes = ['/', '/review', '/cards', '/cards/new', '/stats'];

  protectedRoutes.forEach((route) => {
    it(`redirects unauthenticated user from ${route} to login`, async () => {
      render(
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
    });
  });

  it('redirects authenticated user from /login to dashboard', async () => {
    localStorage.setItem('token', 't-fake');

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard coming soon...')).toBeInTheDocument();
    });
  });

  it('redirects authenticated user from /signup to dashboard', async () => {
    localStorage.setItem('token', 't-fake');

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard coming soon...')).toBeInTheDocument();
    });
  });
});