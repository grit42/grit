import type {
  ErrorBarMode,
  ErrorBarStyle,
  PlotDisplayOptions,
  StatMarker,
} from "./types";

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
