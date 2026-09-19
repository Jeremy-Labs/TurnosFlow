import { describe, expect, it } from "vitest";
import { authCallbacks } from "@/lib/auth-session";

describe("authenticated session", () => {
  it("copies the authenticated user id into JWT and session", async () => {
    const token = await authCallbacks.jwt({ token: {}, user: { id: "user-123" }, account: null, profile: undefined, trigger: "signIn", isNewUser: false });
    const session = await authCallbacks.session({ session: { user: {}, expires: "2030-01-01" }, token, user: undefined, newSession: undefined, trigger: undefined });
    expect(token.userId).toBe("user-123");
    expect(session.user?.id).toBe("user-123");
  });
});
