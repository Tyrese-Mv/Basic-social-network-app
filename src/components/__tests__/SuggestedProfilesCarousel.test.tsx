import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuggestedProfilesCarousel from '../SuggestedProfilesCarousel';

// Mock follow service
jest.mock('../../services/follow-services', () => ({
  createFollow: jest.fn(),
}));

import { createFollow } from '../../services/follow-services';

describe('SuggestedProfilesCarousel', () => {
  const userId = 'current-user';

  beforeEach(() => {
    jest.clearAllMocks();
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn();
  });

  const mockProfiles = [
    { userId: 'u1', username: 'alice' },
    { userId: 'u2', username: 'bob' },
    { userId: 'u3', username: 'carol' },
  ];

  const mockFetch = (data: unknown, ok = true) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok,
      json: async () => data,
    });
  };

  it('renders loading state then profiles', async () => {
    mockFetch(mockProfiles);
    render(<SuggestedProfilesCarousel userId={userId} />);

    expect(screen.getByText(/loading suggestions/i)).toBeInTheDocument();

    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.getByText('carol')).toBeInTheDocument();
  });

  it('renders empty state when no profiles', async () => {
    mockFetch([]);
    render(<SuggestedProfilesCarousel userId={userId} />);
    expect(await screen.findByText(/no suggestions/i)).toBeInTheDocument();
  });

  it('handles fetch error and shows no crash (loading disappears)', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));
    render(<SuggestedProfilesCarousel userId={userId} />);

    await waitFor(() => expect(screen.queryByText(/loading suggestions/i)).not.toBeInTheDocument());
  });

  it('calls endpoint with userId in query', async () => {
    mockFetch([]);
    render(<SuggestedProfilesCarousel userId={userId} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(`userId=${userId}`);
  });

  it('clicking Follow calls createFollow with profile id', async () => {
    mockFetch(mockProfiles);
    (createFollow as jest.Mock).mockResolvedValue({ success: true });

    render(<SuggestedProfilesCarousel userId={userId} />);

    const followButtons = await screen.findAllByRole('button', { name: /follow/i });
    await userEvent.click(followButtons[0]);

    expect(createFollow).toHaveBeenCalledWith('u1');
  });

  it('removes profile from list on successful follow (truthy response)', async () => {
    mockFetch(mockProfiles);
    (createFollow as jest.Mock).mockResolvedValue({ success: true });

    render(<SuggestedProfilesCarousel userId={userId} />);

    await screen.findByText('alice');
    const before = screen.getAllByRole('button', { name: /follow/i }).length;

    await userEvent.click(screen.getAllByRole('button', { name: /follow/i })[0]);

    await waitFor(() => {
      const afterButtons = screen.getAllByRole('button', { name: /follow/i });
      expect(afterButtons.length).toBe(before - 1);
      expect(screen.queryByText('alice')).not.toBeInTheDocument();
    });
  });

  it('does not remove profile if createFollow resolves to falsy', async () => {
    mockFetch(mockProfiles);
    (createFollow as jest.Mock).mockResolvedValue(null);

    render(<SuggestedProfilesCarousel userId={userId} />);

    await screen.findByText('alice');
    const before = screen.getAllByRole('button', { name: /follow/i }).length;

    await userEvent.click(screen.getAllByRole('button', { name: /follow/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /follow/i }).length).toBe(before);
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });

  it('logs error when createFollow throws', async () => {
    mockFetch(mockProfiles);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (createFollow as jest.Mock).mockRejectedValue(new Error('boom'));

    render(<SuggestedProfilesCarousel userId={userId} />);

    await userEvent.click((await screen.findAllByRole('button', { name: /follow/i }))[0]);

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('shows empty message when last profile is followed', async () => {
    mockFetch([{ userId: 'only', username: 'solo' }]);
    (createFollow as jest.Mock).mockResolvedValue({ ok: true });

    render(<SuggestedProfilesCarousel userId={userId} />);

    await screen.findByText('solo');
    await userEvent.click(screen.getByRole('button', { name: /follow/i }));

    await screen.findByText(/no suggestions/i);
  });

  it('re-fetches when userId changes', async () => {
    mockFetch(mockProfiles);
    const { rerender } = render(<SuggestedProfilesCarousel userId={userId} />);
    await screen.findByText('alice');

    mockFetch([]);
    rerender(<SuggestedProfilesCarousel userId="another" />);

    await screen.findByText(/no suggestions/i);
    // Two fetch calls in total
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
  });
}); 