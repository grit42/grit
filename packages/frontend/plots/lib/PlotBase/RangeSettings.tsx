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

import { Button, Select } from "@grit42/client-library/components";
import { DATA_RANGE_ID, DATA_RANGE_SDS, rangeText, dataRange } from "../ranges";
import type { PlotDefinition } from "../types";
// Read as the notes do, beside them.
import styles from "./annotationLayer.module.scss";

const NO_DATA_RANGE = "none";

/** A band at each panel's mean ± k SD, kept among the figure's ranges. */
export const DataBandField = ({
  plot,
  onChange,
}: {
  plot: PlotDefinition;
  onChange: (plot: PlotDefinition) => void;
}) => {
  const ranges = plot.ranges ?? [];
  const others = ranges.filter((range) => range.id !== DATA_RANGE_ID);
  const fromData = ranges.find((range) => range.id === DATA_RANGE_ID)?.sd;
  return (
    <Select
      label="Band from the data"
      options={[
        { label: "None", value: NO_DATA_RANGE },
        ...DATA_RANGE_SDS.map((sd) => ({
          label: `Mean ±${sd} SD`,
          value: String(sd),
        })),
      ]}
      value={fromData === undefined ? NO_DATA_RANGE : String(fromData)}
      isClearable={false}
      description="Each panel's own mean ± SD."
      onChange={(value: string) =>
        onChange({
          ...plot,
          ranges:
            value === NO_DATA_RANGE
              ? others
              : [...others, dataRange(Number(value))],
        })
      }
    />
  );
};

/** The figure's ranges, each removable, and the band from the data unless set elsewhere. */
const RangeSettings = ({
  plot,
  onChange,
  band = true,
}: {
  plot: PlotDefinition;
  onChange: (plot: PlotDefinition) => void;
  band?: boolean;
}) => {
  const ranges = plot.ranges ?? [];

  return (
    <>
      {ranges.length ? (
        <ul className={styles.list}>
          {ranges.map((range) => (
            <li key={range.id}>
              <div className={styles.entry}>
                <span className={styles.text}>{range.label}</span>
                <span className={styles.meta}>{rangeText(range)}</span>
              </div>
              <Button
                size="tiny"
                variant="transparent"
                aria-label={`Remove range: ${range.label}`}
                onClick={() =>
                  onChange({
                    ...plot,
                    ranges: ranges.filter((one) => one.id !== range.id),
                  })
                }
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <span className={styles.none}>No ranges drawn.</span>
      )}
      {band && <DataBandField plot={plot} onChange={onChange} />}
    </>
  );
};

export default RangeSettings;
