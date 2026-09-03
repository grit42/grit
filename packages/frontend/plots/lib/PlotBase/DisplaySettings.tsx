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

import { Select, ToggleSwitch } from "@grit42/client-library/components";
import { resolveDisplay } from "../displayMode";
import type {
  ErrorBarMode,
  ErrorBarStyle,
  PlotDefinition,
  PlotDisplayOptions,
  SourceDataProperties,
  StatMarker,
} from "../types";
import { usePropertiesOptions } from "../utils";

const SUMMARY_OPTIONS: { label: string; value: StatMarker }[] = [
  { label: "Mean", value: "mean" },
  { label: "Median", value: "median" },
];

const ERROR_OPTIONS: { label: string; value: ErrorBarMode }[] = [
  { label: "Standard deviation", value: "sd" },
  { label: "Standard error", value: "sem" },
  { label: "None", value: "none" },
];

const ERROR_STYLE_OPTIONS: { label: string; value: ErrorBarStyle }[] = [
  { label: "Error bars", value: "bars" },
  { label: "Shaded band", value: "band" },
];

const DisplaySettings = <TPlot extends PlotDefinition>({
  plot,
  onChange,
  properties,
  show = {},
}: {
  plot: TPlot;
  properties: SourceDataProperties;
  onChange: (plot: TPlot) => void;
  /**
   * Which controls this plot type has a use for. A box plot draws its own
   * summary and dispersion, so it offers only the raw-values toggle.
   */
  show?: {
    summary?: boolean;
    multipleSummaries?: boolean;
    errorBars?: boolean;
    errorBand?: boolean;
    individual?: boolean;
    individualBy?: boolean;
  };
}) => {
  const {
    summary = true,
    multipleSummaries = true,
    errorBars = true,
    errorBand = true,
    individual = true,
    individualBy = true,
  } = show;
  const display = resolveDisplay(plot.display);
  const identityOptions = usePropertiesOptions(properties);

  const set = (next: Partial<PlotDisplayOptions>) =>
    onChange({ ...plot, display: { ...plot.display, ...next } });

  return (
    <>
      {summary &&
        (multipleSummaries ? (
          <Select
            label="Summary"
            options={SUMMARY_OPTIONS}
            value={display.statMarkers}
            multiple
            description="Clearing this and the individual observations draws nothing."
            onChange={(statMarkers: StatMarker[]) => set({ statMarkers })}
          />
        ) : (
          <Select
            label="Summary"
            options={SUMMARY_OPTIONS}
            value={display.statMarkers[0]}
            isClearable={false}
            description="This plot draws one summary per group."
            onChange={(marker: StatMarker) =>
              set({ statMarkers: marker ? [marker] : [] })
            }
          />
        ))}
      {errorBars && (
        <Select
          label="Error bars"
          options={ERROR_OPTIONS}
          value={display.errorBars}
          isClearable={false}
          onChange={(mode: ErrorBarMode) => set({ errorBars: mode })}
        />
      )}
      {errorBars && display.errorBars !== "none" && errorBand && (
        <Select
          label="Error style"
          options={ERROR_STYLE_OPTIONS}
          value={display.errorStyle}
          isClearable={false}
          onChange={(errorStyle: ErrorBarStyle) => set({ errorStyle })}
        />
      )}
      {individual && (
        <ToggleSwitch
          label="Individual observations"
          description="Draws the raw values behind the summary"
          value={display.showIndividual}
          onChange={(e) => set({ showIndividual: e.target.checked })}
        />
      )}
      {individual && individualBy && display.showIndividual && (
        <Select
          label="One line per"
          options={identityOptions}
          value={display.individualBy}
          placeholder="Unconnected points"
          description="A subject or replicate column, to join its observations into a line."
          onChange={(individualBy: string | undefined) => set({ individualBy })}
        />
      )}
    </>
  );
};

export default DisplaySettings;
