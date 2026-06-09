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
import {
  isValidRegexp,
  getIsFilterActive,
  getIsFiltersActive,
} from "../../lib/utils/filters";
import type { Filter } from "@grit42/table";

describe("filter utilities", () => {
  describe("isValidRegexp", () => {
    it("returns true for valid regex patterns", () => {
      expect(isValidRegexp(".*")).toBe(true);
      expect(isValidRegexp("^test$")).toBe(true);
      expect(isValidRegexp("[a-z]+")).toBe(true);
      expect(isValidRegexp("\\d{3}")).toBe(true);
    });

    it("returns false for invalid regex patterns", () => {
      expect(isValidRegexp("[invalid")).toBe(false);
      expect(isValidRegexp("(unclosed")).toBe(false);
      expect(isValidRegexp("*invalid")).toBe(false);
      expect(isValidRegexp("(?invalid)")).toBe(false);
    });

    it("returns false for null or empty regex", () => {
      expect(isValidRegexp(null)).toBe(false);
      expect(isValidRegexp("")).toBe(false);
    });

    it("handles special regex characters", () => {
      expect(isValidRegexp("\\s")).toBe(true);
      expect(isValidRegexp("\\w+")).toBe(true);
      expect(isValidRegexp("\\.")).toBe(true);
    });

    it("handles complex patterns", () => {
      expect(isValidRegexp("^(?:[a-z0-9]+)$")).toBe(true);
      expect(isValidRegexp("(?<name>[a-z]+)")).toBe(true);
    });
  });

  describe("getIsFilterActive", () => {
    it("returns false if filter is not active", () => {
      const filter: Filter = {
        id: "1",
        type: "string",
        column: "name",
        property: "name",
        property_type: "string",
        active: false,
        operator: "eq",
        value: "test",
      };
      expect(getIsFilterActive(filter)).toBe(false);
    });

    it("returns true for empty operator regardless of value", () => {
      const filter: Filter = {
        id: "1",
        type: "string",
        column: "name",
        property: "name",
        property_type: "string",
        active: true,
        operator: "empty",
        value: null,
      };
      expect(getIsFilterActive(filter)).toBe(true);
    });

    it("returns true for not_empty operator regardless of value", () => {
      const filter: Filter = {
        id: "1",
        type: "string",
        column: "name",
        property: "name",
        property_type: "string",
        active: true,
        operator: "not_empty",
        value: null,
      };
      expect(getIsFilterActive(filter)).toBe(true);
    });

    it("returns true for valid regexp operator", () => {
      const filter: Filter = {
        id: "1",
        type: "string",
        column: "name",
        property: "name",
        property_type: "string",
        active: true,
        operator: "regexp",
        value: "^test.*",
      };
      expect(getIsFilterActive(filter)).toBe(true);
    });

    it("returns false for invalid regexp operator", () => {
      const filter: Filter = {
        id: "1",
        type: "string",
        column: "name",
        property: "name",
        property_type: "string",
        active: true,
        operator: "regexp",
        value: "[invalid",
      };
      expect(getIsFilterActive(filter)).toBe(false);
    });

    it("returns true for filter with non-null value", () => {
      const filter: Filter = {
        id: "1",
        type: "string",
        column: "name",
        property: "name",
        property_type: "string",
        active: true,
        operator: "eq",
        value: "test",
      };
      expect(getIsFilterActive(filter)).toBe(true);
    });

    it("returns false for filter with null value and regular operator", () => {
      const filter: Filter = {
        id: "1",
        type: "string",
        column: "name",
        property: "name",
        property_type: "string",
        active: true,
        operator: "eq",
        value: null,
      };
      expect(getIsFilterActive(filter)).toBe(false);
    });

    it("handles numeric values", () => {
      const filter: Filter = {
        id: "1",
        type: "number",
        column: "count",
        property: "count",
        property_type: "number",
        active: true,
        operator: "gt",
        value: 0,
      };
      expect(getIsFilterActive(filter)).toBe(true);
    });

    it("handles boolean values", () => {
      const filter: Filter = {
        id: "1",
        type: "boolean",
        column: "enabled",
        property: "enabled",
        property_type: "boolean",
        active: true,
        operator: "eq",
        value: false,
      };
      expect(getIsFilterActive(filter)).toBe(true);
    });
  });

  describe("getIsFiltersActive", () => {
    const createFilter = (
      active: boolean,
      operator: string,
      value: any,
    ): Filter => ({
      id: "1",
      type: "string",
      column: "test",
      property: "test",
      property_type: "string",
      active,
      operator,
      value,
    });

    it("returns false for empty filter array", () => {
      expect(getIsFiltersActive([])).toBe(false);
    });

    it("returns false when no filters are active", () => {
      const filters: Filter[] = [
        createFilter(false, "eq", "test"),
        createFilter(false, "gt", 18),
      ];
      expect(getIsFiltersActive(filters)).toBe(false);
    });

    it("returns true when at least one filter is active", () => {
      const filters: Filter[] = [
        createFilter(false, "eq", "test"),
        createFilter(true, "gt", 18),
      ];
      expect(getIsFiltersActive(filters)).toBe(true);
    });

    it("returns true when all filters are active", () => {
      const filters: Filter[] = [
        createFilter(true, "eq", "test"),
        createFilter(true, "gt", 18),
      ];
      expect(getIsFiltersActive(filters)).toBe(true);
    });

    it("handles filters with null values correctly", () => {
      const filters: Filter[] = [
        createFilter(true, "eq", null),
        createFilter(true, "empty", null),
      ];
      expect(getIsFiltersActive(filters)).toBe(true);
    });

    it("handles filters with invalid regex", () => {
      const filters: Filter[] = [
        createFilter(true, "regexp", "[invalid"),
        createFilter(true, "gt", 18),
      ];
      expect(getIsFiltersActive(filters)).toBe(true);
    });
  });
});
