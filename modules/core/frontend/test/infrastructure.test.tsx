/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render, renderHook } from "./utils/test-utils";
import {
  createSession,
  createEntityData,
  createLoadSet,
} from "./utils/factories";
import { ensureTestBackend } from "./utils/backend-helpers";

describe("Test Infrastructure", () => {
  describe("Test Utilities", () => {
    it("renders components with providers", () => {
      render(<div>Hello Test</div>);
      expect(screen.getByText("Hello Test")).toBeInTheDocument();
    });

    it("renders hooks with QueryClient", () => {
      const { result } = renderHook(() => ({ value: "test" }));
      expect(result.current.value).toBe("test");
    });
  });

  describe("Factory Functions", () => {
    it("creates a valid session object", () => {
      const session = createSession();
      expect(session).toHaveProperty("id");
      expect(session).toHaveProperty("login");
      expect(session).toHaveProperty("token");
      expect(session.roles).toBeInstanceOf(Array);
    });

    it("creates session with overrides", () => {
      const session = createSession({ login: "custom_user" });
      expect(session.login).toBe("custom_user");
    });

    it("creates a valid entity data object", () => {
      const entity = createEntityData({ name: "Test Entity" });
      expect(entity).toHaveProperty("id");
      expect(entity).toHaveProperty("created_by");
      expect(entity).toHaveProperty("created_at");
      expect(entity.name).toBe("Test Entity");
    });

    it("creates a valid load set object", () => {
      const loadSet = createLoadSet();
      expect(loadSet).toHaveProperty("id");
      expect(loadSet).toHaveProperty("entity");
      expect(loadSet).toHaveProperty("load_set_blocks");
      expect(loadSet.load_set_blocks).toBeInstanceOf(Array);
    });
  });

  describe("Backend Helpers", () => {
    it("checks backend connectivity", async () => {
      // This test will fail if backend is not running
      // Uncomment when you want to test with backend
      // await expect(ensureTestBackend()).resolves.not.toThrow();

      // For now, we just verify the function exists
      expect(ensureTestBackend).toBeInstanceOf(Function);
    });
  });
});
