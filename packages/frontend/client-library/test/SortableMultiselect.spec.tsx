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

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SortableMultiselect, {
  SEARCH_FROM,
} from "../lib/components/SortableMultiselect";

const option = (label: string, description?: string) => ({
  value: label,
  label,
  description,
});

const MANY = [
  option("Alanine Aminotransferase", "SERUM"),
  option("Aspartate Aminotransferase", "SERUM"),
  option("Albumin", "SERUM"),
  ...Array.from({ length: SEARCH_FROM }, (_, i) => option(`Test ${i}`)),
];

const open = (options = MANY, onChange = vi.fn()) => {
  render(
    <SortableMultiselect
      options={options}
      value={[]}
      buttonLabel="Choose"
      onChange={onChange}
    />,
  );
  fireEvent.click(screen.getByText("Choose"));
  return onChange;
};

const rows = () =>
  [...document.querySelectorAll("tr")].map((row) => row.textContent);

const search = (text: string) =>
  fireEvent.change(screen.getByLabelText("Search the options"), {
    target: { value: text },
  });

afterEach(cleanup);

describe("SortableMultiselect's search", () => {
  it("narrows the options to those whose label or description holds the text, any case", () => {
    open();
    expect(rows()).toHaveLength(MANY.length);
    search("aminotrans");
    expect(rows()).toEqual([
      "Alanine AminotransferaseSERUM",
      "Aspartate AminotransferaseSERUM",
    ]);
    search("serum");
    expect(rows()).toHaveLength(3);
    search("nothing like it");
    expect(rows()).toEqual(["No match"]);
  });

  it("keeps an option ticked while a search hides it", () => {
    const onChange = open();
    fireEvent.click(screen.getByText("Albumin"));
    search("alanine");
    fireEvent.click(screen.getByText("Alanine Aminotransferase"));
    fireEvent.click(screen.getByText("Done"));
    expect(onChange).toHaveBeenCalledWith(
      ["Alanine Aminotransferase", "Albumin"],
      expect.anything(),
    );
  });

  it("is offered only past a handful of options, unless asked", () => {
    open(MANY.slice(0, SEARCH_FROM));
    expect(screen.queryByLabelText("Search the options")).toBeNull();
  });
});
