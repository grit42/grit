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
  formatDateNumber,
  formatDate,
  formatDateToInput,
} from "../../lib/utils/date";

describe("date utilities", () => {
  describe("formatDateNumber", () => {
    it("pads single-digit numbers with zero", () => {
      expect(formatDateNumber(1)).toBe("01");
      expect(formatDateNumber(5)).toBe("05");
      expect(formatDateNumber(9)).toBe("09");
    });

    it("does not pad double-digit numbers", () => {
      expect(formatDateNumber(10)).toBe(10);
      expect(formatDateNumber(15)).toBe(15);
      expect(formatDateNumber(99)).toBe(99);
    });

    it("handles edge case of zero", () => {
      expect(formatDateNumber(0)).toBe("00");
    });
  });

  describe("formatDate", () => {
    it("formats date without time", () => {
      const date = new Date("2024-01-15T14:30:00Z");
      const formatted = formatDate(date, false);
      expect(formatted).toMatch(/15 Jan\. 2024/);
      expect(formatted).not.toContain(":");
    });

    it("formats date with time and timezone", () => {
      const date = new Date("2024-01-15T14:30:00Z");
      const formatted = formatDate(date, true);
      expect(formatted).toMatch(/15 Jan\. 2024/);
      expect(formatted).toContain(":");
      expect(formatted).toMatch(/UTC[+-]\d+/);
    });

    it("handles different months", () => {
      const january = new Date("2024-01-15");
      const december = new Date("2024-12-15");

      expect(formatDate(january)).toContain("Jan.");
      expect(formatDate(december)).toContain("Dec.");
    });

    it("handles leap year dates", () => {
      const leapDay = new Date("2024-02-29");
      expect(formatDate(leapDay)).toContain("29 Feb. 2024");
    });
  });

  describe("formatDateToInput", () => {
    it("formats date without time for date input", () => {
      const date = new Date("2024-01-15T14:30:00Z");
      const formatted = formatDateToInput(date, false);
      expect(formatted).toBe("2024-01-15");
    });

    it("formats date with time for datetime-local input", () => {
      const date = new Date("2024-01-15T14:30:45Z");
      const formatted = formatDateToInput(date, true);
      expect(formatted).toMatch(/2024-01-15T\d{2}:\d{2}:\d{2}/);
    });

    it("handles string date input", () => {
      const formatted = formatDateToInput("2024-01-15", false);
      expect(formatted).toBe("2024-01-15");
    });

    it("handles number timestamp input", () => {
      const timestamp = new Date("2024-01-15").getTime();
      const formatted = formatDateToInput(timestamp, false);
      expect(formatted).toBe("2024-01-15");
    });

    it("handles ISO string input", () => {
      const isoString = "2024-01-15T14:30:00.000Z";
      const formatted = formatDateToInput(isoString, false);
      expect(formatted).toBe("2024-01-15");
    });
  });
});
