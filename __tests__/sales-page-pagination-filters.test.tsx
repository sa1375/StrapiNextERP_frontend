// frontend/__tests__/sales-page-pagination-filters.test.tsx

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Page from '@/app/dashboard/sales/page';
import axiosInstance from '@/lib/axios';

/**
 * Mock the custom axios instance used by the Sales page.
 *
 * We:
 *  - mock `get`: used for fetching sales list data
 *  - provide dummy `interceptors` so axios setup in app code doesn’t crash in tests
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
 * Strongly-typed handle on the mocked axios instance
 * so we can use Jest helpers like mockResolvedValueOnce
 * and inspect calls via mockedAxios.get.mock.calls.
 */
const mockedAxios = axiosInstance as unknown as { get: jest.Mock };

/**
 * Base pagination metadata (Strapi-style pagination object).
 * Used in responses to simulate multiple pages of sales.
 */
const baseMeta = { page: 1, pageSize: 2, pageCount: 2, total: 3 };

describe('Sales page pagination and filters', () => {
  beforeEach(() => {
    // Reset all mocks before each test so they don't share state
    jest.resetAllMocks();
  });

  it('requests next page data and updates rows', async () => {
    /**
     * First GET:
     *  - returns page 1, 2 rows: INV-001 and INV-002
     * Second GET:
     *  - returns page 2, 1 row: INV-003
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
              total: 100,
            },
            {
              id: 2,
              invoice_number: 'INV-002',
              customer_name: 'Bob',
              customer_phone: '456',
              customer_email: 'b@x.com',
              date: '2024-10-02',
              total: 200,
            },
          ],
          meta: { pagination: baseMeta },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 3,
              invoice_number: 'INV-003',
              customer_name: 'Cara',
              customer_phone: '789',
              customer_email: 'c@x.com',
              date: '2024-10-03',
              total: 300,
            },
          ],
          meta: { pagination: { ...baseMeta, page: 2 } },
        },
      });

    // Render the Sales page
    render(<Page />);
    // userEvent with pointerEventsCheck disabled to avoid pointer warnings
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    // Wait until initial fetch is done
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));

    // Page 1 rows should be rendered
    expect(await screen.findByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('INV-002')).toBeInTheDocument();

    // Click the "next page" button, which is labeled for accessibility
    await user.click(screen.getByLabelText('Go to next page'));

    /**
     * After clicking next, a second GET should be fired with page=2.
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      const lastUrl = decodeURIComponent(mockedAxios.get.mock.calls.at(-1)?.[0] as string);
      expect(lastUrl).toContain('pagination[page]=2');
    });

    // Old rows from page 1 should disappear
    expect(screen.queryByText('INV-001')).not.toBeInTheDocument();
    // New row from page 2 should appear
    expect(screen.getByText('INV-003')).toBeInTheDocument();
  });

  it('changes page size and refetches with new size', async () => {
    /**
     * First GET:
     *  - pageSize: 10, only a single record.
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
              total: 100,
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
              id: 2,
              invoice_number: 'INV-002',
              customer_name: 'Bob',
              customer_phone: '456',
              customer_email: 'b@x.com',
              date: '2024-10-02',
              total: 200,
            },
            {
              id: 3,
              invoice_number: 'INV-003',
              customer_name: 'Cara',
              customer_phone: '789',
              customer_email: 'c@x.com',
              date: '2024-10-03',
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

    // Render the Sales page
    render(<Page />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    // Wait for initial data fetch
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('INV-001')).toBeInTheDocument();

    /**
     * Find the page size select (combobox).
     * Open it and choose the option "25".
     */
    const pageSizeTrigger = screen.getByRole('combobox');
    await user.click(pageSizeTrigger);

    const option25 = await screen.findByRole('option', { name: '25' });
    await user.click(option25);

    /**
     * Changing page size should:
     *  - trigger a refetch
     *  - send pagination[pageSize]=25
     *  - reset pagination[page]=1
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      const lastUrl = decodeURIComponent(mockedAxios.get.mock.calls.at(-1)?.[0] as string);
      expect(lastUrl).toContain('pagination[pageSize]=25');
      expect(lastUrl).toContain('pagination[page]=1');
    });

    // New page data should include INV-002 and INV-003
    expect(screen.getByText('INV-002')).toBeInTheDocument();
    expect(screen.getByText('INV-003')).toBeInTheDocument();
  });

  it('applies customer name filter and refetches with query param', async () => {
    /**
     * First GET:
     *  - returns two rows: INV-001 (Alice), INV-002 (Bob)
     * Second GET:
     *  - filtered result: only INV-002 (Bob)
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
              total: 100,
            },
            {
              id: 2,
              invoice_number: 'INV-002',
              customer_name: 'Bob',
              customer_phone: '456',
              customer_email: 'b@x.com',
              date: '2024-10-02',
              total: 200,
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
              total: 200,
            },
          ],
          meta: { pagination: { ...baseMeta, total: 1 } },
        },
      });

    // Render the Sales page
    render(<Page />);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    // Wait for initial list
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('INV-001')).toBeInTheDocument();

    /**
     * Find the "Customer Name" table header,
     * then find the filter button inside that header.
     */
    const header = screen.getByText('Customer Name');
    const filterButton = within(header).getByRole('button');

    // Open the filter UI for customer name
    await user.click(filterButton);

    // Find the filter input for customer name text
    const input = await screen.findByPlaceholderText('Filter Customer Name...');
    await user.type(input, 'Bob');

    // Click apply to submit the filter
    await user.click(screen.getByRole('button', { name: /apply/i }));

    /**
     * After applying the filter:
     *  - a second GET should be fired
     *  - request URL should include Strapi filter query for customer_name
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      const lastUrl = decodeURIComponent(mockedAxios.get.mock.calls.at(-1)?.[0] as string);
      expect(lastUrl).toContain('filters[customer_name][$containsi]=Bob');
    });

    // INV-001 should no longer be present
    expect(screen.queryByText('INV-001')).not.toBeInTheDocument();
    // INV-002 (Bob) should be visible as filtered result
    expect(await screen.findByText('INV-002')).toBeInTheDocument();
  });
});
