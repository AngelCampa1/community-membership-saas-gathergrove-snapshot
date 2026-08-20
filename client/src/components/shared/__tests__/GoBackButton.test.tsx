import { render, screen, fireEvent } from "@testing-library/react";
import { GoBackButton } from "../GoBackButton";

describe("GoBackButton", () => {
  const originalHistory = window.history;

  beforeEach(() => {
    jest.spyOn(window.history, "back").mockImplementation(() => {});
    Object.defineProperty(window, "location", {
      writable: true,
      value: { href: "/" },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders a button with 'Go Back' text", () => {
    render(<GoBackButton />);
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
  });

  it("calls history.back() when history has entries", () => {
    Object.defineProperty(window.history, "length", { value: 3, configurable: true });

    render(<GoBackButton />);
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));

    expect(window.history.back).toHaveBeenCalledTimes(1);
  });

  it("navigates to '/' when there is no history to go back to", () => {
    Object.defineProperty(window.history, "length", { value: 1, configurable: true });

    render(<GoBackButton />);
    fireEvent.click(screen.getByRole("button", { name: /go back/i }));

    expect(window.history.back).not.toHaveBeenCalled();
    expect(window.location.href).toBe("/");
  });
});
