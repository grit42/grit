export const SYMBOLS = [
  "circle",
  "square",
  "diamond",
  "triangle-up",
  "triangle-down",
  "pentagon",
  "hexagon",
  "star",
  "cross",
  "x",
  "triangle-left",
  "triangle-right",
  "star-triangle-up",
  "star-square",
  "diamond-wide",
  "hourglass",
  "bowtie",
  "star-diamond",
];

/**
 * Marker shapes and line styles, cycled by series alongside the colour.
 *
 * Ordered so that adjacent series differ as much as possible rather than
 * cycling through near-identical shapes.
 */
export const SERIES_SYMBOLS = [
  "circle",
  "square",
  "diamond",
  "triangle-up",
  "cross",
  "x",
  "triangle-down",
  "star",
] as const;

export const SERIES_DASHES = [
  "solid",
  "dash",
  "dot",
  "dashdot",
  "longdash",
  "longdashdot",
] as const;

export const seriesSymbol = (index: number) =>
  SERIES_SYMBOLS[index % SERIES_SYMBOLS.length]!;

export const seriesDash = (index: number) =>
  SERIES_DASHES[index % SERIES_DASHES.length]!;

export const SERIES_PATTERNS = [
  "",
  "/",
  "\\\\",
  "x",
  "-",
  "|",
  "+",
  ".",
] as const;

export const seriesPattern = (index: number) =>
  SERIES_PATTERNS[index % SERIES_PATTERNS.length]!;
