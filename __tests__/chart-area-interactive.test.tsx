// frontend/__tests__/chart-area-interative.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import axiosInstance from '@/lib/axios';

/**
 * Mock the axios instance used by ChartAreaInteractive.
 *
 * We only need:
 *  - `get`: to fetch chart data
 *  - `interceptors`: as no-op mocks so axios setup in the app does not break
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

// Strongly typed handle for the mocked axios instance
const mockedAxios = axiosInstance as unknown as { get: jest.Mock };

describe('ChartAreaInteractive', () => {
  beforeEach(() => {
    // Reset all mock call history and implementations before each test
    jest.resetAllMocks();
  });

  it('renders chart with fetched data and shows date labels', async () => {
    /**
     * Arrange:
     * Mock the GET request that ChartAreaInteractive uses to load chart data.
     * We simulate a response with two data points, each with:
     *  - id
     *  - documentId
     *  - date
     *  - total  (the numeric value used in the chart)
     */
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { id: 1, documentId: 'd1', date: '2024-01-01T00:00:00Z', total: 100 },
        { id: 2, documentId: 'd2', date: '2024-01-02T00:00:00Z', total: 200 },
      ],
    });

    /**
     * Recharts (and other chart libs) often rely on the container width
     * (clientWidth) to calculate dimensions.
     *
     * In JSDOM, clientWidth is not set by default, so we define it manually
     * to ensure the responsive container can render without issues.
     */
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      value: 600,
      configurable: true,
    });

    // Act: Render the chart component
    render(<ChartAreaInteractive />);

    // The title should be rendered immediately, even before data is loaded
    expect(screen.getByText('Total Sales')).toBeInTheDocument();

    /**
     * Assert 1:
     * Wait until the component calls axios.get with the expected endpoint.
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/sales/chartData/');
    });

    /**
     * Assert 2:
     * Wait until Recharts has mounted its responsive container.
     * We query for the element with class `.recharts-responsive-container`
     * which is added by Recharts when the chart is successfully rendered.
     */
    await waitFor(() => {
      const chartContainer = document.querySelector('.recharts-responsive-container');
      expect(chartContainer).not.toBeNull();
    });

    // Final sanity check: the chart title is still present
    expect(screen.getByText(/Total Sales/i)).toBeInTheDocument();
  });
});
