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

  it("shows Global Office branding and Soteria copyright", () => {
    renderFooter();
    expect(screen.getByAltText("Global Office")).toBeInTheDocument();
    expect(
      screen.getByText(/© 2026 Soteria AI Technologies\. All rights reserved\./i)
    ).toBeInTheDocument();
  });

  it("links to all legal and trust pages", () => {
    renderFooter();
    const hrefs = ["/legal/privacy", "/legal/terms", "/legal/dpa", "/legal/subprocessors", "/trust"];
    for (const href of hrefs) {
      expect(
        screen.getByRole("link", { name: new RegExp(href.split("/").pop()!, "i") })
      ).toHaveAttribute("href", href);
    }
  });
});