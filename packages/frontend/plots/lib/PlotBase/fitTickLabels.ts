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

// Plotly angles each panel's labels alone, so they run into the next one.
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PanelAxis {
  /** Degrees, Plotly's own choice when `auto`. */
  angle: number;
  /** Set by the figure: kept, unless another panel turns further. */
  explicit: boolean;
  labels: Box[];
  /** Room per tick label along the axis, in px. */
  slot: number;
}

export interface Panel {
  row: number;
  column: number;
  /** In px, from the figure's top left. */
  box: Box;
  x: PanelAxis;
  y: PanelAxis;
}

/** Plotly's first turn past flat, when it finds labels overlapping. */
const TURNED = 30;
const PAD = 6;
/** A panel keeps at least as much room as the gap beside it. */
const MAX_GAP = 0.5;

const steepest = (angles: number[]) =>
  angles.reduce(
    (most, angle) => (Math.abs(angle) > Math.abs(most) ? angle : most),
    0,
  );

/** One angle for all panels: the steepest, turned where a label overflows. */
export const sharedTickAngles = (
  panels: readonly Panel[],
): { x?: number; y?: number } => {
  const fit = (axes: PanelAxis[], along: "x" | "y") => {
    if (axes.length < 2) return undefined;
    const overflows =
      along === "x" &&
      axes.some(
        (axis) =>
          !axis.explicit &&
          axis.angle === 0 &&
          axis.labels.some((label) => label.right - label.left > axis.slot),
      );
    const angle = steepest([
      ...axes.map((axis) => axis.angle),
      ...(overflows ? [TURNED] : []),
    ]);
    return axes.every((axis) => axis.angle === angle) ? undefined : angle;
  };
  return {
    x: fit(
      panels.map((panel) => panel.x),
      "x",
    ),
    y: fit(
      panels.map((panel) => panel.y),
      "y",
    ),
  };
};

/** A px gap as Plotly's grid fraction, keeping the grid's span. */
const gapFraction = ({
  cells,
  cell,
  gap,
  extra,
}: {
  cells: number;
  cell: number;
  gap: number;
  extra: number;
}) => {
  const span = cells * cell + (cells - 1) * gap;
  const room = gap + extra;
  if (room <= gap) return undefined;
  const cellAfter = (span - (cells - 1) * room) / cells;
  return cellAfter > 0 ? Math.min(room / (cellAfter + room), MAX_GAP) : MAX_GAP;
};

const extremes = (boxes: Box[]) =>
  boxes.reduce(
    (most, box) => ({
      left: Math.min(most.left, box.left),
      right: Math.max(most.right, box.right),
      top: Math.min(most.top, box.top),
      bottom: Math.max(most.bottom, box.bottom),
    }),
    {
      left: Infinity,
      right: -Infinity,
      top: Infinity,
      bottom: -Infinity,
    },
  );

export const tickLabelGaps = (
  panels: readonly Panel[],
  titles: readonly Box[] = [],
): { xgap?: number; ygap?: number } => {
  const rows = Math.max(...panels.map((panel) => panel.row)) + 1;
  const columns = Math.max(...panels.map((panel) => panel.column)) + 1;
  const inRow = (row: number) => panels.filter((panel) => panel.row === row);
  const inColumn = (column: number) =>
    panels.filter((panel) => panel.column === column);

  let ygap: number | undefined;
  if (rows > 1) {
    let extra = 0;
    for (let row = 0; row < rows - 1; row += 1) {
      const above = extremes(inRow(row).map((panel) => panel.box));
      const below = extremes(inRow(row + 1).map((panel) => panel.box));
      const labels = extremes(inRow(row).flatMap((panel) => panel.x.labels));
      if (!Number.isFinite(labels.bottom)) continue;
      const between = titles.filter(
        (title) => title.top >= above.bottom && title.bottom <= below.top + 1,
      );
      const top = Math.min(below.top, ...between.map((title) => title.top));
      extra = Math.max(extra, labels.bottom + PAD - top);
    }
    const [first, next] = [inRow(0)[0], inRow(1)[0]];
    if (extra > 0 && first && next) {
      ygap = gapFraction({
        cells: rows,
        cell: first.box.bottom - first.box.top,
        gap: next.box.top - first.box.bottom,
        extra,
      });
    }
  }

  let xgap: number | undefined;
  if (columns > 1) {
    let extra = 0;
    for (let column = 1; column < columns; column += 1) {
      const left = extremes(inColumn(column - 1).map((panel) => panel.box));
      const labels = extremes(
        inColumn(column).flatMap((panel) => panel.y.labels),
      );
      if (!Number.isFinite(labels.left)) continue;
      extra = Math.max(extra, left.right + PAD - labels.left);
    }
    const [first, next] = [inColumn(0)[0], inColumn(1)[0]];
    if (extra > 0 && first && next) {
      xgap = gapFraction({
        cells: columns,
        cell: first.box.right - first.box.left,
        gap: next.box.left - first.box.right,
        extra,
      });
    }
  }

  return {
    ...(ygap === undefined ? {} : { ygap }),
    ...(xgap === undefined ? {} : { xgap }),
  };
};

