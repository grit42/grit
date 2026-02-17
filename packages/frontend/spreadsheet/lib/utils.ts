/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/spreadsheet.
 *
 * @grit42/spreadsheet is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/spreadsheet is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/spreadsheet. If not, see <https://www.gnu.org/licenses/>.
 */

export const maybeBoolean = (v: any) =>
  ["true", "false", "yes", "no", "on", "off"].includes(v.toString());

export function toSafeIdentifier(input: string, replacement = "_"): string {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(new RegExp("[^a-z0-9]", "g"), replacement);

  return (/^[0-9]|^.[0-9]/.test(normalized) ? `__${normalized}` : normalized).slice(0, 30);
}

export const generateUniqueID = (prefix = "") => {
  const timePart = new Date().getTime().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 15);

  return `${prefix}${timePart}${randomPart}`;
};

export const generateUniqueIntegerID = () => Math.abs(Date.now() | Date.now() * Math.random());
