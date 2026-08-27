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
import NumberField from "./NumberField";
import { niceRange, supportsTickRange } from "../axes";
import type {
  AxisTickOptions,
  PlotDefinition,
  SourceData,
  TickMode,
} from "../types";

const TICK_MODES: { label: string; value: TickMode }[] = [
  { label: "Automatic", value: "auto" },
  { label: "Maximum ticks", value: "count" },
  { label: "Tick spacing", value: "spacing" },
  { label: "Fixed range", value: "range" },
];
const MAX_TICKS = 100;

const AxisTickSettings = <TPlot extends PlotDefinition>({
  plot,
  axis,
  onChange,
  data,
}: {
  plot: TPlot;
  axis: "x" | "y";
  onChange: (plot: TPlot) => void;
  data?: SourceData;
}) => {
  const orientation = plot[axis];
  const ticks: AxisTickOptions = orientation?.ticks ?? {};
  const mode = ticks.mode ?? "auto";
  const rangeSupported = supportsTickRange(orientation?.axisType);

  const span = (() => {
    const key = orientation?.key;
    if (!data?.length || !key) return undefined;
    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      const value = Number(row[key]);
      if (!Number.isFinite(value)) continue;
      if (value < min) min = value;
      if (value > max) max = value;
    }
    return Number.isFinite(min) && max > min ? max - min : undefined;
  })();

  const minSpacing = span ? span / MAX_TICKS : undefined;
  const tooFine =
    minSpacing !== undefined &&
    ticks.mode === "spacing" &&
    ticks.spacing !== undefined &&
    ticks.spacing > 0 &&
    ticks.spacing < minSpacing;

  const setTicks = (next: AxisTickOptions) =>
    onChange({
      ...plot,
      [axis]: { ...orientation, ticks: next },
    });

  const label = axis.toUpperCase();
  const preview =
    mode === "range" && ticks.min !== undefined && ticks.max !== undefined
      ? niceRange(ticks.min, ticks.max)
      : undefined;

  return (
    <>
      <Select
        label={`${label} axis ticks`}
        options={TICK_MODES}
        value={mode}
        isClearable={false}
        onChange={(value: TickMode) => setTicks({ ...ticks, mode: value })}
      />

      {mode === "count" && (
        <NumberField
          label={`${label} maximum ticks`}
          value={ticks.count}
          placeholder="Automatic"
          description="Ticks land on round values with an upper bound - the drawn count is usually lower."
          onCommit={(count) => setTicks({ ...ticks, count })}
        />
      )}

      {mode === "spacing" && (
        <NumberField
          label={`${label} tick spacing`}
          value={ticks.spacing}
          placeholder="Automatic"
          description={
            orientation?.axisType === "log"
              ? "One tick every this many decades. Left automatic, the axis is labelled decade by decade."
              : "One tick every this many units."
          }
          onCommit={(spacing) =>
            setTicks({
              ...ticks,
              spacing:
                minSpacing !== undefined &&
                spacing !== undefined &&
                spacing > 0 &&
                spacing < minSpacing
                  ? Number(minSpacing.toPrecision(2))
                  : spacing,
            })
          }
        />
      )}
      {tooFine && (
        <span role="status">
          Raised to about {Number(minSpacing!.toPrecision(2))}: any finer asks
          for more than {MAX_TICKS} ticks.
        </span>
      )}

      {mode === "range" && !rangeSupported && (
        <span>
          A fixed range does not apply to a {orientation?.axisType} axis.
        </span>
      )}

      {mode === "range" && rangeSupported && (
        <>
          <NumberField
            label={`${label} minimum`}
            value={ticks.min}
            onCommit={(min) => setTicks({ ...ticks, min })}
          />
          <NumberField
            label={`${label} maximum`}
            value={ticks.max}
            onCommit={(max) => setTicks({ ...ticks, max })}
          />
          {preview && (
            <span>
              Drawn as {preview.range[0]} to {preview.range[1]}, every{" "}
              {preview.step}
            </span>
          )}
        </>
      )}

      <ToggleSwitch
        label={`${label} minor ticks`}
        value={ticks.minor ?? false}
        onChange={(e) => setTicks({ ...ticks, minor: e.target.checked })}
      />
    </>
  );
};

export default AxisTickSettings;
