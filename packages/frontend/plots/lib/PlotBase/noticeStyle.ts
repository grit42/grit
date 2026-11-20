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

import { useMemo, type CSSProperties } from "react";
import { useTheme } from "@grit42/client-library/hooks";
import { noticeColors } from "../colors";

/** The level colours as `--notice-<level>`, for the notices stylesheet. */
export const useNoticeStyle = (): CSSProperties => {
  const { palette } = useTheme();
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(noticeColors(palette)).map(([level, color]) => [
          `--notice-${level}`,
          color,
        ]),
      ) as CSSProperties,
    [palette],
  );
};
