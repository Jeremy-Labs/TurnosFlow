import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/passwords";

describe("local passwords", () => {
  it("stores a bcrypt hash and verifies only the correct password", async () => {
    const hash = await hashPassword("demo");
    expect(hash).not.toBe("demo");
    expect(await verifyPassword("demo", hash)).toBe(true);
    expect(await verifyPassword("incorrecta", hash)).toBe(false);
  });
});
