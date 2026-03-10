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
import { generateUniqueID } from "../../lib/utils/tools";

describe("tools utilities", () => {
  describe("generateUniqueID", () => {
    it("generates a unique ID", () => {
      const id1 = generateUniqueID();
      const id2 = generateUniqueID();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it("generates ID without prefix by default", () => {
      const id = generateUniqueID();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("generates ID with custom prefix", () => {
      const prefix = "test_";
      const id = generateUniqueID(prefix);

      expect(id.startsWith(prefix)).toBe(true);
    });

    it("generates different IDs with same prefix", () => {
      const prefix = "prefix_";
      const id1 = generateUniqueID(prefix);
      const id2 = generateUniqueID(prefix);

      expect(id1).not.toBe(id2);
      expect(id1.startsWith(prefix)).toBe(true);
      expect(id2.startsWith(prefix)).toBe(true);
    });

    it("handles empty string prefix", () => {
      const id = generateUniqueID("");
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("generates alphanumeric IDs", () => {
      const id = generateUniqueID();
      // Should only contain alphanumeric characters (base36)
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it("generates consistently unique IDs in rapid succession", () => {
      const ids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(generateUniqueID());
      }

      // All IDs should be unique
      expect(ids.size).toBe(count);
    });

    it("includes both time and random components", () => {
      const id = generateUniqueID();
      // ID should be reasonably long to include both time and random parts
      expect(id.length).toBeGreaterThan(10);
    });
  });
});
