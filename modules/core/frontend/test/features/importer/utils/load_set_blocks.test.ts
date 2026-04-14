/**
 * Copyright 2025 grit42 A/S <https://grit42.com/>
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

import { describe, it, expect, vi } from "vitest";
import {
  genericGuessLoadSetBlockValues,
  blockFromFile,
} from "../../../../lib/features/importer/utils/load_set_blocks";

function makeFile(content: string, name: string, type = "text/plain"): File {
  return new File([content], name, { type });
}

// --- genericGuessLoadSetBlockValues ---

describe("genericGuessLoadSetBlockValues", () => {
  it("returns the guessed separator for a comma-delimited file", async () => {
    const file = makeFile("name,age\nAlice,30\n", "data.csv");
    const result = await genericGuessLoadSetBlockValues(file);
    expect(result).toEqual({ separator: "," });
  });

  it("returns the guessed separator for a tab-delimited file", async () => {
    // Use enough columns so papaparse confidently picks tab over comma
    const file = makeFile(
      "name\tage\tcity\tcountry\nAlice\t30\tNYC\tUS\nBob\t25\tLA\tUS\n",
      "data.tsv",
    );
    const result = await genericGuessLoadSetBlockValues(file);
    expect(result).toEqual({ separator: "\t" });
  });
});

// --- blockFromFile ---

describe("blockFromFile", () => {
  it("returns a PendingLoadSetBlock with format 'dsv' and guessed values merged in", async () => {
    const file = makeFile("name,age\nAlice,30\n", "compounds.csv");

    const result = await blockFromFile(
      {},
      genericGuessLoadSetBlockValues,
      file,
    );

    expect(result.format).toBe("dsv");
    expect(result.separator).toBe(",");
    expect(result.file).toBe(file);
  });

  it("derives name from the filename, stripping extension", async () => {
    const file = makeFile("a,b\n1,2\n", "my_compounds.csv");

    const result = await blockFromFile(
      {},
      genericGuessLoadSetBlockValues,
      file,
    );

    expect(result.name).toBe("my_compounds");
  });

  it("strips path prefix from name when filename contains a path", async () => {
    const file = makeFile("a,b\n1,2\n", "path/to/upload.csv");

    const result = await blockFromFile(
      {},
      genericGuessLoadSetBlockValues,
      file,
    );

    expect(result.name).toBe("upload");
  });

  it("trims whitespace from the derived name", async () => {
    const file = makeFile("a,b\n", "  spaced  .csv");

    const result = await blockFromFile(
      {},
      genericGuessLoadSetBlockValues,
      file,
    );

    expect(result.name).toBe("spaced");
  });

  it("merges preset values into the block", async () => {
    const file = makeFile("a,b\n", "data.csv");
    const presets = { entity: "Grit::TestEntity", origin_id: 5 };

    const result = await blockFromFile(
      presets,
      genericGuessLoadSetBlockValues,
      file,
    );

    expect(result.entity).toBe("Grit::TestEntity");
    expect(result.origin_id).toBe(5);
  });

  it("guessed values override presets of the same key", async () => {
    const file = makeFile("a\tb\n", "data.tsv");
    const presets = { separator: "," };

    const result = await blockFromFile(
      presets,
      genericGuessLoadSetBlockValues,
      file,
    );

    expect(result.separator).toBe("\t");
  });

  it("generates a unique id string for each block", async () => {
    const file = makeFile("a,b\n", "data.csv");

    const block1 = await blockFromFile(
      {},
      genericGuessLoadSetBlockValues,
      file,
    );
    const block2 = await blockFromFile(
      {},
      genericGuessLoadSetBlockValues,
      file,
    );

    expect(typeof block1.id).toBe("string");
    expect(block1.id).not.toBe(block2.id);
  });

  it("calls guessFunc with the file", async () => {
    const file = makeFile("a,b\n", "data.csv");
    const guessFunc = vi.fn().mockResolvedValue({ separator: "," });

    await blockFromFile({}, guessFunc, file);

    expect(guessFunc).toHaveBeenCalledWith(file);
  });
});
