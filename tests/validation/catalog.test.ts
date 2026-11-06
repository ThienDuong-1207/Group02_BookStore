import { describe, expect, it } from "vitest";
import { CATALOG, catalogNameSchema, isCatalogKind, type CatalogKind } from "@/lib/validation/catalog";

const kinds = Object.keys(CATALOG) as CatalogKind[];

/** US-17 / US-18 B1: name 1–max characters after trimming; empty or whitespace-only rejected. */
describe.each(kinds)("catalogNameSchema(%s)", (kind) => {
  const { maxLength, messages } = CATALOG[kind];
  const parse = (name: unknown) => catalogNameSchema(kind).safeParse({ name });

  it("trims the name", () => {
    expect(parse("  Science Fiction  ")).toMatchObject({ success: true, data: { name: "Science Fiction" } });
  });

  it.each(["", "   ", "\t\n"])("rejects an empty or whitespace-only name (%j)", (name) => {
    const result = parse(name);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(messages.required);
  });

  it(`accepts 1 and ${maxLength} characters, rejects ${maxLength + 1}`, () => {
    expect(parse("A").success).toBe(true);
    expect(parse("a".repeat(maxLength)).success).toBe(true);
    const tooLong = parse("a".repeat(maxLength + 1));
    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues[0].message).toBe(messages.tooLong);
  });

  it(`counts length after trimming (${maxLength} characters + spaces is accepted)`, () => {
    expect(parse(`  ${"a".repeat(maxLength)}  `).success).toBe(true);
  });

  it("keeps Vietnamese letters", () => {
    expect(parse("Văn học Việt Nam")).toMatchObject({ success: true, data: { name: "Văn học Việt Nam" } });
  });

  it("rejects a missing name", () => {
    expect(parse(undefined).success).toBe(false);
  });
});

describe("isCatalogKind", () => {
  it("accepts the known kinds only", () => {
    for (const kind of kinds) expect(isCatalogKind(kind)).toBe(true);
    expect(isCatalogKind("books")).toBe(false);
    expect(isCatalogKind("profiles")).toBe(false);
    expect(isCatalogKind("toString")).toBe(false);
    expect(isCatalogKind(undefined)).toBe(false);
  });
});

describe("categories (US-17)", () => {
  it("uses the messages from the acceptance criteria", () => {
    expect(CATALOG.categories.maxLength).toBe(100);
    expect(CATALOG.categories.messages.exists).toBe("Category already exists");
    expect(CATALOG.categories.messages.inUse).toBe("Move or delete the books in this category first");
  });
});

describe("authors (US-18)", () => {
  it("uses the same rules as categories, with names up to 150 characters", () => {
    expect(CATALOG.authors.maxLength).toBe(150);
    expect(CATALOG.authors.bookColumn).toBe("author_id");
    expect(CATALOG.authors.messages.exists).toBe("Author already exists");
    expect(CATALOG.authors.messages.required).toBe("Author name is required");
    expect(CATALOG.authors.messages.inUse).toBe("Move or delete the books by this author first");
  });
});