interface DrawnAxis {
  _id: string;
  _offset: number;
  _length: number;
  _tickAngles?: Record<string, number>;
  tickangle?: number | "auto";
}

interface DrawnLayout {
  grid?: { pattern?: string; subplots?: string[][] };
  _plots?: Record<string, { xaxis: DrawnAxis; yaxis: DrawnAxis }>;
}

const boxesOf = (gd: HTMLElement, selector: string): Box[] => {
  const origin = gd.getBoundingClientRect();
  return [...gd.querySelectorAll(selector)].map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left - origin.left,
      right: rect.right - origin.left,
      top: rect.top - origin.top,
      bottom: rect.bottom - origin.top,
    };
  });
};

const axisOf = (gd: HTMLElement, axis: DrawnAxis): PanelAxis => {
  const labels = boxesOf(gd, `g.${axis._id}tick > text`);
  const auto = axis._tickAngles?.[`${axis._id}tick`];
  const explicit = typeof axis.tickangle === "number";
  return {
    angle: explicit ? (axis.tickangle as number) : (auto ?? 0),
    explicit,
    labels,
    slot: axis._length / Math.max(labels.length, 1),
  };
};

const measure = (gd: HTMLElement) => {
  const layout = (gd as unknown as { _fullLayout?: DrawnLayout })._fullLayout;
  const grid = layout?.grid;
  const plots = layout?._plots;
  if (grid?.pattern !== "independent" || !grid.subplots || !plots) return null;

  const panels: (Panel & { xName: string; yName: string })[] = [];
  grid.subplots.forEach((cells, row) =>
    cells.forEach((id, column) => {
      const plot = id ? plots[id] : undefined;
      if (!plot) return;
      const { xaxis, yaxis } = plot;
      panels.push({
        row,
        column,
        box: {
          left: xaxis._offset,
          right: xaxis._offset + xaxis._length,
          top: yaxis._offset,
          bottom: yaxis._offset + yaxis._length,
        },
        x: axisOf(gd, xaxis),
        y: axisOf(gd, yaxis),
        xName: `xaxis${xaxis._id.slice(1)}`,
        yName: `yaxis${yaxis._id.slice(1)}`,
      });
    }),
  );
  return panels.length > 1 ? panels : null;
};

type Relayout = (gd: HTMLElement, update: Record<string, number>) => unknown;

/** Run after every draw; changes the drawn layout only, never the figure's. */
export const fitTickLabels = async (
  gd: HTMLElement,
  relayout: Relayout,
): Promise<void> => {
  const panels = measure(gd);
  if (!panels) return;

  const angles = sharedTickAngles(panels);
  const turned: Record<string, number> = {};
  for (const panel of panels) {
    if (angles.x !== undefined) turned[`${panel.xName}.tickangle`] = angles.x;
    if (angles.y !== undefined) turned[`${panel.yName}.tickangle`] = angles.y;
  }
  if (Object.keys(turned).length) await relayout(gd, turned);

  const turnedPanels = measure(gd);
  if (!turnedPanels) return;
  const gaps = tickLabelGaps(
    turnedPanels,
    boxesOf(gd, ".infolayer .annotation"),
  );
  const spaced: Record<string, number> = {};
  if (gaps.ygap !== undefined) spaced["grid.ygap"] = gaps.ygap;
  if (gaps.xgap !== undefined) spaced["grid.xgap"] = gaps.xgap;
  if (Object.keys(spaced).length) await relayout(gd, spaced);
};
