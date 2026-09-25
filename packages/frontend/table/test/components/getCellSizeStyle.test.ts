/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/table.
 *
 * @grit42/table is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/table is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/table. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, it, expect } from "vitest";
import getCellSizeStyle from "../../lib/components/getCellSizeStyle";

describe("getCellSizeStyle", () => {
  it("returns a fixed width/maxWidth pair for a non-flex column", () => {
    expect(getCellSizeStyle("--col-name-size")).toEqual({
      width: "calc(var(--col-name-size) * 1px)",
      maxWidth: "calc(var(--col-name-size) * 1px)",
    });
  });

  it("returns a fixed width/maxWidth pair when flex is 0", () => {
    expect(getCellSizeStyle("--col-name-size", 0)).toEqual({
      width: "calc(var(--col-name-size) * 1px)",
      maxWidth: "calc(var(--col-name-size) * 1px)",
    });
  });

  it("returns a flex/minWidth pair for a flex column", () => {
    expect(getCellSizeStyle("--col-name-size", 1)).toEqual({
      flex: "1 1 0px",
      minWidth: "calc(var(--col-name-size) * 1px)",
    });
  });

  it("scales the flex shorthand with the given flex value", () => {
    expect(getCellSizeStyle("--col-name-size", 2)).toEqual({
      flex: "2 2 0px",
      minWidth: "calc(var(--col-name-size) * 1px)",
    });
  });
});
