// frontend/__tests__/new-sale-page.test.tsx

import React from "react"
import { act } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import NewInvoicePage from "@/app/dashboard/sales/new/page"
import axiosInstance from "@/lib/axios"
import { mockRouter } from "../setupTests"
import { toast } from "sonner"

/**
 * Mock the custom axios instance used by the app.
 * We only care about `get` (product search) and `post` (submit invoice).
 */
jest.mock("@/lib/axios", () => {
  const get = jest.fn()
  const post = jest.fn()

  return {
    __esModule: true,
    default: {
      get,
      post,
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    },
  }
})

/**
 * Mock the `sonner` toast library so we can assert success/error notifications
 * without rendering any real UI toasts in tests.
 */
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

/**
 * Strongly-typed handle to the mocked axios instance.
 * This lets us use Jest helpers like mockResolvedValueOnce on `get` and `post`.
 */
const mockedAxios = axiosInstance as unknown as {
  get: jest.Mock
  post: jest.Mock
}

/**
 * Ensure NEXT_PUBLIC_STRAPI_URL is defined for tests.
 * The page under test likely uses this env variable to build API URLs.
 */
beforeAll(() => {
  process.env.NEXT_PUBLIC_STRAPI_URL = "http://localhost"
})

describe("New Sale page", () => {
  beforeEach(() => {
    // Clear all Jest mocks between tests so they don't leak state
    jest.clearAllMocks()
    // Reset router navigation mocks
    mockRouter.push.mockClear()
  })

  it("renders the new sale form controls", () => {
    // Render the NewInvoicePage route component
    render(<NewInvoicePage />)

    // Assert that all key form controls are present
    expect(
      screen.getByPlaceholderText("Invoice number")
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText(/date & time/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Customer name")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Customer email")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Customer phone")
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Search by product name...")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /submit invoice/i })
    ).toBeInTheDocument()
  })

  it("updates summary totals when quantity and price change", async () => {
    // Use fake timers to control debounce behavior in the product search field
    jest.useFakeTimers()

    // Mock initial product search response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [{ id: 10, name: "Widget", price: 50, stock: 5 }],
      },
    })

    // Render the page
    render(<NewInvoicePage />)
    // `delay: null` to send key events immediately without artificial delay
    const user = userEvent.setup({ delay: null })

    // Type into the product search input (triggers debounced search)
    await user.type(
      screen.getByPlaceholderText("Search by product name..."),
      "Wid"
    )

    // Advance fake timers to fire the debounce (e.g. 500ms)
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    // Wait for the product suggestion row to appear based on mocked data
    const result = await screen.findByText(/Widget - \$50 - 5 in stock/)
    // Select the product to add it to the invoice items
    await user.click(result)

    // Get numeric inputs (likely quantity and price) via their `spinbutton` role
    const [quantityInput, priceInput] = screen.getAllByRole("spinbutton")

    // Set quantity to 2
    await user.clear(quantityInput)
    await user.type(quantityInput, "2")

    // Set price to 50
    await user.clear(priceInput)
    await user.type(priceInput, "50")

    /**
     * Now the summary section should recalculate:
     *  - Subtotal: quantity * price = 2 * 50 = 100
     *  - Discount / tax / total are component-specific logic,
     *    here we only assert the final displayed values.
     */
    await waitFor(() => {
      expect(screen.getByText("Subtotal:")).toBeInTheDocument()
      expect(screen.getByText("$100.00")).toBeInTheDocument()
      expect(screen.getByText("-$10.00")).toBeInTheDocument()
      expect(screen.getByText("$7.00")).toBeInTheDocument()
      expect(screen.getByText("$97.00")).toBeInTheDocument()
    })

    // Restore real timers for other tests
    jest.useRealTimers()
  })

  it("submits the sale with correct payload and navigates on success", async () => {
    // Use fake timers again for debounced product search
    jest.useFakeTimers()

    // First axios.get: search product "Gadget"
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [{ id: 20, name: "Gadget", price: 25, stock: 10 }],
      },
    })

    // axios.post: mock API response for successful sale creation
    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { id: "sale-1" } },
    })

    // Render the new sale page
    render(<NewInvoicePage />)
    const user = userEvent.setup({ delay: null })

    // Search for product "Gadget" using partial text
    await user.type(
      screen.getByPlaceholderText("Search by product name..."),
      "Gad"
    )

    // Trigger debounced search
    await act(async () => {
      jest.advanceTimersByTime(500)
    })

    // Wait for product suggestion to appear and click it
    const productRow = await screen.findByText(
      /Gadget - \$25 - 10 in stock/
    )
    await user.click(productRow)

    // Fill basic invoice fields
    await user.clear(screen.getByPlaceholderText("Invoice number"))
    await user.type(
      screen.getByPlaceholderText("Invoice number"),
      "INV-100"
    )

    await user.clear(screen.getByPlaceholderText("Customer name"))
    await user.type(
      screen.getByPlaceholderText("Customer name"),
      "Charlie"
    )

    await user.clear(screen.getByPlaceholderText("Customer email"))
    await user.type(
      screen.getByPlaceholderText("Customer email"),
      "charlie@example.com"
    )

    await user.clear(screen.getByPlaceholderText("Customer phone"))
    await user.type(
      screen.getByPlaceholderText("Customer phone"),
      "999-888"
    )

    // Adjust quantity and price for the selected product line
    const [quantityInput, priceInput] = screen.getAllByRole("spinbutton")
    await user.clear(quantityInput)
    await user.type(quantityInput, "2")
    await user.clear(priceInput)
    await user.type(priceInput, "30")

    // Submit the invoice
    await user.click(
      screen.getByRole("button", { name: /submit invoice/i })
    )

    // Wait until the POST request is issued
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    })

    // Extract URL and payload from axios.post call
    const payload = mockedAxios.post.mock.calls[0]?.[1]
    const url = mockedAxios.post.mock.calls[0]?.[0]

    // The URL should use STRAPI base URL + sale-transactions endpoint
    expect(url).toBe("http://localhost/api/sale-transactions")

    // Assert that the payload matches the expected structure
    expect(payload).toMatchObject({
      data: {
        customer_name: "Charlie",
        invoice_number: "INV-100",
        customer_email: "charlie@example.com",
        customer_phone: "999-888",
        products: [
          // product id is stringified, with quantity and custom price
          { product: "20", quantity: 2, price: 30 },
        ],
      },
    })

    // On success, a success toast should be shown
    expect(toast.success).toHaveBeenCalled()

    // And navigation should redirect back to the sales list page
    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/sales")

    // Restore real timers
    jest.useRealTimers()
  })

  it("shows validation errors when required fields are missing", async () => {
    render(<NewInvoicePage />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /submit invoice/i }))

    expect(
      await screen.findByText("Customer name is required")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Invoice number is required")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Invoice phone is required")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Invoice email is required")
    ).toBeInTheDocument()
  })

  it("shows an error when submitting without any products", async () => {
    render(<NewInvoicePage />)
    const user = userEvent.setup()

    await user.type(
      screen.getByPlaceholderText("Invoice number"),
      "INV-200"
    )
    await user.type(
      screen.getByPlaceholderText("Customer name"),
      "Dana"
    )
    await user.type(
      screen.getByPlaceholderText("Customer email"),
      "dana@example.com"
    )
    await user.type(
      screen.getByPlaceholderText("Customer phone"),
      "555-111"
    )

    await user.click(
      screen.getByRole("button", { name: /submit invoice/i })
    )

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "At least one product is required."
      )
    })
    expect(mockedAxios.post).not.toHaveBeenCalled()
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it("displays an error and stays on page when backend submission fails", async () => {
    jest.useFakeTimers()
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [{ id: 30, name: "Device", price: 15, stock: 3 }],
      },
    })
    mockedAxios.post.mockRejectedValueOnce(new Error("Server error"))

    render(<NewInvoicePage />)
    const user = userEvent.setup({ delay: null })

    await user.type(
      screen.getByPlaceholderText("Search by product name..."),
      "Dev"
    )
    await act(async () => {
      jest.advanceTimersByTime(500)
    })
    await user.click(
      await screen.findByText(/Device - \$15 - 3 in stock/)
    )

    await user.clear(screen.getByPlaceholderText("Invoice number"))
    await user.type(
      screen.getByPlaceholderText("Invoice number"),
      "INV-300"
    )
    await user.clear(screen.getByPlaceholderText("Customer name"))
    await user.type(
      screen.getByPlaceholderText("Customer name"),
      "Eve"
    )
    await user.clear(screen.getByPlaceholderText("Customer email"))
    await user.type(
      screen.getByPlaceholderText("Customer email"),
      "eve@example.com"
    )
    await user.clear(screen.getByPlaceholderText("Customer phone"))
    await user.type(
      screen.getByPlaceholderText("Customer phone"),
      "333-222"
    )

    const [quantityInput, priceInput] = screen.getAllByRole("spinbutton")
    await user.clear(quantityInput)
    await user.type(quantityInput, "1")
    await user.clear(priceInput)
    await user.type(priceInput, "15")

    await user.click(
      screen.getByRole("button", { name: /submit invoice/i })
    )

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith(
        "Transaction failed: Server error"
      )
    })
    expect(mockRouter.push).not.toHaveBeenCalled()
    jest.useRealTimers()
  })

  it("navigates back to sales when clicking Cancel", async () => {
    render(<NewInvoicePage />)
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: /cancel/i })
    )

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard/sales")
  })
})
