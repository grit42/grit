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

import {
  Button,
  Select,
  SortableMultiselect,
} from "@grit42/client-library/components";
import { CONTROL_LIMIT_LABELS, CONTROL_LIMITS, limitsOf } from "../limits";
import {
  OUTLIER_RULES,
  OUTLIER_RULE_LABELS,
  OUTLIER_SCOPE_LABELS,
  outlierRuleOf,
  outlierScopeOf,
  type OutlierRule,
  type OutlierScope,
} from "../outliers";
import type { ControlLimit, PlotDefinition } from "../types";
import { DataBandField } from "./RangeSettings";

/** Lines and a band from each panel's values, and the rule its outliers are ringed by. */
const LimitsSettings = ({
  plot,
  onChange,
  show,
  defaults,
}: {
  plot: PlotDefinition;
  onChange: (plot: PlotDefinition) => void;
  show: { limits: boolean; band: boolean; outliers: boolean; scope: boolean };
  /** The type's own, where it draws some until told otherwise. */
  defaults?: readonly ControlLimit[];
}) => (
  <>
    {show.limits && (
      <>
        <SortableMultiselect
          label="Limits drawn"
          options={CONTROL_LIMITS.map((limit) => ({
            label: CONTROL_LIMIT_LABELS[limit],
            value: limit,
          }))}
          value={limitsOf(plot, defaults)}
          placeholder="None"
          description="Lines from each panel's values."
          onChange={(limits: ControlLimit[]) =>
            onChange({ ...plot, limits: limits ?? [] })
          }
        />
        <Button
          size="tiny"
          variant="transparent"
          onClick={() => onChange({ ...plot, limits: [...CONTROL_LIMITS] })}
        >
          All limits
        </Button>
      </>
    )}
    {show.band && <DataBandField plot={plot} onChange={onChange} />}
    {show.outliers && (
      <Select
        label="Outliers"
        options={OUTLIER_RULES.map((rule) => ({
          label: OUTLIER_RULE_LABELS[rule],
          value: rule,
        }))}
        value={outlierRuleOf(plot)}
        isClearable={false}
        description="Ringed and counted; never removed."
        onChange={(outliers: OutlierRule) => onChange({ ...plot, outliers })}
      />
    )}
    {show.scope && (
      <Select
        label="Judged within"
        options={(["panel", "group"] as const).map((scope) => ({
          label: OUTLIER_SCOPE_LABELS[scope],
          value: scope,
        }))}
        value={outlierScopeOf(plot)}
        isClearable={false}
        description="A panel, as its limits and band; a group, as its box or error bars."
        onChange={(scope: OutlierScope) =>
          onChange({
            ...plot,
            outliersWithin: scope === "panel" ? undefined : scope,
          })
        }
      />
    )}
  </>
);

export default LimitsSettings;
