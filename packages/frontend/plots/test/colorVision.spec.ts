// colorVision.json comes from reference/colorVision.R: farver for CIELAB and
// CIEDE2000, colorspace for colour-vision deficiency. Change a colour there
// and rerun it, never edit the JSON by hand.
import { describe, expect, test } from "vitest";
import {
  deltaE2000,
  leastDifference,
  lightness,
  simulateDeficiency,
  toLab,
  type Deficiency,
  type Lab,
} from "../lib/colorVision";
import { hexToRgb } from "../lib/colors";
// Through Vite, not node:fs: newer TypeScript loads no Node types unless asked.
import referenceJson from "./reference/colorVision.json?raw";

interface Reference {
  colours: ({ hex: string; lab: Lab } & Record<Deficiency, string>)[];
  pairs: { a: string; b: string; deltaE2000: number }[];
  sharma: { a: Lab; b: Lab; deltaE2000: number }[];
}

const reference: Reference = JSON.parse(referenceJson);

const DEFICIENCIES: Deficiency[] = ["deuteranopia", "protanopia", "tritanopia"];

describe.each(reference.colours.map((c) => [c.hex, c] as const))(
  "%s",
  (hex, expected) => {
    // farver's white point sits 0.01 off the sRGB matrix's; a just-noticeable
    // step is about 1.
    test("CIELAB as farver", () => {
      toLab(hex).forEach((value, i) =>
        expect(value).toBeCloseTo(expected.lab[i]!, 1),
      );
    });

    // colorspace rounds to 8 bits as here; its decode differs below one step.
    test.each(DEFICIENCIES)(
      "%s as colorspace, within one step",
      (deficiency) => {
        const got = hexToRgb({ color: simulateDeficiency(hex, deficiency) });
        const want = hexToRgb({ color: expected[deficiency] });
        for (const channel of ["r", "g", "b"] as const) {
          expect(Math.abs(got[channel] - want[channel])).toBeLessThanOrEqual(1);
        }
      },
    );
  },
);

test.each(reference.pairs.map((p) => [p.a, p.b, p.deltaE2000] as const))(
  "CIEDE2000 %s against %s as farver",
  (a, b, expected) => {
    expect(deltaE2000(a, b)).toBeCloseTo(expected, 2);
  },
);

test.each(reference.sharma.map((p) => [p.deltaE2000, p] as const))(
  "CIEDE2000 %d on Sharma, Wu & Dalal's pair",
  (expected, pair) => {
    expect(deltaE2000(pair.a, pair.b)).toBeCloseTo(expected, 4);
  },
);

test("lightness runs from black to white", () => {
  expect(lightness("#000000")).toBeCloseTo(0, 6);
  expect(lightness("#ffffff")).toBeCloseTo(100, 4);
});

test("leastDifference finds red and green a deuteranope cannot tell apart", () => {
  expect(deltaE2000("#E60000", "#1A9A00")).toBeGreaterThan(70);
  expect(leastDifference(["#E60000", "#1A9A00"])).toBeLessThan(3);
  expect(leastDifference(["#E69F00", "#56B4E9"])).toBeGreaterThan(40);
});
