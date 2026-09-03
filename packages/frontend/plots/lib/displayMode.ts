import type {
  DisplayMode,
  ErrorBarMode,
  ErrorBarStyle,
  PlotDisplayOptions,
  StatMarker,
} from "./types";
import type { BoxStats } from "./math";

export interface ResolvedDisplay {
  showIndividual: boolean;
  individualBy?: string;
  statMarkers: StatMarker[];
  errorBars: ErrorBarMode;
  errorStyle: ErrorBarStyle;
}

export const resolveDisplay = (
  display?: PlotDisplayOptions,
): ResolvedDisplay => {
  const mode = display?.mode;

  return {
    showIndividual:
      display?.showIndividual ??
      (mode !== undefined ? shouldShowIndividual(mode) : false),
    statMarkers:
      display?.statMarkers ??
      (mode !== undefined ? (shouldShowMean(mode) ? ["mean"] : []) : ["mean"]),
    individualBy: display?.individualBy,
    errorBars: display?.errorBars ?? "sd",
    errorStyle: display?.errorStyle ?? "bars",
  };
};

export const shouldShowIndividual = (mode: DisplayMode): boolean =>
  mode === "individual" || mode === "both";

export const shouldShowMean = (mode: DisplayMode): boolean =>
  mode === "mean" || mode === "both";

export const errorValue = (
  mode: ErrorBarMode,
  stats: Pick<BoxStats, "std" | "sem">,
): number | undefined => {
  switch (mode) {
    case "sd":
      return stats.std;
    case "sem":
      return stats.sem;
    case "none":
      return undefined;
  }
};
