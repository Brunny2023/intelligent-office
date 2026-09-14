import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

describe("Footer", () => {
  const renderFooter = () =>
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

  it("shows Intelligent Office branding and showcase provenance", () => {
    renderFooter();
    expect(screen.getByAltText("Intelligent Office")).toBeInTheDocument();
    expect(
      screen.getByText(/© 2026 the Intelligent Office showcase project\. All rights reserved\./i)
    ).toBeInTheDocument();
  });

  it("links to the focused public pages and source repository", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: /features/i })).toHaveAttribute("href", "/features");
    expect(screen.getByRole("link", { name: /demo/i })).toHaveAttribute("href", "/demo");
    expect(screen.getByRole("link", { name: /source/i })).toHaveAttribute(
      "href",
      "https://github.com/Brunny2023/intelligent-office"
    );
  });
});
