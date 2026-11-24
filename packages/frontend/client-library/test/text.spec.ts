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

import { describe, expect, it } from "vitest";
import {
  capitalised,
  counted,
  listed,
  plural,
  thousands,
} from "../lib/utils/text";

describe("text helpers", () => {
  it("pick the singular only for exactly one", () => {
    expect(plural(1, "male")).toBe("male");
    expect(plural(0, "male")).toBe("males");
    expect(plural(2, "study", "studies")).toBe("studies");
    expect(counted(1, "study", "studies")).toBe("1 study");
    expect(counted(3, "study", "studies")).toBe("3 studies");
  });

  it("capitalise the first letter only", () => {
    expect(capitalised("females")).toBe("Females");
    expect(capitalised("")).toBe("");
  });

  it("list items with and, or with or", () => {
    expect(listed(["g/L"])).toBe("g/L");
    expect(listed(["a", "b", "c"])).toBe("a, b, and c");
    expect(listed(["mg/dL", "mmol/L"], "or")).toBe("mg/dL or mmol/L");
  });

  it("set thousands apart with a space that never breaks", () => {
    expect(thousands(999)).toBe("999");
    expect(thousands(50000)).toBe("50\u00a0000");
    expect(thousands(1234567)).toBe("1\u00a0234\u00a0567");
  });
});
