# @grit42/plots

Plotly figures for grit: bar, box, scatter and time series, with their settings, notices, ranges, hover and annotations. Hosts can add their own plot types on the same shape.

## A plot type

A plot type is a folder `<Type>/`:

| File                 | Holds                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| `utils.ts`           | `build<Type>(data, def, colorMap, properties)`, returning a `PlotBuild` |
| `index.tsx`          | the component: `PlotFigure` with the builder                            |
| `<Type>Settings.tsx` | its settings section                                                    |
| `types.ts`           | its groups and builder result, where it has any                         |

### The builder

Rows go to panels, panels to traces:

1. `buildPanels(data, def, groupsOf)`: the shown panels, each with its rows, its groups and its `axis`.
2. Per row:
   - `seriesLabel(row, def)` names its series.
   - `toFiniteNumber(row[key])` reads its value; an empty cell is no value.
   - Use `columnNumbers(rows, key)` for a whole column.
3. Per panel, `panelTitle(label, axis)` when there are several.
4. Colours come from `seriesColor(colorMap, index)`, numbered across the figure so a series keeps its colour in every panel.
5. Hover:
   - `pointHover(def.hover, properties, fmt)` for points.
   - `cellHover` for heatmap cells.
   - `numberFormat(def.appearance)` gives `fmt`.

A builder returns:

- `{ facets, traces, axes, annotations }`;
- optionally `notices`, for what the type itself left out (outliers, hidden categories);
- optionally `layout`, for extra `composeLayout` options such as `barmode`.

It reads no host columns. A host maps its rows to columns and a seed definition in its own adapter.

### The component

```tsx
const BoxPlot = (props: PlotFigureProps<BoxPlotDefinition>) => (
  <PlotFigure {...props} build={buildBox} scaleAxes={["y"]} />
);
```

`PlotFigure` handles the shared steps:

- It resolves the axis labels.
- It runs the builder, and gives `composeAxes` and `plotNotices` the axes whose scale the definition sets (`scaleAxes`).
- It draws ranges through `composeLayout`.
- A note edit saves the definition as stored.

Its options:

- `readsDisplay`: the type draws the display's summaries, so "Nothing to draw" applies.
- `readsValues(def)`: false where the type places values itself (a count), so no value notices, ticks or ranges.

Host options such as fixed ranges or per-panel colours go through a builder closure.

### Settings

The type's `PlotImplementation` entry gives:

- `PlotSettings`;
- `capabilities` (and `unavailable(def)`);
- `supports(def, ctx)`;
- optionally `sections`, `resetDefaults` and `paletteSwatches`.

## Development

Run through Nx from the workspace root: `pnpm nx run-many -t test typecheck lint:check build -p @grit42/plots`.
