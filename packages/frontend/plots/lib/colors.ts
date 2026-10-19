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

import { useMemo } from "react";
import { useTheme } from "@grit42/client-library/hooks";

export const hexToRgb = ({ hexStr }: { hexStr: string }) => {
  const h = hexStr.trim().replace(/^#/, "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
};

export const rgba = ({ hexStr, alpha }: { hexStr: string; alpha: number }) => {
  const { r, g, b } = hexToRgb({ hexStr });
  return `rgba(${r},${g},${b},${alpha})`;
};

export type ColorMap = ReturnType<typeof useColorMap>;

export const useColorMap = () => {
  const theme = useTheme();
  const darkTheme = theme.colorScheme === "dark";

  return useMemo(
    () => ({
      maleFill: rgba({ hexStr: "#E69F00", alpha: 0.42 }),
      maleLine: rgba({ hexStr: "#B87F00", alpha: 1.0 }),
      femaleFill: rgba({ hexStr: "#56B4E9", alpha: 0.42 }),
      femaleLine: rgba({ hexStr: "#3C7EA3", alpha: 1.0 }),
      boxFill: rgba({ hexStr: "#171e2a", alpha: 0.0 }),
      boxLine: darkTheme
        ? rgba({ hexStr: "#eeeeee", alpha: 1.0 })
        : rgba({ hexStr: "#333333", alpha: 1.0 }),
      boxMean: darkTheme
        ? rgba({ hexStr: "#eeeeee", alpha: 1.0 })
        : rgba({ hexStr: "#333333", alpha: 1.0 }),
      markerFill: darkTheme
        ? rgba({ hexStr: "#ffffff", alpha: 1.0 })
        : rgba({ hexStr: "#333333", alpha: 1.0 }),
      markerLine: rgba({ hexStr: "#000000", alpha: 1.0 }),
      hoverBackground: darkTheme
        ? rgba({ hexStr: "#171E2A", alpha: 1.0 })
        : rgba({ hexStr: "#ffffff", alpha: 1.0 }),
      hoverBorder: darkTheme
        ? rgba({ hexStr: "#F8EB5F", alpha: 1.0 })
        : rgba({ hexStr: "#009999", alpha: 1.0 }),
      hoverFontColor: darkTheme
        ? rgba({ hexStr: "#ffffff", alpha: 1.0 })
        : rgba({ hexStr: "#111111", alpha: 1.0 }),
      violationFill: rgba({ hexStr: "#E60000", alpha: 1.0 }),
      meanLine: rgba({ hexStr: "#1A9A00", alpha: 1.0 }),
      clLine: rgba({ hexStr: "#E60000", alpha: 1.0 }),
      wLine: rgba({ hexStr: "#E69F00", alpha: 0.8 }),
      oLine: rgba({ hexStr: "#F8EB5F", alpha: 0.8 }),
      missingColor: darkTheme
        ? rgba({ hexStr: "#171E2A", alpha: 1.0 })
        : rgba({ hexStr: "#ffffff", alpha: 1.0 }),
      heatmaplow: darkTheme
        ? rgba({ hexStr: "#2B2D6E", alpha: 1.0 })
        : rgba({ hexStr: "#DCE3F2", alpha: 1.0 }),
      heatmaphigh: darkTheme
        ? rgba({ hexStr: "#FDE725", alpha: 1.0 })
        : rgba({ hexStr: "#FFF4A3", alpha: 1.0 }),
      scatter1: rgba({ hexStr: "#4e79a7", alpha: 1.0 }),
      scatter2: rgba({ hexStr: "#f28e2b", alpha: 1.0 }),
      scatter3: rgba({ hexStr: "#e15759", alpha: 1.0 }),
      scatter4: rgba({ hexStr: "#59a14f", alpha: 1.0 }),
      scatter5: rgba({ hexStr: "#edc948", alpha: 1.0 }),
      scatter6: rgba({ hexStr: "#b07aa1", alpha: 1.0 }),
      scatter7: rgba({ hexStr: "#ff9da7", alpha: 1.0 }),
      scatter8: rgba({ hexStr: "#9c755f", alpha: 1.0 }),
      scatter9: rgba({ hexStr: "#bab0ac", alpha: 1.0 }),
      scatter10: rgba({ hexStr: "#86bcb6", alpha: 1.0 }),
      scatter11: rgba({ hexStr: "#8cd17d", alpha: 1.0 }),
      scatter12: rgba({ hexStr: "#b6992d", alpha: 1.0 }),
      scatter13: rgba({ hexStr: "#499894", alpha: 1.0 }),
      scatter14: rgba({ hexStr: "#d37295", alpha: 1.0 }),
      scatter15: rgba({ hexStr: "#a0cbe8", alpha: 1.0 }),
      scatter16: rgba({ hexStr: "#ffbe7d", alpha: 1.0 }),
      scatter17: rgba({ hexStr: "#ff9d9a", alpha: 1.0 }),
      universalColors: [
        "#4e79a7",
        "#f28e2b",
        "#e15759",
        "#76b7b2",
        "#59a14f",
        "#edc948",
        "#b07aa1",
        "#ff9da7",
        "#9c755f",
        "#bab0ac",
        "#86bcb6",
        "#8cd17d",
        "#b6992d",
        "#499894",
        "#d37295",
        "#a0cbe8",
        "#ffbe7d",
        "#ff9d9a",
      ],
    }),
    [darkTheme],
  );
};
