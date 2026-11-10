import { describe, expect, it } from "vitest";
import { cleanKeyword, foldText, searchPattern, SEARCH_MAX_LENGTH } from "@/lib/books/search";

/** US-01 (GB-6): keyword clean-up, accent folding and the escaped `ilike` pattern. */

describe("cleanKeyword (B1, AC3)", () => {
  it("trims and collapses spaces", () => {
    expect(cleanKeyword("   harry   potter  ")).toBe("harry potter");
  });

  it("AC3: empty, missing or only spaces → no search", () => {
    expect(cleanKeyword(undefined)).toBe("");
    expect(cleanKeyword("")).toBe("");
    expect(cleanKeyword("    ")).toBe("");
    expect(cleanKeyword("\t \n")).toBe("");
  });

  it("B1: keeps at most 100 characters", () => {
    expect(cleanKeyword("a".repeat(150))).toHaveLength(SEARCH_MAX_LENGTH);
    expect(cleanKeyword("a".repeat(100))).toHaveLength(100);
  });

  it("uses the first value when the parameter is repeated", () => {
    expect(cleanKeyword(["dế mèn", "other"])).toBe("dế mèn");
  });
});

describe("foldText (AC1: case- and accent-insensitive)", () => {
  it("removes Vietnamese marks and lower-cases", () => {
    expect(foldText("Nguyễn Nhật Ánh")).toBe("nguyen nhat anh");
    expect(foldText("Dế Mèn Phiêu Lưu Ký")).toBe("de men phieu luu ky");
    expect(foldText("HARRY Potter")).toBe("harry potter");
  });

  it("maps đ / Đ to d", () => {
    expect(foldText("Đất rừng phương Nam")).toBe("dat rung phuong nam");
    expect(foldText("đường")).toBe("duong");
  });

  it("folds decomposed (NFD) input the same as composed (NFC)", () => {
    expect(foldText("Nguyễn".normalize("NFD"))).toBe(foldText("Nguyễn".normalize("NFC")));
  });
});

describe("searchPattern (AC1, B2)", () => {
  it("AC1: wraps the folded keyword for a 'contains' match", () => {
    expect(searchPattern("nguyen")).toBe("%nguyen%");
    expect(searchPattern("Nguyễn")).toBe("%nguyen%");
    expect(searchPattern("  Harry  ")).toBe("%harry%");
  });

  it("AC3: nothing to search → null", () => {
    expect(searchPattern("")).toBeNull();
    expect(searchPattern("   ")).toBeNull();
    expect(searchPattern("***")).toBeNull();
  });

  it("B2: % and _ match themselves, not any text", () => {
    expect(searchPattern("50%")).toBe("%50\\%%");
    expect(searchPattern("a_b")).toBe("%a\\_b%");
    expect(searchPattern("c:\\path")).toBe("%c:\\\\path%");
  });

  it("B2: quotes, commas and brackets are kept as plain text", () => {
    expect(searchPattern("o'brien")).toBe("%o'brien%");
    expect(searchPattern("a, (b)")).toBe("%a, (b)%");
  });

  it("drops * because PostgREST would turn it into a wildcard", () => {
    expect(searchPattern("har*ry")).toBe("%harry%");
  });
});
