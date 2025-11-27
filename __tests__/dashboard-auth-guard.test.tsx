// frontend/__tests__/dashboard-auth-guard.test.tsx

import React from "react"
import { render, screen } from "@testing-library/react"

import DashboardPage from "@/app/dashboard/page"
import { useSession } from "next-auth/react"
import { mockRouter } from "../setupTests"

/**
 * Mock the chart component so we don't render the real chart in tests.
 * Instead, we render a simple <div> with a test id for easy assertions.
 */
jest.mock("@/components/chart-area-interactive", () => ({
  ChartAreaInteractive: () => (
    <div data-testid="chart-area">Chart Area</div>
  ),
}))

/**
 * Mock the section cards component.
 * This isolates the test from its internal implementation and keeps
 * the dashboard test focused on auth guard behavior and layout.
 */
jest.mock("@/components/section-cards", () => ({
  SectionCards: () => (
    <div data-testid="section-cards">Section Cards</div>
  ),
}))

/**
 * Mock the data table component.
 * Again, we only care that it's rendered, not how it behaves internally.
 */
jest.mock("@/components/data-table", () => ({
  DataTable: () => (
    <div data-testid="data-table">Data Table</div>
  ),
}))

describe("Dashboard auth guard", () => {
  beforeEach(() => {
    // Reset all Jest mocks between tests to avoid state leaking
    jest.clearAllMocks()
    // Specifically clear navigation calls
    mockRouter.push.mockClear()
  })

  it("renders dashboard content when session is authenticated", () => {
    /**
     * Mock useSession to simulate an authenticated user.
     * - data: contains a fake user object
     * - status: "authenticated"
     */
    jest.mocked(useSession).mockReturnValue({
      data: { user: { name: "Alice" } } as any,
      status: "authenticated",
      update: jest.fn(),
    })

    // Render the dashboard page
    render(<DashboardPage />)

    // When authenticated, dashboard widgets should be visible
    expect(
      screen.getByTestId("section-cards")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("chart-area")
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("data-table")
    ).toBeInTheDocument()

    // And no redirect to /login should occur
    expect(mockRouter.push).not.toHaveBeenCalledWith("/login")
  })

  it("redirects to login when session is unauthenticated", () => {
    /**
     * Mock useSession to simulate an unauthenticated user.
     * - data: null
     * - status: "unauthenticated"
     */
    jest.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    })

    // Render the dashboard page
    render(<DashboardPage />)

    // In unauthenticated state, the auth guard should redirect to /login
    expect(mockRouter.push).toHaveBeenCalledWith("/login")
  })
})
