// frontend/__tests__/login-oage.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LoginPage from '@/app/login/page';
import { signIn } from 'next-auth/react';
import { mockRouter } from '../setupTests';
import { toast } from 'sonner';

/**
 * Mock the `sonner` toast library so we can assert
 * whether success/error messages are shown, without
 * actually rendering real toasts in the test environment.
 */
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset all Jest mocks between tests to avoid cross-test pollution
    jest.clearAllMocks();
    // Explicitly reset router mocks (just to be safe and explicit)
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
  });

  it('renders the login form fields and submit button', () => {
    // Render the LoginPage component
    render(<LoginPage />);

    // Assert that email input exists (using accessible label)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Assert that password input exists
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    // Assert that the login button exists
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
  });

  it('shows an error when submitting with empty fields', async () => {
    /**
     * Get a typed Jest mock for signIn.
     * jest.mocked() helps TypeScript understand this is a mocked function.
     */
    const signInMock = jest.mocked(signIn);
    // Simulate signIn returning { ok: false } for invalid credentials
    signInMock.mockResolvedValue({ ok: false } as any);

    // Render the login page
    render(<LoginPage />);

    // Create a userEvent instance to simulate user interactions
    const user = userEvent.setup();

    /**
     * Grab the <form> element that contains the email field.
     * This is used to turn off built-in browser validation,
     * ensuring our test isn't blocked by HTML5 required fields.
     */
    const form = screen.getByLabelText(/email/i).closest('form') as HTMLFormElement | null;

    if (form) {
      // Disable native validation so the form can be submitted even with empty fields
      form.noValidate = true;
    }

    // Click the "Login" button without typing any credentials
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    // Wait for async side-effects (signIn and toast.error) to complete
    await waitFor(() => {
      // signIn should be called with empty email/password
      expect(signInMock).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: '',
        password: '',
      });

      // toast.error should be called with a specific error message
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('submits credentials and navigates on successful login', async () => {
    // Get a typed mock of signIn
    const signInMock = jest.mocked(signIn);
    // Simulate successful login: signIn resolves to { ok: true }
    signInMock.mockResolvedValue({ ok: true } as any);

    // Render the login page
    render(<LoginPage />);

    // userEvent instance to simulate typing and clicking
    const user = userEvent.setup();

    // Type valid email and password into the form fields
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'strongpassword');

    // Click the "Login" button
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    // Wait for all async actions (signIn, router push, toast.success) to complete
    await waitFor(() => {
      // signIn should be called exactly once
      expect(signInMock).toHaveBeenCalledTimes(1);

      // signIn should receive the proper credentials and options
      expect(signInMock).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'user@example.com',
        password: 'strongpassword',
      });

      // After a successful login the user should be redirected to /dashboard
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');

      // A success toast should be displayed
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith('successfull Login');
    });
  });

  it('shows an error and does not navigate when signIn fails', async () => {
    const signInMock = jest.mocked(signIn);
    signInMock.mockResolvedValue({ ok: false } as any);

    render(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'user@example.com',
        password: 'password123',
      });
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Invalid credentials');
      expect(mockRouter.push).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  it('blocks submission when email and password are empty (native validation)', async () => {
    const signInMock = jest.mocked(signIn);
    render(<LoginPage />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(signInMock).not.toHaveBeenCalled();
    });
  });

  it('rejects invalid email format and does not call signIn', async () => {
    const signInMock = jest.mocked(signIn);
    render(<LoginPage />);
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(emailInput, 'not-an-email');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(emailInput.checkValidity()).toBe(false);
      expect(signInMock).not.toHaveBeenCalled();
    });
  });
});
