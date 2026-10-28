import { describe, expect, it } from "vitest";
import { loginSchema, passwordSchema, phoneSchema, registerSchema, toFieldErrors } from "@/lib/validation/auth";

const valid = { fullName: "Nguyen Van A", email: "a@example.com", password: "abc12345", phone: "" };

describe("US-10 B1 – password rules", () => {
  it("rejects 7 characters and accepts 8", () => {
    expect(passwordSchema.safeParse("abc1234").success).toBe(false);
    expect(passwordSchema.safeParse("abc12345").success).toBe(true);
  });

  it("accepts 64 characters and rejects 65", () => {
    expect(passwordSchema.safeParse("a1".repeat(32)).success).toBe(true);
    expect(passwordSchema.safeParse("a1".repeat(32) + "x").success).toBe(false);
  });

  it("requires at least one letter and one digit", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
  });
});

describe("US-10 B1 – phone and email", () => {
  it("phone is optional (empty string = not given)", () => {
    expect(phoneSchema.safeParse("").data).toBeUndefined();
    expect(phoneSchema.safeParse(undefined).success).toBe(true);
  });

  it("phone must be 10 digits starting with 0", () => {
    expect(phoneSchema.safeParse("0912345678").success).toBe(true);
    expect(phoneSchema.safeParse("091234567").success).toBe(false); // 9 digits
    expect(phoneSchema.safeParse("09123456789").success).toBe(false); // 11 digits
    expect(phoneSchema.safeParse("1912345678").success).toBe(false); // does not start with 0
    expect(phoneSchema.safeParse("09123abc78").success).toBe(false);
  });

  it("email must be a valid format and is normalised", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(registerSchema.parse({ ...valid, email: "  A@Example.COM " }).email).toBe("a@example.com");
  });
});

describe("US-10 – register / login schema", () => {
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("requires full name (whitespace only is empty) and limits it to 100 chars", () => {
    expect(registerSchema.safeParse({ ...valid, fullName: "   " }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, fullName: "x".repeat(101) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, fullName: "x".repeat(100) }).success).toBe(true);
  });

  it("returns one message per field", () => {
    const result = registerSchema.safeParse({ fullName: "", email: "bad", password: "short", phone: "123" });
    expect(result.success).toBe(false);
    const errors = toFieldErrors(result.error!);
    expect(Object.keys(errors).sort()).toEqual(["email", "fullName", "password", "phone"]);
  });

  it("login only requires both fields to be filled in", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@example.com", password: "" }).success).toBe(false);
  });
});
