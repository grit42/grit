/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  ImmutableTree,
  JsonGroup,
  JsonTree,
  ListValues,
  Utils as QbUtils,
} from "@react-awesome-query-builder/ui";

export const makeEmptyTree = (): JsonGroup =>
  ({
    id: QbUtils.uuid(),
    type: "group",
    properties: { not: false, conjunction: "AND" },
  }) as JsonGroup;

export const safeLoadTree = (t: unknown): ImmutableTree => {
  try {
    if (t && typeof t === "object" && "id" in t && "type" in t) {
      return QbUtils.loadTree(t as JsonTree);
    }
  } catch {
    // fall through
  }
  return QbUtils.loadTree(makeEmptyTree());
};

export const transformSelectListValues = (
  listValues: ListValues = [],
): { value: string; label: string }[] => {
  if (Array.isArray(listValues)) {
    return listValues.map((v) =>
      typeof v === "object"
        ? { value: v.value.toString(), label: v.title ?? v.value.toString() }
        : { value: v.toString(), label: v.toString() },
    );
  }
  return [];
};
