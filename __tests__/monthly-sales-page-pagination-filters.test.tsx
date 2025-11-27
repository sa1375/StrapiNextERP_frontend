// frontend/__tests__/monthly-sales-page-pagination-filters.test.tsx

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Page from '@/app/dashboard/reports/monthlysales/page';
import axiosInstance from '@/lib/axios';

/**
 * Mock the custom axios instance used by the Monthly Sales report page.
 *
 * We:
 *  - mock get: used for fetching monthly sales data
 *  - provide dummy interceptors: so axios setup code in the app doesn't break in tests
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
 * Strongly-typed reference to the mocked axios instance.
 * This makes it easy to use Jest helpers like mockResolvedValueOnce,
 * and inspect request URLs via mockedAxios.get.mock.calls.
 */
const mockedAxios = axiosInstance as unknown as { get: jest.Mock };

/**
 * Base pagination metadata (Strapi-style pagination object).
 * Used in mocked responses to simulate multiple pages of results.
 */
const baseMeta = { page: 1, pageSize: 1, pageCount: 2, total: 2 };

describe('Monthly sales report pagination and filters', () => {
  beforeEach(() => {
    // Reset all mocks before each test to avoid cross-test state leakage
    jest.resetAllMocks();
  });

  it('fetches next page when navigating pagination', async () => {
    /**
     * First GET:
     *  - Returns page 1 with a single result: INV-001.
     * Second GET:
     *  - Returns page 2 with a single result: INV-002.
     */
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              invoice_number: 'INV-001',
              customer_name: 'Alice',
              customer_phone: '123',
              customer_email: 'a@x.com',
              date: '2024-10-01',
              total: 120,
            },
          ],
          meta: { pagination: baseMeta },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 2,
              invoice_number: 'INV-002',
              customer_name: 'Bob',
              customer_phone: '456',
              customer_email: 'b@x.com',
              date: '2024-10-02',
              total: 300,
            },
          ],
          meta: { pagination: { ...baseMeta, page: 2 } },
        },
      });

    // Render the Monthly Sales report page
    render(<Page />);
    // userEvent with pointerEventsCheck disabled to avoid pointer warnings in tests
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    // Wait for initial data fetch
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    // Ensure first invoice is on screen
    expect(await screen.findByText('INV-001')).toBeInTheDocument();

    /**
     * Find the pagination section by locating text like "Page 1 of ..."
     * and then going to its parent (typically a container element
     * holding pagination controls).
     */
    const paginationSection = screen.getByText(/Page 1 of/).parentElement;
    if (!paginationSection) {
      throw new Error('Pagination section not found');
    }

    // Get all the pagination buttons inside that section
    const buttons = within(paginationSection).getAllByRole('button');
    // Click the "next page" button; here we assume index 2 corresponds to "next"
    await user.click(buttons[2]);

    /**
     * After clicking "next", a second GET request should be fired.
     * We inspect the URL to ensure the page query parameter was updated to 2.
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      const lastUrl = decodeURIComponent(
        mockedAxios.get.mock.calls.at(-1)?.[0] as string
      );
      expect(lastUrl).toContain('pagination[page]=2');
    });

    // First page invoice should disappear
    expect(screen.queryByText('INV-001')).not.toBeInTheDocument();
    // Second page invoice should be visible
    expect(screen.getByText('INV-002')).toBeInTheDocument();
  });

  it('changes page size and refetches', async () => {
    /**
     * First GET:
     *  - pageSize: 10, only one record.
     * Second GET:
     *  - pageSize: 25, two records returned.
     */
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              invoice_number: 'INV-001',
              customer_name: 'Alice',
              customer_phone: '123',
              customer_email: 'a@x.com',
              date: '2024-10-01',
              total: 120,
            },
          ],
          meta: {
            pagination: {
              ...baseMeta,
              pageSize: 10,
              total: 1,
              pageCount: 1,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              invoice_number: 'INV-001',
              customer_name: 'Alice',
              customer_phone: '123',
              customer_email: 'a@x.com',
              date: '2024-10-01',
              total: 120,
            },
            {
              id: 2,
              invoice_number: 'INV-002',
              customer_name: 'Bob',
              customer_phone: '456',
              customer_email: 'b@x.com',
              date: '2024-10-02',
              total: 300,
            },
          ],
          meta: {
            pagination: {
              ...baseMeta,
              pageSize: 25,
              total: 2,
              pageCount: 1,
            },
          },
        },
      });

    // Render the page
    render(<Page />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    // Wait for the first fetch
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    // Ensure first invoice is visible
    expect(await screen.findByText('INV-001')).toBeInTheDocument();

    /**
     * Find the page size control (usually a select input / combobox),
     * click it to open the dropdown, then choose the "25" option.
     */
    const pageSizeTrigger = screen.getByRole('combobox');
    await user.click(pageSizeTrigger);

    const option25 = await screen.findByRole('option', { name: '25' });
    await user.click(option25);

    /**
     * Changing the page size should trigger a refetch
     * with updated pagination[pageSize] and reset pagination[page] to 1.
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      const lastUrl = decodeURIComponent(
        mockedAxios.get.mock.calls.at(-1)?.[0] as string
      );
      expect(lastUrl).toContain('pagination[pageSize]=25');
      expect(lastUrl).toContain('pagination[page]=1');
    });

    // The second invoice should now be present due to larger page size
    expect(screen.getByText('INV-002')).toBeInTheDocument();
  });

  it('applies customer name filter', async () => {
    /**
     * First GET:
     *  - Unfiltered list: INV-001 (Alice) and INV-002 (Bob).
     * Second GET:
     *  - Filtered list: only INV-002 (Bob).
     */
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              invoice_number: 'INV-001',
              customer_name: 'Alice',
              customer_phone: '123',
              customer_email: 'a@x.com',
              date: '2024-10-01',
              total: 120,
            },
            {
              id: 2,
              invoice_number: 'INV-002',
              customer_name: 'Bob',
              customer_phone: '456',
              customer_email: 'b@x.com',
              date: '2024-10-02',
              total: 300,
            },
          ],
          meta: {
            pagination: {
              ...baseMeta,
              pageSize: 10,
              pageCount: 1,
              total: 2,
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 2,
              invoice_number: 'INV-002',
              customer_name: 'Bob',
              customer_phone: '456',
              customer_email: 'b@x.com',
              date: '2024-10-02',
              total: 300,
            },
          ],
          meta: {
            pagination: {
              ...baseMeta,
              pageSize: 10,
              pageCount: 1,
              total: 1,
            },
          },
        },
      });

    // Render the page
    render(<Page />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    // Wait for initial data
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('INV-001')).toBeInTheDocument();

    /**
     * Find the "Customer name" column header,
     * then locate the filter button inside this header.
     */
    const header = screen.getByText('Customer name');
    const filterButton = within(header).getByRole('button');

    // Open filter popover / dropdown
    await user.click(filterButton);

    // Find the filter input for customer name
    const input = await screen.findByPlaceholderText(
      'Filter customer name...'
    );

    // Type the value to filter by (Bob)
    await user.type(input, 'Bob');

    // Click "Apply" to trigger a refetch with filters
    await user.click(
      screen.getByRole('button', { name: /apply/i })
    );

    /**
     * After applying the filter, we expect:
     *  - A second GET request
     *  - The request URL containing Strapi filter syntax for customer_name
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      const lastUrl = decodeURIComponent(
        mockedAxios.get.mock.calls.at(-1)?.[0] as string
      );
      expect(lastUrl).toContain(
        'filters[customer_name][$containsi]=Bob'
      );
    });

    // INV-001 (Alice) should no longer be visible
    expect(screen.queryByText('INV-001')).not.toBeInTheDocument();
    // INV-002 (Bob) should be the only result visible
    expect(await screen.findByText('INV-002')).toBeInTheDocument();
  });
});
