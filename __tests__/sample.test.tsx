import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

function GreetingButton() {
  const [message, setMessage] = React.useState("Hello")

  return (
    <div>
      <p>{message}</p>
      <button onClick={() => setMessage("Welcome!")}>Update greeting</button>
    </div>
  )
}

describe("GreetingButton", () => {
  it("updates the message when clicked", async () => {
    const user = userEvent.setup()
    render(<GreetingButton />)

    expect(screen.getByText("Hello")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /update greeting/i }))

    expect(screen.getByText("Welcome!")).toBeInTheDocument()
  })
})
