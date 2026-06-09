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
import { guessDelimiter } from "../../../../lib/features/importer/utils/csv";

function makeFile(content: string, name = "data.csv"): File {
  return new File([content], name, { type: "text/plain" });
}

describe("guessDelimiter", () => {
  it("detects comma as delimiter in a CSV file", async () => {
    const file = makeFile("name,age,city\nAlice,30,NYC\n");
    expect(await guessDelimiter(file)).toBe(",");
  });

  it("detects tab as delimiter in a TSV file", async () => {
    // Use enough columns so papaparse confidently picks tab over comma
    const file = makeFile(
      "name\tage\tcity\tcountry\nAlice\t30\tNYC\tUS\nBob\t25\tLA\tUS\n",
    );
    expect(await guessDelimiter(file)).toBe("\t");
  });

  it("detects semicolon as delimiter", async () => {
    const file = makeFile("name;age;city\nAlice;30;NYC\n");
    expect(await guessDelimiter(file)).toBe(";");
  });
});
