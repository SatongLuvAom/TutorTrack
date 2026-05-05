import { afterEach, describe, expect, it, vi } from "vitest";
import { UserRole, UserStatus } from "../lib/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock("../lib/current-user", () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

const { requireRole, requireUser } = await import("../lib/guards");

const tutorUser = {
  id: "user-tutor-1",
  email: "tutor1@tutortrack.test",
  name: "Tutor One",
  role: UserRole.TUTOR,
  status: UserStatus.ACTIVE,
  studentProfileId: null,
  parentProfileId: null,
  tutorProfileId: "tutor-1",
};

describe("server-side route guards", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects public users away from protected dashboard routes", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("allows the matching role", async () => {
    mocks.getCurrentUser.mockResolvedValue(tutorUser);

    await expect(requireRole(UserRole.TUTOR)).resolves.toEqual(tutorUser);
  });

  it("redirects authenticated users away from another role dashboard", async () => {
    mocks.getCurrentUser.mockResolvedValue(tutorUser);

    await expect(requireRole(UserRole.ADMIN)).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard/tutor",
    );
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard/tutor");
  });
});
