/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/plots.
 *
 * @grit42/plots is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/plots is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/plots. If not, see <https://www.gnu.org/licenses/>.
 */

import { hexToRgb } from "./colors";

export type Deficiency = "deuteranopia" | "protanopia" | "tritanopia";
export type Vision = "normal" | Deficiency;
export type Lab = readonly [number, number, number];

export const VISIONS: readonly Vision[] = [
  "normal",
  "deuteranopia",
  "protanopia",
  "tritanopia",
];

/** Machado, Oliveira & Fernandes (2009), severity 1, on linear RGB. */
const SIMULATION: Record<Deficiency, readonly (readonly number[])[]> = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

const toLinear = (value: number) =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const toGamma = (value: number) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

const linearChannels = (color: string): [number, number, number] => {
  const { r, g, b } = hexToRgb({ color });
  return [toLinear(r / 255), toLinear(g / 255), toLinear(b / 255)];
};

const toHex = (channels: number[]) =>
  `#${channels
    .map((value) =>
      Math.round(clamp(value) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;

/** `color` as a reader with the deficiency sees it. */
export const simulateDeficiency = (
  color: string,
  deficiency: Deficiency,
): string => {
  const linear = linearChannels(color);
  return toHex(
    SIMULATION[deficiency].map((row) =>
      toGamma(
        clamp(row[0]! * linear[0] + row[1]! * linear[1] + row[2]! * linear[2]),
      ),
    ),
  );
};

/** CIELAB under D65. */
export const toLab = (color: string): Lab => {
  const [r, g, b] = linearChannels(color);
  const f = (t: number) =>
    t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047);
  const y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b);
  const z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};

/** CIELAB L*, 0 (black) to 100 (white). */
export const lightness = (color: string): number => toLab(color)[0];

const RADIANS = Math.PI / 180;
const cos = (degrees: number) => Math.cos(degrees * RADIANS);
const hueAngle = (b: number, a: number) =>
  b === 0 && a === 0 ? 0 : (Math.atan2(b, a) / RADIANS + 360) % 360;

/** CIEDE2000 after Sharma, Wu & Dalal (2005); about 1 is just noticeable. */
export const deltaE2000 = (
  first: string | Lab,
  second: string | Lab,
): number => {
  const [L1, a1, b1] = typeof first === "string" ? toLab(first) : first;
  const [L2, a2, b2] = typeof second === "string" ? toLab(second) : second;

  const meanChroma7 = ((Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2) ** 7;
  const g = 0.5 * (1 - Math.sqrt(meanChroma7 / (meanChroma7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const C1 = Math.hypot(a1p, b1);
  const C2 = Math.hypot(a2p, b2);
  const h1 = hueAngle(b1, a1p);
  const h2 = hueAngle(b2, a2p);
  const chromatic = C1 * C2 !== 0;

  let dh = chromatic ? h2 - h1 : 0;
  if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin((dh / 2) * RADIANS);

  const L = (L1 + L2) / 2;
  const C = (C1 + C2) / 2;
  const h = !chromatic
    ? h1 + h2
    : Math.abs(h1 - h2) <= 180
      ? (h1 + h2) / 2
      : h1 + h2 < 360
        ? (h1 + h2 + 360) / 2
        : (h1 + h2 - 360) / 2;

  const t =
    1 -
    0.17 * cos(h - 30) +
    0.24 * cos(2 * h) +
    0.32 * cos(3 * h + 6) -
    0.2 * cos(4 * h - 63);
  const C7 = C ** 7;
  const rotation =
    -Math.sin(2 * 30 * Math.exp(-(((h - 275) / 25) ** 2)) * RADIANS) *
    2 *
    Math.sqrt(C7 / (C7 + 25 ** 7));
  const sL = 1 + (0.015 * (L - 50) ** 2) / Math.sqrt(20 + (L - 50) ** 2);
  const sC = 1 + 0.045 * C;
  const sH = 1 + 0.015 * C * t;

  const dL = (L2 - L1) / sL;
  const dC = (C2 - C1) / sC;
  const dHs = dH / sH;
  return Math.sqrt(dL ** 2 + dC ** 2 + dHs ** 2 + rotation * dC * dHs);
};

/** The smallest CIEDE2000 between any two of `colors`, under every vision. */
export const leastDifference = (colors: readonly string[]): number => {
  let least = Infinity;
  for (const vision of VISIONS) {
    const seen = colors.map((color) =>
      vision === "normal" ? color : simulateDeficiency(color, vision),
    );
    for (let i = 0; i < seen.length; i++) {
      for (let j = i + 1; j < seen.length; j++) {
        least = Math.min(least, deltaE2000(seen[i]!, seen[j]!));
      }
    }
  }
  return least;
};
