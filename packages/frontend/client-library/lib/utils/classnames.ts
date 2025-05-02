/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/client-library.
 *
 * @grit/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

/***
 * Returns a string of class names, based on the given arguments.
 * @example classnames("foo", "bar") => "foo bar"
 * @example
 * classnames(
 * {
 *  [styles.foo]: false,
 *  bar: true
 * }, "boo") => "bar boo"
 **/
export default function classnames(
  ...classNames: (string | undefined | { [key: string]: boolean })[]
) {
  return classNames
    .map((x) => {
      if (typeof x === "string") {
        return x;
      }
      if (typeof x === "object") {
        return Object.keys(x)
          .filter((key) => x[key])
          .join(" ");
      }
      return "";
    })
    .join(" ")
    .trim();
}
