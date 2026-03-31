import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Next Template"
    );
  });

  it("renders all button variants", () => {
    render(<Home />);
    expect(screen.getByRole("button", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Outline" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Secondary" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ghost" })).toBeInTheDocument();
  });

  it("renders the input", () => {
    render(<Home />);
    expect(screen.getByPlaceholderText("Type something...")).toBeInTheDocument();
  });
});
