import { describe, it, expect } from "vitest";
import { getTenantSlug, buildTenantUrl, TENANT_ROOT_DOMAIN } from "./tenant";

describe("getTenantSlug", () => {
  it("returns null for apex and www", () => {
    expect(getTenantSlug("intelligent-office.example")).toBeNull();
    expect(getTenantSlug("www.intelligent-office.example")).toBeNull();
  });

  it("returns null for local/preview hosts", () => {
    expect(getTenantSlug("localhost")).toBeNull();
    expect(getTenantSlug("app.localhost")).toBeNull();
    expect(getTenantSlug("preview.example.test")).toBeNull();
    expect(getTenantSlug("something.preview.example.test")).toBeNull();
    expect(getTenantSlug("127.0.0.1")).toBeNull();
  });

  it("extracts leftmost label as tenant slug", () => {
    expect(getTenantSlug("broadman.intelligent-office.example")).toBe("broadman");
    expect(getTenantSlug("Acme.intelligent-office.example")).toBe("acme");
  });

  it("uses only the leftmost label for nested subs", () => {
    expect(getTenantSlug("app.broadman.intelligent-office.example")).toBe("app");
  });

  it("returns null for unrelated domains and empty input", () => {
    expect(getTenantSlug("example.com")).toBeNull();
    expect(getTenantSlug("")).toBeNull();
  });
});

describe("buildTenantUrl", () => {
  it("builds https url on the root domain", () => {
    expect(buildTenantUrl("broadman")).toBe(`https://broadman.${TENANT_ROOT_DOMAIN}`);
  });
});