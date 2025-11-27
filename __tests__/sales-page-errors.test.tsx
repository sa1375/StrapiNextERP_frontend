// frontend/__tests__/sales-page-errors.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import Page from '@/app/dashboard/sales/page';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';

/**
 * Mock the axios instance used inside the Sales page.
 *
 * We mock:
 *  - axios.get:     used for fetching sales data
 *  - interceptors:  provided so that axiosInstance initialization does not break
 *
 * The test will control axios.get to simulate API failures.
 */
jest.mock('@/lib/axios', () => {
  const get = jest.fn();
  return {
    __esModule: true,
    default: {
      get,
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    },
  };
});

/**
 * Mock the `sonner` toast library to intercept toast.success() and toast.error().
 * This prevents rendering of real toast UI and allows us to assert error messages.
 */
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Strongly-typed reference to the mocked axios API
const mockedAxios = axiosInstance as unknown as { get: jest.Mock };

describe('Sales page error states', () => {
  beforeEach(() => {
    // Reset all mock calls between tests
    jest.clearAllMocks();
  });

  it('shows loading then surfaces an error when fetch fails', async () => {
    /**
     * Arrange:
     * Simulate a network error when the Sales page tries to fetch data.
     * `mockRejectedValueOnce` makes the first axios.get call reject with an Error.
     */
    mockedAxios.get.mockRejectedValueOnce(new Error('Network failure'));

    /**
     * Act:
     * Render the Sales page.
     * Immediately after render, the page should show a "loading" indicator.
     */
    render(<Page />);

    // The loading state should be visible immediately
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    /**
     * Assert:
     * Wait for the asynchronous fetch to fail.
     * Then verify:
     *  - axios.get was called exactly once
     *  - toast.error was called with the correct error message
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch sales data');
    });

    /**
     * Once the load fails:
     *  - No invoice rows should appear
     *  - The UI should show the "No results." empty state
     */
    expect(screen.queryByText('INV-001')).not.toBeInTheDocument(); // Should NOT be rendered
    expect(screen.getByText('No results.')).toBeInTheDocument();  // Empty state is shown
  });
});
