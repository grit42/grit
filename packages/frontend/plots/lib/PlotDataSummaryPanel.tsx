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

import { useState } from "react";
import { Button } from "@grit42/client-library/components";
import type { PlotDataSummary } from "./exclusions";

export interface PlotDataSummaryPanelProps {
  summary: PlotDataSummary;
  recordLabel?: string;
  groupLabel?: string;
  categoryLabels?: Record<string, string>;
}

/**
 * The excluded count is `total - included` rather than `excluded.length`,
 * because a single record can accumulate several reasons.
 */
const PlotDataSummaryPanel = ({
  summary,
  recordLabel = "records",
  groupLabel = "Groups affected",
  categoryLabels = {},
}: PlotDataSummaryPanelProps) => {
  const [expanded, setExpanded] = useState(false);

  const hasExclusions = summary.exclusionSummary.length > 0;
  const excludedCount = summary.total - summary.included;

  const breakdown = Object.entries(summary.includedByCategory)
    .map(([key, count]) => `${count} ${categoryLabels[key] ?? key}`)
    .join(", ");

  return (
    <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>
          <strong>{summary.included}</strong> of{" "}
          <strong>{summary.total}</strong> {recordLabel}
          {breakdown && <> ({breakdown})</>}
        </span>
        {hasExclusions && (
          <Button size="tiny" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide" : "Why"} {excludedCount} excluded?
          </Button>
        )}
      </div>

      {expanded && (
        <table
          style={{
            marginTop: "0.5rem",
            borderCollapse: "collapse",
            width: "100%",
            fontSize: "0.8rem",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>Reason</th>
              <th style={{ textAlign: "right", padding: "4px 8px" }}>Count</th>
              <th style={{ textAlign: "left", padding: "4px 8px" }}>
                {groupLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {summary.exclusionSummary.map((item) => (
              <tr key={item.reason}>
                <td style={{ padding: "4px 8px" }}>{item.reason}</td>
                <td style={{ textAlign: "right", padding: "4px 8px" }}>
                  {item.count}
                </td>
                <td style={{ padding: "4px 8px" }}>{item.groups.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PlotDataSummaryPanel;
