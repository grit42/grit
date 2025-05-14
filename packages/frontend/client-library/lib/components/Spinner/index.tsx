/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/client-library.
 *
 * @grit42/client-library is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/client-library is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/client-library. If not, see <https://www.gnu.org/licenses/>.
 */

import classnames from "../../utils/classnames";
import styles from "./spinner.module.scss";
import { useCallback, useMemo } from "react";

enum SpinnerSize {
  SMALL = 20,
  STANDARD = 50,
  LARGE = 100,
}

const clamp = (val: number, min: number, max: number) => {
  if (val == null) {
    return val;
  }
  if (max < min) {
    throw new Error("clamp: max cannot be less than min");
  }
  return Math.min(Math.max(val, min), max);
};

// see http://stackoverflow.com/a/18473154/3124288 for calculating arc path
const R = 45;
const SPINNER_TRACK = `M 50,50 m 0,-${R} a ${R},${R} 0 1 1 0,${
  R * 2
} a ${R},${R} 0 1 1 0,-${R * 2}`;

// unitless total length of SVG path, to which stroke-dash* properties are relative.
// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/pathLength
// this value is the result of `<path d={SPINNER_TRACK} />.getTotalLength()` and works in all browsers:
const PATH_LENGTH = 280;

const MIN_SIZE = 10;
const STROKE_WIDTH = 6;
const MIN_STROKE_WIDTH = 16;

const Spinner = ({
  size = 75,
  className,
  color = "primary",
  value,
}: {
  size?: number;
  className?: string;
  color?: "primary" | "secondary" | string;
  /**
   * A value between 0 and 1 (inclusive) representing how far along the operation is.
   * Values below 0 or above 1 will be interpreted as 0 or 1 respectively.
   * Omitting this prop will result in an "indeterminate" spinner where the head spins indefinitely.
   */
  value?: number;
}) => {
  // keep spinner track width consistent at all sizes (down to about 10px).
  const strokeWidth = Math.min(
    MIN_STROKE_WIDTH,
    (STROKE_WIDTH * SpinnerSize.LARGE) / size,
  );
  const strokeOffset =
    PATH_LENGTH - PATH_LENGTH * (value == null ? 0.25 : clamp(value, 0, 1));

  const calculatedSize = useMemo(() => {
    return Math.max(MIN_SIZE, size);
  }, [size]);

  const getViewBox = useCallback((strokeWidth: number) => {
    const radius = R + strokeWidth / 2;
    const viewBoxX = (50 - radius).toFixed(2);
    const viewBoxWidth = (radius * 2).toFixed(2);
    return `${viewBoxX} ${viewBoxX} ${viewBoxWidth} ${viewBoxWidth}`;
  }, []);

  return (
    <div className={classnames(styles.spinner)}>
      <div
        className={classnames(styles.animation, {
          [styles.noSpin as string]: value !== undefined,
        })}
      >
        <svg
          width={calculatedSize}
          height={calculatedSize}
          strokeWidth={strokeWidth.toFixed(2)}
          viewBox={getViewBox(strokeWidth)}
          className={classnames(
            {
              [styles.primary as string]: color === "primary",
              [styles.secondary as string]: color === "secondary",
              [styles.color as string]:
                color !== undefined &&
                color !== "primary" &&
                color !== "secondary",
            },
            className,
          )}
          color={color}
        >
          <path className={styles.spinnerTrack} d={SPINNER_TRACK} />
          <path
            className={styles.spinnerHead}
            d={SPINNER_TRACK}
            pathLength={PATH_LENGTH}
            strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
            strokeDashoffset={strokeOffset}
          />
        </svg>
      </div>
    </div>
  );
};

export default Spinner;
