/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  readLocalStorageValue,
  useLocalStorage,
} from "../lib/hooks/useLocalStorage";

describe("useLocalStorage — console.warn format string safety (Fix #4)", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("readLocalStorageValue (alert #1, line 40)", () => {
    it("passes key as a separate argument, not interpolated into the format string", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage unavailable");
      });

      const key = "%s";
      readLocalStorageValue(key, null);

      expect(warnSpy).toHaveBeenCalledOnce();
      const [firstArg, secondArg] = warnSpy.mock.calls[0];
      expect(firstArg).not.toContain(key);
      expect(secondArg).toBe(key);
    });
  });

  describe("useLocalStorage setValue (alert #2, line 87)", () => {
    it("passes key as a separate argument, not interpolated into the format string", async () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("storage unavailable");
      });

      const key = "%s";
      const { result } = renderHook(() => useLocalStorage(key, "default"));

      await act(async () => {
        result.current[1]("new value");
      });

      expect(warnSpy).toHaveBeenCalledOnce();
      const [firstArg, secondArg] = warnSpy.mock.calls[0];
      expect(firstArg).not.toContain(key);
      expect(secondArg).toBe(key);
    });
  });
});
