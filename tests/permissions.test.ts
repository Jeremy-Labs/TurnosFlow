import { describe, expect, it } from "vitest";
import { MembershipRole } from "@prisma/client";
import { assertBusinessScope, canManageBusiness } from "@/lib/permissions";
describe("tenant permissions", () => { it("allows managers only", () => { expect(canManageBusiness(MembershipRole.OWNER)).toBe(true); expect(canManageBusiness(MembershipRole.STAFF)).toBe(false); }); it("rejects cross-tenant resources", () => { expect(() => assertBusinessScope("a", "b")).toThrow(); }); });
