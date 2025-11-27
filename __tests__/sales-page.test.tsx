import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Page from "@/app/dashboard/sales/page"
import axiosInstance from "@/lib/axios"
import { mockRouter } from "../setupTests"

/**
 * Mock the custom axios instance used in the app.
 *
 * We explicitly mock:
 *  - get:    for fetching sales data
 *  - delete: for deleting invoices (even if not used in this test)
 *  - interceptors: request/response, so axiosInstance usage doesn't break in tests
 */
jest.mock("@/lib/axios", () => {
  const get = jest.fn()
  const del = jest.fn()

  return {
    __esModule: true,
    default: {
      get,
      delete: del,
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    },
  }
})

/**
 * Strongly-typed reference to the mocked axios instance.
 * We cast to an object whose get and delete are Jest mocks
 * to easily use jest helper methods like mockResolvedValueOnce, etc.
 */
const mockedAxios = axiosInstance as unknown as {
  get: jest.Mock
  delete: jest.Mock
}

/**
 * Base pagination metadata returned by the API.
 * This mimics the Strapi pagination meta structure.
 */
const baseMeta = { page: 1, pageSize: 10, pageCount: 1, total: 2 }

/**
 * Sample sales data returned by the API.
 * Each object represents a sale row in the sales table.
 */
const salesData = [
  {
    id: 1,
    documentId: "doc-1",
    invoice_number: "INV-001",
    customer_name: "Alice",
    customer_phone: "123",
    customer_email: "alice@example.com",
    date: "2024-01-01T00:00:00.000Z",
    total: 100,
  },
  {
    id: 2,
    documentId: "doc-2",
    invoice_number: "INV-002",
    customer_name: "Bob",
    customer_phone: "456",
    customer_email: "bob@example.com",
    date: "2024-02-01T00:00:00.000Z",
    total: 250.5,
  },
]

describe("Sales page", () => {
  beforeEach(() => {
    // Reset all Jest mocks between tests to ensure isolation
    jest.clearAllMocks()
    // Explicitly reset navigation-related mocks
    mockRouter.push.mockClear()
  })

  it("renders sales list with data", async () => {
    /**
     * First API call: initial fetch of sales list.
     * We mock axios.get to resolve with our sample data and pagination meta.
     */
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: salesData,
        meta: { pagination: baseMeta },
      },
    })

    // Render the Sales page component (Next.js route component)
    render(<Page />)

    // Wait until the first axios GET call happens (data fetching)
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1))

    // Extract the first request URL to inspect query params (pagination)
    const firstCallUrl = mockedAxios.get.mock.calls[0]?.[0] as string
    // Decode URL-encoded characters to make assertions easier
    const decodedUrl = decodeURIComponent(firstCallUrl)

    // Assert that default pagination params are included in the request
    expect(decodedUrl).toContain("pagination[page]=1")
    expect(decodedUrl).toContain("pagination[pageSize]=10")

    // Check that the first sale row is rendered with correct values
    expect(await screen.findByText("INV-001")).toBeInTheDocument()
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument()

    // Check that the second sale row is also rendered correctly
    expect(screen.getByText("INV-002")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("$250.50")).toBeInTheDocument()
  })

  it("filters sales by invoice number when a filter is applied", async () => {
    /**
     * First axios.get mock:
     *  - Initial load of all sales (2 items)
     */
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: salesData,
          meta: { pagination: baseMeta },
        },
      })
      /**
       * Second axios.get mock:
       *  - After applying the invoice number filter, API returns only the matching sale.
       *  - Pagination is updated to reflect only 1 result.
       */
      .mockResolvedValueOnce({
        data: {
          data: [salesData[1]], // Only Bob's invoice
          meta: { pagination: { ...baseMeta, total: 1, pageCount: 1 } },
        },
      })

    // Render the Sales page
    render(<Page />)

    // Ensure initial data has appeared (page is loaded)
    expect(await screen.findByText("INV-001")).toBeInTheDocument()

    // Locate the column header "Invoice Number"
    const invoiceHeader = screen.getByText("Invoice Number")

    /**
     * Using 'within' to search within the invoice column header node:
     * We assume that the filter button is inside this header.
     */
    const filterButton = within(invoiceHeader).getByRole("button")

    const user = userEvent.setup()

    // Open the filter popover by clicking on the filter button
    await user.click(filterButton)

    // Wait for the filter input to appear in the DOM
    const invoiceInput = await screen.findByPlaceholderText(
      "Filter Invoice Number..."
    )

    // Type the invoice number we want to filter by
    await user.type(invoiceInput, "INV-002")

    // Click the "Apply" button to trigger the filter
    await user.click(screen.getByRole("button", { name: /apply/i }))

    /**
     * Wait for the second axios GET call that should happen
     * after the filter is applied.
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)

      // Get the URL of the last call and decode it
      const lastCallUrl = mockedAxios.get.mock.calls.at(-1)?.[0] as string
      const decodedUrl = decodeURIComponent(lastCallUrl)

      // Assert that the invoice number filter query is present in the URL
      // Using Strapi syntax: filters[invoice_number][$eqi]=INV-002
      expect(decodedUrl).toContain("filters[invoice_number][$eqi]=INV-002")
    })

    // "INV-001" should no longer be present after filtering
    expect(screen.queryByText("INV-001")).not.toBeInTheDocument()

    // The filtered invoice "INV-002" should be visible
    expect(await screen.findByText("INV-002")).toBeInTheDocument()
    // And its customer name should also be rendered
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("navigates to the new sale page when clicking Add A New Invoice", async () => {
    // Initial fetch: resolve with the full sales list
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: salesData,
        meta: { pagination: baseMeta },
      },
    })

    // Render the sales page
    render(<Page />)

    const user = userEvent.setup()

    /**
     * Find and click the "Add A New Invoice" button.
     *
     * We use findByRole because the button may appear only
     * after the component finishes initial data loading.
     */
    await user.click(
      await screen.findByRole("button", { name: /add a new invoice/i })
    )

    // Assert that the router was instructed to navigate
    // to the "new sale" page route
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/sales/new")
  })
})
