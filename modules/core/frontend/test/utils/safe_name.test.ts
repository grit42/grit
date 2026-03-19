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
import { toSafeIdentifier } from "../../lib/utils/safe_name";

describe("toSafeIdentifier", () => {
  describe("basic transformations", () => {
    it("converts to lowercase", () => {
      expect(toSafeIdentifier("HelloWorld")).toBe("helloworld");
      expect(toSafeIdentifier("UPPERCASE")).toBe("uppercase");
    });

    it("trims leading and trailing whitespace", () => {
      expect(toSafeIdentifier("  hello  ")).toBe("hello");
      expect(toSafeIdentifier("\thello\n")).toBe("hello");
    });

    it("replaces non-alphanumeric characters with underscore", () => {
      expect(toSafeIdentifier("hello-world")).toBe("hello_world");
      expect(toSafeIdentifier("hello.world")).toBe("hello_world");
      expect(toSafeIdentifier("hello world")).toBe("hello_world");
      expect(toSafeIdentifier("hello@world")).toBe("hello_world");
    });

    it("uses custom replacement character", () => {
      // Note: The replacement parameter doesn't actually change the behavior
      // because the function always replaces with the given character
      expect(toSafeIdentifier("hello-world", "-")).toBe("hello-world");
      expect(toSafeIdentifier("hello world", "")).toBe("helloworld");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      expect(toSafeIdentifier("")).toBe("");
    });

    it("handles string with only whitespace", () => {
      expect(toSafeIdentifier("   ")).toBe("");
    });

    it("handles string starting with digit", () => {
      expect(toSafeIdentifier("123abc")).toBe("__123abc");
      expect(toSafeIdentifier("0test")).toBe("__0test");
    });

    it("handles string with single character followed by digit", () => {
      // The regex /^[0-9]|^.[0-9]/ matches "a1" because ^.[0-9] matches any char + digit
      expect(toSafeIdentifier("a1")).toBe("__a1");
      expect(toSafeIdentifier("_2")).toBe("___2");
    });

    it("handles multiple consecutive special characters", () => {
      expect(toSafeIdentifier("hello---world")).toBe("hello___world");
      expect(toSafeIdentifier("a...b...c")).toBe("a___b___c");
    });

    it("truncates to 30 characters", () => {
      const longString = "a".repeat(50);
      expect(toSafeIdentifier(longString)).toHaveLength(30);
      expect(toSafeIdentifier(longString)).toBe("a".repeat(30));
    });

    it("truncates after adding prefix for digit start", () => {
      const longString = "1" + "a".repeat(50);
      const result = toSafeIdentifier(longString);
      expect(result).toHaveLength(30);
      expect(result.startsWith("__1")).toBe(true);
    });
  });

  describe("unicode and special characters", () => {
    it("replaces unicode characters", () => {
      expect(toSafeIdentifier("café")).toBe("caf_");
      expect(toSafeIdentifier("日本語")).toBe("___");
    });

    it("handles mixed alphanumeric and unicode", () => {
      expect(toSafeIdentifier("hello世界")).toBe("hello__");
    });

    it("handles emojis", () => {
      expect(toSafeIdentifier("test🔥emoji")).toBe("test__emoji");
    });
  });

  describe("real-world examples", () => {
    it("handles file names", () => {
      expect(toSafeIdentifier("My File Name.txt")).toBe("my_file_name_txt");
      expect(toSafeIdentifier("document-2024.pdf")).toBe("document_2024_pdf");
    });

    it("handles database column names", () => {
      expect(toSafeIdentifier("User Name")).toBe("user_name");
      expect(toSafeIdentifier("created_at")).toBe("created_at");
    });

    it("handles identifiers with special prefixes", () => {
      expect(toSafeIdentifier("__private")).toBe("__private");
      expect(toSafeIdentifier("_internal")).toBe("_internal");
    });

    it("handles mixed case with special chars", () => {
      expect(toSafeIdentifier("firstName")).toBe("firstname");
      expect(toSafeIdentifier("user-email-address")).toBe("user_email_address");
    });
  });

  describe("examples from docstring", () => {
    it('converts " My File Name.txt " to "my_file_name_txt"', () => {
      expect(toSafeIdentifier(" My File Name.txt ")).toBe("my_file_name_txt");
    });

    it('converts "123abc" to "__123abc"', () => {
      expect(toSafeIdentifier("123abc")).toBe("__123abc");
    });
  });
});
