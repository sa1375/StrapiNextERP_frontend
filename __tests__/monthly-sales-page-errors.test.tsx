// frontend/__tests__/monthly-sales-page-errors.tsx

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"

import Page from "@/app/dashboard/reports/monthlysales/page"
import axiosInstance from "@/lib/axios"
import { toast } from "sonner"

/**
 * Mock the custom axios instance used by the Monthly Sales report page.
 *
 * We only mock:
 *  - get: used to fetch the monthly sales data
 *  - interceptors: provided as no-op mocks so that axiosInstance setup
 *    in the app code does not crash when accessed during tests.
 */
jest.mock("@/lib/axios", () => {
  const get = jest.fn()
  return {
    __esModule: true,
    default: {
      get,
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    },
  }
})

/**
 * Mock the `sonner` toast library to intercept and assert
 * error/success notifications instead of rendering real toasts.
 */
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

/**
 * Strongly-typed reference to the mocked axios instance.
 * This makes it easy to use Jest helpers like mockRejectedValueOnce.
 */
const mockedAxios = axiosInstance as unknown as { get: jest.Mock }

describe("Monthly Sales report error states", () => {
  beforeEach(() => {
    // Clear all mocks before each test so they start from a clean state
    jest.clearAllMocks()
  })

  it("shows loading then reports an error when fetch fails", async () => {
    /**
     * Simulate a network/server error when fetching monthly sales.
     * The component under test should:
     *  - show a loading state first
     *  - then call toast.error(...)
     *  - then show an empty state ("No results.")
     */
    mockedAxios.get.mockRejectedValueOnce(new Error("Server down"))

    // Render the Monthly Sales report page
    render(<Page />)

    // Immediately after render, the component should indicate it is loading
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Wait for the asynchronous fetch to fail and be handled
    await waitFor(() => {
      // Ensure the GET request was actually sent once
      expect(mockedAxios.get).toHaveBeenCalledTimes(1)
      // Ensure an error toast is shown with an appropriate message
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch sales")
    })

    // No invoice rows should be rendered when the request fails
    expect(screen.queryByText("INV-001")).not.toBeInTheDocument()
    // Instead, an empty state message should be displayed
    expect(screen.getByText("No results.")).toBeInTheDocument()
  })
})
