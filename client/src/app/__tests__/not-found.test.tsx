import { render, screen } from "@testing-library/react";
import NotFound, { metadata } from "../not-found";

// GoBackButton uses window.history — mock it
jest.mock("@/components/shared/GoBackButton", () => ({
  GoBackButton: () => <button>Go Back</button>,
}));

describe("NotFound page", () => {
  it("exports correct metadata", () => {
    expect(metadata.title).toBe("Page Not Found");
    expect(metadata.description).toContain("couldn't find");
  });

  it("sets robots to noindex nofollow", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();
  });

  it("renders Go to Homepage link pointing to /", () => {
    render(<NotFound />);
    const homeLink = screen.getByRole("link", { name: /go to homepage/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders Go Back button via GoBackButton component", () => {
    render(<NotFound />);
    expect(screen.getByRole("button", { name: /go back/i })).toBeInTheDocument();
  });

  it("renders helpful navigation links", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: /login/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: /resources/i })).toHaveAttribute("href", "/resources");
    expect(screen.getByRole("link", { name: /support/i })).toHaveAttribute("href", "/support");
  });
});
