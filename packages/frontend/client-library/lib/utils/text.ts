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

/** Wording helpers for counts in labels and sentences. */

/** `study` or `studies`, by count. */
export const plural = (n: number, one: string, many = `${one}s`): string =>
  n === 1 ? one : many;

/** `1 study`, `3 studies`. */
export const counted = (n: number, one: string, many?: string): string =>
  `${n} ${plural(n, one, many)}`;

export const capitalised = (text: string): string =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** `a, b, and c`, or `a, b, or c`. */
export const listed = (
  items: readonly string[],
  conjunction: "and" | "or" = "and",
): string =>
  new Intl.ListFormat("en", {
    type: conjunction === "or" ? "disjunction" : "conjunction",
  }).format(items);

/** `50 000`: thousands apart, never broken across lines. */
export const thousands = (n: number): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
