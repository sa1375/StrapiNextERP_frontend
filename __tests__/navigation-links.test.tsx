// frontend/__tests__/navigation-links.test.tsx

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import Page from "@/app/dashboard/reports/monthlysales/page"
import { AppSidebar } from "@/components/app-sidebar"
import axiosInstance from "@/lib/axios"
import { useSession } from "next-auth/react"
import { SidebarProvider } from "@/components/ui/sidebar"

/**
 * Mock the axios instance used by the Monthly Sales report page.
 *
 * We:
 *  - mock `get` for fetching table data
 *  - provide dummy interceptors so axios setup code doesn’t crash in tests
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
 * Mock next-auth's useSession.
 *
 * By default in this file we configure it to return an unauthenticated state.
 * For the second test we explicitly re-mock it.
 */
jest.mock("next-auth/react", () => ({
  __esModule: true,
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
}))

// Strongly typed handle to the mocked axios instance
const mockedAxios = axiosInstance as unknown as { get: jest.Mock }

describe("Navigation links", () => {
  beforeEach(() => {
    // Reset all mocks before each test so state doesn't leak between tests
    jest.resetAllMocks()

    /**
     * Default GET response for the monthly sales report page.
     * We return a single row with documentId "doc-1" so we can verify
     * the "View invoice" link uses this documentId in its href.
     */
    mockedAxios.get.mockResolvedValue({
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
            total: 120,
          },
        ],
        meta: {
          pagination: {
            page: 1,
            pageSize: 10,
            pageCount: 1,
            total: 1,
          },
        },
      },
    })
  })

  it("renders View invoice link with correct href in report table actions", async () => {
    // Render the Monthly Sales report page
    render(<Page />)

    // Wait until the invoice row appears in the table
    expect(await screen.findByText("INV-001")).toBeInTheDocument()

    /**
     * Find the <tr> row containing "INV-001"
     * so we can locate the actions menu button within that row.
     */
    const row = screen.getByText("INV-001").closest("tr")
    if (!row) throw new Error("Row not found")

    // Find the "open menu" actions button in this row
    const actionsButton = within(row).getByRole("button", {
      name: /open menu/i,
    })
    expect(actionsButton).toBeInTheDocument()

    const user = userEvent.setup({ pointerEventsCheck: 0 })

    // Open the row action menu
    await user.click(actionsButton)

    /**
     * Inside the opened menu we expect a "View invoice" link.
     * Once we find it, we assert that:
     *  - The href uses the documentId ("doc-1") from the row
     *  - The path matches `/dashboard/sales/invoice/[documentId]`
     */
    const viewInvoiceLink = await screen.findByRole("link", {
      name: /view invoice/i,
    })
    expect(viewInvoiceLink).toHaveAttribute(
      "href",
      "/dashboard/sales/invoice/doc-1"
    )
  })

  it("renders global sidebar nav items with expected routes", () => {
    /**
     * Explicitly set useSession to unauthenticated for this test,
     * in case it is changed elsewhere.
     */
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "unauthenticated",
    })

    /**
     * Render the global AppSidebar inside SidebarProvider so it can
     * access its context properly (e.g., open/close state).
     *
     * We test that each navigation item has the correct `href`.
     */
    render(
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    )

    // Dashboard link should navigate to /dashboard
    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).toHaveAttribute("href", "/dashboard")

    // There may be multiple "Sales" links (e.g., icon + text),
    // so we collect them all and assert that at least one points to /dashboard/sales.
    const salesLinks = screen.getAllByRole("link", { name: /sales/i })
    expect(
      salesLinks.some(
        (link) => link.getAttribute("href") === "/dashboard/sales"
      )
    ).toBe(true)

    // Products link should go to /dashboard/products
    expect(
      screen.getByRole("link", { name: /products/i })
    ).toHaveAttribute("href", "/dashboard/products")

    // Settings link should go to /dashboard/settings
    expect(
      screen.getByRole("link", { name: /settings/i })
    ).toHaveAttribute("href", "/dashboard/settings")

    // Today Sales report link should go to /dashboard/reports/todaysales
    expect(
      screen.getByRole("link", { name: /today sales/i })
    ).toHaveAttribute("href", "/dashboard/reports/todaysales")
  })
})
