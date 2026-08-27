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
import styles from "./styleSettings.module.scss";
import { useColorMap, type ColorPreset } from "../colors";
import { AUTOMATIC_SIGNIFICANT_FIGURES } from "../format";
import type { PlotAppearanceOptions, PlotDefinition } from "../types";

const PALETTE_OPTIONS: { label: string; value: ColorPreset }[] = [
  { label: "Default", value: "default" },
  { label: "Muted", value: "muted" },
  { label: "Bright", value: "bright" },
];

const DECIMAL_OPTIONS: { label: string; value: number | "auto" }[] = [
  { label: "Automatic", value: "auto" },
  { label: "0 — whole numbers", value: 0 },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
];

const StyleSettings = <TPlot extends PlotDefinition>({
  plot,
  onChange,
  show = {},
}: {
  plot: TPlot;
  onChange: (plot: TPlot) => void;
  show?: {
    palette?: boolean;
    fontSize?: boolean;
    gridlines?: boolean;
    frame?: boolean;
    zeroLines?: boolean;
  };
}) => {
  const {
    palette: showPalette = true,
    fontSize: showFontSize = true,
    gridlines: showGridlines = true,
    frame: showFrame = true,
    zeroLines: showZeroLines = true,
  } = show;
  const colorMap = useColorMap(plot.palette);
  const appearance = plot.appearance ?? {};
  const setAppearance = (next: PlotAppearanceOptions) =>
    onChange({ ...plot, appearance: next });

  return (
    <>
      {showPalette && (
        <>
          <Select
            label="Palette"
            options={PALETTE_OPTIONS}
            value={plot.palette ?? "default"}
            isClearable={false}
            onChange={(palette: ColorPreset) => onChange({ ...plot, palette })}
          />
          <div className={styles.swatches} aria-hidden="true">
            {colorMap.universalColors.map((color) => (
              <span
                key={color}
                className={styles.swatch}
                style={{ background: color }}
              />
            ))}
          </div>
        </>
      )}
      {showFontSize && (
        <NumberField
          label="Font size"
          value={appearance.fontSize}
          placeholder="Default"
          description="Titles, labels, and ticks scale."
          onCommit={(fontSize) => setAppearance({ ...appearance, fontSize })}
        />
      )}
      <Select
        label="Decimals"
        options={DECIMAL_OPTIONS}
        value={appearance.decimals ?? "auto"}
        isClearable={false}
        description={`Applies to every number the figure writes. Automatic shows ${AUTOMATIC_SIGNIFICANT_FIGURES} significant figures.`}
        onChange={(value: number | "auto") =>
          setAppearance({
            ...appearance,
            decimals: value === "auto" ? undefined : value,
          })
        }
      />
      {showGridlines && (
        <ToggleSwitch
          label="Gridlines"
          value={appearance.grid ?? true}
          onChange={(e) =>
            setAppearance({ ...appearance, grid: e.target.checked })
          }
        />
      )}
      {showFrame && (
        <ToggleSwitch
          label="Frame"
          description="Border on all four sides of the plot"
          value={appearance.frame ?? false}
          onChange={(e) =>
            setAppearance({ ...appearance, frame: e.target.checked })
          }
        />
      )}
      {showZeroLines && (
        <ToggleSwitch
          label="Zero lines"
          description={
            appearance.frame
              ? "Off with a frame by default, to avoid a double border"
              : "Lines at x=0 and y=0"
          }
          value={appearance.zeroLines ?? !appearance.frame}
          onChange={(e) =>
            setAppearance({ ...appearance, zeroLines: e.target.checked })
          }
        />
      )}
    </>
  );
};

export default StyleSettings;
