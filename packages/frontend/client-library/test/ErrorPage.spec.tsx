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
import { render } from "@testing-library/react";
import ErrorPage from "../lib/components/ErrorPage";

// Call sites pass a hook's error, which is rarely a string.
const heading = (error: unknown) =>
  render(<ErrorPage error={error} />).container.querySelector("h3")
    ?.textContent;

describe("ErrorPage", () => {
  it.each([
    ["a string", "No data", "No data"],
    ["the controllers' payload", { success: false, msg: "gone" }, "gone"],
    ["an Error", new Error("Request failed"), "Request failed"],
    ["a message", { message: "one" }, "one"],
    ["an error key", { error: "two" }, "two"],
    ["a detail", { detail: "three" }, "three"],
    [
      "a list of errors",
      { errors: ["too short", "taken"] },
      "too short, taken",
    ],
    ["anything else as JSON", { status: 500 }, '{"status":500}'],
    ["undefined", undefined, "An error occured"],
    ["null", null, "An error occured"],
  ])("shows %s", (_, error, expected) => {
    expect(heading(error)).toBe(expected);
  });

  it("renders whatever it is given", () => {
    for (const value of [
      0,
      false,
      NaN,
      [],
      {},
      { msg: "" },
      Symbol("s"),
      () => "x",
      new Map(),
    ]) {
      expect(typeof heading(value)).toBe("string");
    }
  });
});
