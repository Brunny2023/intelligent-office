import { describe, it, expect } from "vitest";
import { getTenantSlug, buildTenantUrl, TENANT_ROOT_DOMAIN } from "./tenant";

describe("getTenantSlug", () => {
  it("returns null for apex and www", () => {
    expect(getTenantSlug("globaloffice.cloud")).toBeNull();
    expect(getTenantSlug("www.globaloffice.cloud")).toBeNull();
  });

  it("returns null for local/preview hosts", () => {
    expect(getTenantSlug("localhost")).toBeNull();
    expect(getTenantSlug("app.localhost")).toBeNull();
    expect(getTenantSlug("id-preview--abc.lovable.app")).toBeNull();
    expect(getTenantSlug("something.lovableproject.com")).toBeNull();
    expect(getTenantSlug("127.0.0.1")).toBeNull();
  });

  it("extracts leftmost label as tenant slug", () => {
    expect(getTenantSlug("broadman.globaloffice.cloud")).toBe("broadman");
    expect(getTenantSlug("Acme.GlobalOffice.Cloud")).toBe("acme");
  });

  it("uses only the leftmost label for nested subs", () => {
    expect(getTenantSlug("app.broadman.globaloffice.cloud")).toBe("app");
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