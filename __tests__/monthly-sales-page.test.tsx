import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Page from "@/app/dashboard/reports/monthlysales/page"
import axiosInstance from "@/lib/axios"

/**
 * Mock the custom axios instance used by the reports page.
 *
 * We create Jest mocks for:
 *  - get:   used for fetching monthly sales data
 *  - delete: present for completeness (even if not used in this test)
 *  - interceptors: so axios usage in the app does not crash in tests
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
 * Allows easy use of Jest helpers such as mockResolvedValueOnce,
 * and inspection of calls via mockedAxios.get.mock.calls.
 */
const mockedAxios = axiosInstance as unknown as {
  get: jest.Mock
  delete: jest.Mock
}

/**
 * Base pagination metadata returned by the backend (Strapi-style).
 * This is used in api responses in the tests to simulate real pagination info.
 */
const baseMeta = { page: 1, pageSize: 10, pageCount: 1, total: 2 }

/**
 * Sample "monthly sales" data returned by the API.
 * Each entry represents a sale row rendered in the report table.
 */
const monthlySales = [
  {
    id: 1,
    documentId: "doc-1",
    invoice_number: "INV-001",
    customer_name: "Alice",
    customer_phone: "123",
    customer_email: "alice@example.com",
    date: "2024-10-01T00:00:00.000Z",
    total: 120,
  },
  {
    id: 2,
    documentId: "doc-2",
    invoice_number: "INV-002",
    customer_name: "Bob",
    customer_phone: "456",
    customer_email: "bob@example.com",
    date: "2024-10-02T00:00:00.000Z",
    total: 300,
  },
]

describe("Monthly Sales report page", () => {
  beforeEach(() => {
    // Reset all Jest mocks before each test to ensure isolation
    jest.clearAllMocks()
  })

  it("renders report heading and sales rows", async () => {
    /**
     * First API call: initial fetch of monthly sales.
     * We mock axios.get to resolve with the monthlySales array and the pagination metadata.
     */
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: monthlySales,
        meta: { pagination: baseMeta },
      },
    })

    // Render the Monthly Sales report page component
    render(<Page />)

    // Wait until the first GET request has been made
    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(1))

    // Grab the first request URL in order to validate query parameters (pagination)
    const firstUrl = mockedAxios.get.mock.calls[0]?.[0] as string
    // Decode URL-encoded characters to simplify assertions
    const decodedUrl = decodeURIComponent(firstUrl)

    // Assert that pagination query parameters are present in the request URL
    expect(decodedUrl).toContain("pagination[page]=1")
    expect(decodedUrl).toContain("pagination[pageSize]=10")

    /**
     * Validate that the report heading "Monthly Sales" is rendered
     * inside the element with data-slot="card-title".
     * The `selector` option restricts the search to elements matching that selector.
     */
    expect(
      await screen.findByText("Monthly Sales", {
        selector: "[data-slot='card-title']",
      })
    ).toBeInTheDocument()

    // Validate that the first row data is rendered correctly
    expect(screen.getByText("INV-001")).toBeInTheDocument()
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("$120.00")).toBeInTheDocument()

    // Validate that the second row data is rendered correctly
    expect(screen.getByText("INV-002")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("$300.00")).toBeInTheDocument()

    /**
     * Validate that the pagination summary text is shown, indicating
     * "showing 1 to 2 of 2 rows" (based on the total=2 from baseMeta).
     */
    expect(
      screen.getByText(/showing 1 to 2 of 2 rows/i)
    ).toBeInTheDocument()
  })

  it("filters sales by invoice number", async () => {
    /**
     * First GET: initial load with full monthlySales (2 items).
     * Second GET: filtered results only containing the second invoice.
     */
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: monthlySales,
          meta: { pagination: baseMeta },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [monthlySales[1]], // filtered result: only Bob's invoice
          meta: { pagination: { ...baseMeta, total: 1, pageCount: 1 } },
        },
      })

    // Render the Monthly Sales report page
    render(<Page />)

    // Wait for initial data to be rendered
    expect(await screen.findByText("INV-001")).toBeInTheDocument()

    /**
     * Find the header cell for "Invoice number".
     * We will look for the filter button inside this header.
     */
    const invoiceHeader = screen.getByText("Invoice number")
    // Using `within` to query inside the header cell only
    const filterButton = within(invoiceHeader).getByRole("button")

    const user = userEvent.setup()

    // Open the filter UI by clicking the filter button
    await user.click(filterButton)

    // Wait for the invoice filter input to appear in the DOM
    const filterInput = await screen.findByPlaceholderText(
      "Filter invoice number..."
    )

    // Type the invoice number we want to filter by
    await user.type(filterInput, "INV-002")

    // Click the "Apply" button to trigger the filter request
    await user.click(
      screen.getByRole("button", { name: /apply/i })
    )

    /**
     * Wait until the second GET request is made, then inspect the URL
     * to ensure the invoice number filter is applied as a query parameter.
     */
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)

      const lastUrl = mockedAxios.get.mock.calls.at(-1)?.[0] as string
      const decoded = decodeURIComponent(lastUrl)

      // Ensure Strapi filter syntax is used for invoice_number with case-insensitive exact match
      expect(decoded).toContain("filters[invoice_number][$eqi]=INV-002")
    })

    // "INV-001" should no longer be visible after filtering
    expect(screen.queryByText("INV-001")).not.toBeInTheDocument()

    // The filtered invoice "INV-002" should be visible
    expect(await screen.findByText("INV-002")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })
})
