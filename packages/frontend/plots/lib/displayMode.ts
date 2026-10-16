import type {
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
): ResolvedDisplay => ({
  showIndividual: display?.showIndividual ?? false,
  statMarkers: display?.statMarkers ?? ["mean"],
  individualBy: display?.individualBy,
  errorBars: display?.errorBars ?? "sd",
  errorStyle: display?.errorStyle ?? "bars",
});

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
