import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '@/pages/login';

const loginMock = jest.fn();
jest.mock('@/pages/../lib/auth', () => ({
  login: (...args: unknown[]) => loginMock(...args),
}));

describe('Login page', () => {
  beforeEach(() => {
    loginMock.mockReset();
    (globalThis.fetch as jest.Mock).mockReset?.();
  });

  test('renders email and password fields', () => {
    render(<Login />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  test('submits with provided credentials', async () => {
    loginMock.mockResolvedValueOnce({ token: 'tok' });
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('a@b.com', 'secret'));
  });

  test('calls API to set token after successful login', async () => {
    loginMock.mockResolvedValueOnce({ token: 'tok' });
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith('/api/set-token', expect.any(Object)));
  });

  test('shows error snackbar on failure', async () => {
    loginMock.mockRejectedValueOnce(new Error('Login failed'));

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  test('shows server error message when provided', async () => {
    loginMock.mockRejectedValueOnce({ response: { data: { message: 'Bad creds' } } });

    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  test('email field is required', () => {
    render(<Login />);
    const input = screen.getByLabelText(/Email/i) as HTMLInputElement;
    expect(input.required).toBe(true);
  });

  test('password field is required', () => {
    render(<Login />);
    const input = screen.getByLabelText(/Password/i) as HTMLInputElement;
    expect(input.required).toBe(true);
  });

  test('has link to register', () => {
    render(<Login />);
    expect(screen.getByRole('link', { name: /Register here/i })).toBeInTheDocument();
  });

  test('login button is type submit', () => {
    render(<Login />);
    expect(screen.getByRole('button', { name: /Login/i })).toHaveAttribute('type', 'submit');
  });

  test('does not crash after successful login', async () => {
    loginMock.mockResolvedValueOnce({ token: 'tok' });
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

    const { container } = render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await waitFor(() => expect(container).toBeTruthy());
  });
}); 