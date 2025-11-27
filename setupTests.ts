//  frontend/setupTests.ts

import "@testing-library/jest-dom"
import { TextDecoder, TextEncoder } from "util"

/**
 * Ensure TextEncoder/TextDecoder exist in the global environment.
 * 
 * In Node/JSDOM test environments, these APIs are not always available.
 * Some libraries (like Next.js router internals or crypto utilities)
 * rely on them, so we polyfill them using Node's 'util' module.
 */

if (!globalThis.TextEncoder) {
  const utilTextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder
  globalThis.TextEncoder = utilTextEncoder
}

if (!globalThis.TextDecoder) {
  // TextDecoder from `util` works in the Node/JSDOM environment
  // Disable TypeScript complaints because util.TextDecoder doesn't strictly match DOM types
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder
}

/**
 * Create a mocked Next.js router object.
 * 
 * This replaces the real router returned from `useRouter()`
 * so component tests can:
 *   - detect navigation attempts
 *   - test redirections
 *   - avoid errors from missing Next.js runtime
 */

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined), // prefetch usually returns a promise
}

/**
 * Mock the Next.js App Router module.
 * 
 * Components using:
 *   - useRouter()
 *   - usePathname()
 *   - useSearchParams()
 *   - redirect()
 * 
 * will now use these mocks instead of the actual Next.js runtime functions.
 * 
 * jest.requireActual() ensures we keep the original exports but override selective APIs.
 */

jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation")
  return {
    ...actual,
    useRouter: jest.fn(() => mockRouter),  // return our mock router instance
    usePathname: jest.fn(() => "/"),        // pretend every test is on the "/" route
    useSearchParams: jest.fn(() => new URLSearchParams()), // mock empty search params
    redirect: jest.fn(),                    // mock redirect() to avoid actual navigation
  }
})

/**
 * Mock next-auth's session handling.
 * 
 * Most components expect:
 *   - useSession()
 *   - signIn()
 *   - signOut()
 * 
 * This prevents errors in tests caused by missing NextAuth provider.
 * 
 * Default session state is:
 *   user is NOT authenticated.
 */

jest.mock("next-auth/react", () => ({
  __esModule: true,
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

/**
 * Minimal ResizeObserver polyfill for components relying on it (e.g., Radix ScrollArea).
 */
class ResizeObserver {
  callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }
  observe() {
    /* noop */
  }
  unobserve() {
    /* noop */
  }
  disconnect() {
    /* noop */
  }
}

// @ts-ignore
if (typeof globalThis.ResizeObserver === "undefined") {
  // @ts-ignore
  globalThis.ResizeObserver = ResizeObserver
}

// Radix Select and similar components rely on pointer capture APIs.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

if (typeof window !== "undefined" && !window.matchMedia) {
  // @ts-ignore
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    media: "",
  })
}

// Export the mockRouter so individual tests can inspect navigation calls (e.g. expect(mockRouter.push).toHaveBeenCalled())
export { mockRouter }
