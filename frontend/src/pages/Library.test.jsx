import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Library from './Library';
import * as libraryApi from '../api/library';

const sample = (overrides = {}) => ({
  isActive: true,
  collectionId: {
    _id: 'col-1',
    name: 'Two Pointers Drill',
    problemIds: ['p1', 'p2', 'p3']
  },
  ...overrides
});

function renderPage() {
  return render(
    <MemoryRouter>
      <Library />
    </MemoryRouter>
  );
}

describe('Library page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state with browse CTA when library is empty', async () => {
    vi.spyOn(libraryApi, 'list').mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/Your library is empty/i)).toBeInTheDocument());
    const browseLinks = screen.getAllByRole('link', { name: /Browse collections/i });
    expect(browseLinks.length).toBeGreaterThan(0);
    browseLinks.forEach((link) => expect(link).toHaveAttribute('href', '/collections'));
  });

  it('lists subscriptions, deactivates one, then unsubscribes another', async () => {
    vi.spyOn(libraryApi, 'list').mockResolvedValue([
      sample(),
      sample({
        isActive: false,
        collectionId: { _id: 'col-2', name: 'BFS Pack', problemIds: ['x'] }
      })
    ]);
    vi.spyOn(libraryApi, 'deactivate').mockResolvedValue({ isActive: false });
    vi.spyOn(libraryApi, 'remove').mockResolvedValue();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();

    await waitFor(() => expect(screen.getByText('Two Pointers Drill')).toBeInTheDocument());
    expect(screen.getByText('BFS Pack')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(libraryApi.deactivate).toHaveBeenCalledWith('col-1'));
    await waitFor(() => expect(screen.queryByText('Active')).not.toBeInTheDocument());

    const unsubscribeButtons = screen.getAllByRole('button', { name: /Unsubscribe/i });
    fireEvent.click(unsubscribeButtons[1]);
    await waitFor(() => expect(libraryApi.remove).toHaveBeenCalledWith('col-2'));
    await waitFor(() => expect(screen.queryByText('BFS Pack')).not.toBeInTheDocument());
  });

  it('surfaces server error on list failure', async () => {
    vi.spyOn(libraryApi, 'list').mockRejectedValue({
      response: { data: { error: 'Boom' } }
    });
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Boom'));
  });
});
