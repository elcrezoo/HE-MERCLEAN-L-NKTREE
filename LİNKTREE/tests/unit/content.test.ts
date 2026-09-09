import { describe, expect, it } from "vitest";
import { localized, mergeUtm, safeDestination } from "@/lib/content";
import { claims, links } from "@/lib/data";

describe("public content safety", () => {
  it("falls back to Turkish localized content", () => {
    expect(localized({ titleTr: "Başlık" }, "title", "en")).toBe("Başlık");
  });
  it("accepts only HTTP(S) destinations", () => {
    expect(safeDestination("https://heimerclean.com")?.hostname).toBe("heimerclean.com");
    expect(safeDestination("javascript:alert(1)")).toBeNull();
  });
  it("merges only recognized UTM values", () => {
    const value = mergeUtm("https://heimerclean.com/download?x=1", { utm_source: "hub", token: "secret" });
    expect(value).toContain("utm_source=hub");
    expect(value).not.toContain("token");
  });
  it("contains all eleven official supplied destinations", () => {
    expect(links).toHaveLength(11);
    expect(new Set(links.map((link) => link.slug)).size).toBe(11);
  });
  it("ships only sourced public fallback claims", () => {
    expect(claims.every((claim) => claim.sourceUrl && ["VERIFIED_PUBLIC","QUALIFIED_PUBLIC"].includes(claim.status))).toBe(true);
  });
});
