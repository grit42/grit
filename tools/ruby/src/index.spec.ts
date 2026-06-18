import { vi, describe, it, expect, beforeEach } from "vitest";
import { execSync, execFileSync } from "child_process";
import { existsSync } from "fs";

vi.mock("child_process", () => ({
  execSync: vi.fn().mockReturnValue(Buffer.from("")),
  execFileSync: vi.fn().mockReturnValue(Buffer.from("")),
}));

vi.mock("fs", async (importOriginal) => {
  const orig = await importOriginal<typeof import("fs")>();
  return { ...orig, existsSync: vi.fn().mockReturnValue(false) };
});

vi.mock("@nx/devkit", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@nx/devkit")>();
  return { ...orig, validateDependency: vi.fn() };
});

const { createDependencies } = await import("./index");

const baseCtx = {
  workspaceRoot: "/workspace",
  projects: {},
  nxJsonConfiguration: {},
  fileMap: { projectFileMap: {}, nonProjectFiles: [] },
};

describe("createDependencies — shell injection prevention (Fix #5)", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockClear();
    vi.mocked(execFileSync).mockClear();
    vi.mocked(existsSync).mockReturnValue(false);
  });

  describe("gemspec project (alerts #4 and #5)", () => {
    it("uses execFileSync instead of execSync for gem_name.rb and gemspec_deps.rb", () => {
      vi.mocked(existsSync).mockImplementation((p) =>
        String(p).endsWith(".gemspec"),
      );

      createDependencies(
        {},
        {
          ...baseCtx,
          projects: {
            "my-gem": { root: "modules/my-gem", name: "my-gem", targets: {} },
          },
        },
      );

      expect(execSync).not.toHaveBeenCalled();
      expect(execFileSync).toHaveBeenCalled();
      vi.mocked(execFileSync).mock.calls.forEach(([cmd, args]) => {
        expect(cmd).toBe("ruby");
        expect(Array.isArray(args)).toBe(true);
      });
    });
  });

  describe("Gemfile-only project (alert #6)", () => {
    it("uses execFileSync instead of execSync for gemfile_deps.rb", () => {
      vi.mocked(existsSync).mockImplementation((p) =>
        String(p).endsWith("Gemfile"),
      );

      createDependencies(
        {},
        {
          ...baseCtx,
          projects: {
            "my-app": { root: "modules/my-app", name: "my-app", targets: {} },
          },
        },
      );

      expect(execSync).not.toHaveBeenCalled();
      expect(execFileSync).toHaveBeenCalled();
      const [cmd, args] = vi.mocked(execFileSync).mock.calls[0];
      expect(cmd).toBe("ruby");
      expect(Array.isArray(args)).toBe(true);
    });
  });
});
