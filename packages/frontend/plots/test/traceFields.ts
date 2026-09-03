/**
 * Plotly's `Data` is a union over every trace type, so `Partial<Data>` exposes
 * none of the fields the builders actually set. Tests assert on traces through
 * this widened view rather than casting at each access.
 */
export interface TraceFields {
  type?: string;
  name?: unknown;
  mode?: string;
  x?: unknown[];
  y?: unknown[];
  fill?: string;
  fillcolor?: string;
  showlegend?: boolean;
  opacity?: number;
  legendgroup?: string;
  hoverinfo?: string;
  hovertemplate?: string;
  customdata?: unknown[];
  boxmean?: boolean | "sd";
  boxpoints?: string | false;
  jitter?: number;
  width?: number | number[];
  xaxis?: string;
  yaxis?: string;
  z?: unknown;
  marker?: { opacity?: number; size?: number; color?: unknown };
  line?: { color?: unknown; width?: number; dash?: string };
  error_y?: { array?: number[]; visible?: boolean };
}

/** Widen a single trace for assertion purposes. */
export const asTrace = (trace: unknown): TraceFields => trace as TraceFields;
