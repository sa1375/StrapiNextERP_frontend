// frontend/__tests__/sales-delete-flow.test.tsx

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Page from "@/app/dashboard/sales/page"
import axiosInstance from "@/lib/axios"
import { toast } from "sonner"

/**
 * Mock the custom axios instance used by the Sales page.
 *
 * We:
 *  - mock `get`:   used to fetch sales list
 *  - mock `delete`: used to delete a sale
 *  - provide noop interceptors so axios setup in app code doesn't fail in tests
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
 * Mock the toast library `sonner` so we can assert on success/error
 * messages without rendering actual toast UI.
 */
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

/**
 * Strongly typed handle for the mocked axios instance.
 * This allows easy usage of Jest helpers like mockResolvedValueOnce /
 * mockRejectedValueOnce, and inspecting calls on get/delete.
 */
const mockedAxios = axiosInstance as unknown as {
  get: jest.Mock
  delete: jest.Mock
}

/**
 * Base pagination metadata that simulates Strapi pagination.
 */
const baseMeta = { page: 1, pageSize: 10, pageCount: 1, total: 2 }

describe("Sales page delete flow", () => {
  beforeEach(() => {
    // Reset all mocks before each test to avoid shared state
    jest.resetAllMocks()
  })

  it("deletes a row after confirmation and refetches data", async () => {
    /**
     * First GET:
     *  - initial table data with one sale (INV-001)
     * Second GET:
     *  - after delete, returns an empty list
     */
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 1,
              documentId: "doc-1",
              invoice_number: "INV-001",
              customer_name: "Alice",
              customer_phone: "123",
              customer_email: "a@x.com",
              date: "2024-10-01",
              total: 100,
            },
          ],
          meta: { pagination: baseMeta },
        },
      })
      .mockResolvedValueOnce({
        data: {
          data: [],
          meta: { pagination: { ...baseMeta, total: 0, pageCount: 1 } },
        },
      })

    // DELETE /api/sales/doc-1 resolves successfully
    mockedAxios.delete.mockResolvedValueOnce({})

    // Render the Sales page
    render(<Page />)
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    // Wait until the initial row appears
    expect(await screen.findByText("INV-001")).toBeInTheDocument()

    /**
     * Locate the table row that contains the invoice "INV-001".
     * We go to .closest("tr") to get the <tr> element in the table.
     */
    const row = screen.getByText("INV-001").closest("tr")
    if (!row) throw new Error("Row not found")

    // Open the row action menu via the "open menu" button inside this row
    await user.click(
      within(row).getByRole("button", { name: /open menu/i })
    )

    // Click the "Delete" menu item in the opened menu
    await user.click(
      screen.getByRole("menuitem", { name: /delete/i })
    )

    // In the confirmation dialog, click the "Confirm" button
    await user.click(
      screen.getByRole("button", { name: /confirm/i })
    )

    /**
     * After confirming delete, we expect:
     *  - a DELETE call to /api/sales/doc-1
     *  - a refetch (GET) for the updated list
     *  - a success toast
     */
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        "/api/sales/doc-1"
      )
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
      expect(toast.success).toHaveBeenCalledWith(
        "Successfully deleted item"
      )
    })

    // The table should show empty state after deletion
    expect(
      screen.getByText("No results.")
    ).toBeInTheDocument()
  })

  it("does not delete when cancellation is chosen", async () => {
    /**
     * Only one GET for initial data; no refetch expected.
     */
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            documentId: "doc-1",
            invoice_number: "INV-001",
            customer_name: "Alice",
            customer_phone: "123",
            customer_email: "a@x.com",
            date: "2024-10-01",
            total: 100,
          },
        ],
        meta: { pagination: baseMeta },
      },
    })

    // Render the Sales page
    render(<Page />)
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    // Wait until row is visible
    expect(await screen.findByText("INV-001")).toBeInTheDocument()

    // Find the table row for "INV-001"
    const row = screen.getByText("INV-001").closest("tr")
    if (!row) throw new Error("Row not found")

    // Open the action menu and click "Delete"
    await user.click(
      within(row).getByRole("button", { name: /open menu/i })
    )
    await user.click(
      screen.getByRole("menuitem", { name: /delete/i })
    )

    // In the confirmation dialog, click "Cancel" instead of "Confirm"
    await user.click(
      screen.getByRole("button", { name: /cancel/i })
    )

    /**
     * Since the user canceled:
     *  - delete should NOT be called
     *  - the row should still be visible
     */
    expect(mockedAxios.delete).not.toHaveBeenCalled()
    expect(screen.getByText("INV-001")).toBeInTheDocument()
  })

  it("shows error toast when delete fails and keeps the row", async () => {
    /**
     * Initial GET with one sale row.
     */
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: 1,
            documentId: "doc-1",
            invoice_number: "INV-001",
            customer_name: "Alice",
            customer_phone: "123",
            customer_email: "a@x.com",
            date: "2024-10-01",
            total: 100,
          },
        ],
        meta: { pagination: baseMeta },
      },
    })

    // DELETE call fails with an error
    mockedAxios.delete.mockRejectedValueOnce(
      new Error("Delete failed")
    )

    // Render the Sales page
    render(<Page />)
    const user = userEvent.setup({ pointerEventsCheck: 0 })

    // Wait until row is visible
    expect(await screen.findByText("INV-001")).toBeInTheDocument()

    // Get the row for "INV-001"
    const row = screen.getByText("INV-001").closest("tr")
    if (!row) throw new Error("Row not found")

    // Open menu -> click delete -> confirm
    await user.click(
      within(row).getByRole("button", { name: /open menu/i })
    )
    await user.click(
      screen.getByRole("menuitem", { name: /delete/i })
    )
    await user.click(
      screen.getByRole("button", { name: /confirm/i })
    )

    /**
     * After the failing delete:
     *  - DELETE /api/sales/doc-1 should have been attempted
     *  - an error toast should be shown
     *  - the row should still be visible (no UI removal on failure)
     */
    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        "/api/sales/doc-1"
      )
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to delete the item"
      )
    })

    // Row remains in the document after failed delete
    expect(screen.getByText("INV-001")).toBeInTheDocument()
  })
})
