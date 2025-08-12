import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '@/pages/signup';

const signupMock = jest.fn();
jest.mock('@/pages/../lib/auth', () => ({
  signup: (...args: unknown[]) => signupMock(...args),
}));

describe('Signup page', () => {
  beforeEach(() => signupMock.mockReset());

  test('renders all fields', () => {
    render(<Register />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Name/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Surname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
  });

  test('submits with provided values', async () => {
    signupMock.mockResolvedValueOnce({ ok: true });

    render(<Register />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'secret' } });
    const nameInputs = screen.getAllByLabelText(/Name/i);
    fireEvent.change(nameInputs[0], { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Surname/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'jdoe' } });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => expect(signupMock).toHaveBeenCalledWith('a@b.com', 'secret', 'John', 'Doe', 'jdoe'));
  });

  // test('sets success message', async () => {
  //   signupMock.mockResolvedValueOnce(true);

  //   render(<Register />);
  //   fireEvent.click(screen.getByRole('button', { name: /Register/i }));

  //   await waitFor(() => expect(screen.getByText("Account created successfully!")).toBeInTheDocument());
  // });

  // test('shows API error message', async () => {
  //   signupMock.mockRejectedValueOnce({ response: { data: { message: 'Registration failed' } } });

  //   render(<Register />);
  //   fireEvent.click(screen.getByRole('button', { name: /Register/i }));

  //   await waitFor(() => expect(screen.getByText("Registration failed")).toBeInTheDocument());
  // });

  test('email is required', () => {
    render(<Register />);
    expect((screen.getByLabelText(/Email/i) as HTMLInputElement).required).toBe(true);
  });

  test('password is required', () => {
    render(<Register />);
    expect((screen.getByLabelText(/Password/i) as HTMLInputElement).required).toBe(true);
  });

  test('name is required', () => {
    render(<Register />);
    const el = screen.getAllByLabelText(/Name/i)[0] as HTMLInputElement;
    expect(el.required).toBe(true);
  });

  test('surname is required', () => {
    render(<Register />);
    expect((screen.getByLabelText(/Surname/i) as HTMLInputElement).required).toBe(true);
  });

  test('username is required', () => {
    render(<Register />);
    expect((screen.getByLabelText(/Username/i) as HTMLInputElement).required).toBe(true);
  });

  test('has link to login', () => {
    render(<Register />);
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
  });
}); 