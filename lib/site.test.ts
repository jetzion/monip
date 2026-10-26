import { afterEach, describe, expect, it, vi } from "vitest";

import { isIndexable, siteUrl } from "./site";

afterEach(() => vi.unstubAllEnvs());

describe("siteUrl", () => {
  it("uses SITE_URL without a trailing slash", () => {
    vi.stubEnv("SITE_URL", "https://www.example.com/");
    expect(siteUrl()).toBe("https://www.example.com");
  });

  it("throws in production when SITE_URL is missing", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => siteUrl()).toThrow("SITE_URL is not set.");
  });

  it("falls back to localhost in development", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("isIndexable", () => {
  it("blocks Vercel preview deployments", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isIndexable()).toBe(false);
  });

  it("allows the Vercel production deployment on the real domain", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SITE_URL", "https://www.example.com");
    expect(isIndexable()).toBe(true);
  });

  it("blocks a temporary vercel.app production site", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SITE_URL", "https://monip-group.vercel.app");
    expect(isIndexable()).toBe(false);
  });

  it("allows non-Vercel environments", () => {
    vi.stubEnv("VERCEL_ENV", "");
    expect(isIndexable()).toBe(true);
  });
});
