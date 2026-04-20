import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { server } from '../../setup/server';
import { http, HttpResponse } from 'msw';
import api from '../../../src/lib/api';
import App from '../../../src/App';

describe('401 Interceptor Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears token and redirects to login on 401 response', async () => {
    localStorage.setItem('token', 't-fake');

    server.use(
      http.get('http://localhost:3000/api/auth/profile', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('clears token on direct API call returning 401', async () => {
    localStorage.setItem('token', 't-fake');

    server.use(
      http.get('http://localhost:3000/api/auth/profile', () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      })
    );

    await expect(api.get('/auth/profile')).rejects.toThrow();

    expect(localStorage.getItem('token')).toBeNull();
  });
});